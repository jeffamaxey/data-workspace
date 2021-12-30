from collections import defaultdict

import psycopg2
from csp.decorators import csp_exempt
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views import View
from django.views.generic import RedirectView
from psycopg2 import sql

from dataworkspace import datasets_db
from dataworkspace.apps.core.utils import USER_SCHEMA_STEM, db_role_schema_suffix_for_user
from dataworkspace.apps.explorer.constants import QueryLogState
from dataworkspace.apps.explorer.models import ChartBuilderChart, QueryLog
from dataworkspace.apps.explorer.tasks import submit_query_for_execution
from dataworkspace.apps.explorer.utils import (
    get_user_explorer_connection_settings,
    user_explorer_connection,
)


class ChartBuilderCreateView(RedirectView):
    def get_redirect_url(self, *args, **kwargs):
        # Given a data explorer query log we need to save the results
        # of the full query to a database table to allow us to query
        # it directly from the chart builder ui.
        original_query_log = get_object_or_404(
            QueryLog, pk=kwargs["query_log_id"], run_by_user=self.request.user
        )

        # If we've already created a chart from this query then use
        # the existing model
        try:
            chart = ChartBuilderChart.objects.get(
                created_by=self.request.user, original_query_log=original_query_log
            )
        except ChartBuilderChart.DoesNotExist:
            # Otherwise create a new chart and execute the query
            # We need to re-execute the query to get all the records into the output table
            query_log = submit_query_for_execution(
                original_query_log.sql,
                original_query_log.connection,
                original_query_log.query_id,
                self.request.user.id,
                1,
                None,
                settings.EXPLORER_QUERY_TIMEOUT_MS,
            )
            chart = ChartBuilderChart.objects.create(
                created_by=self.request.user,
                query_log=query_log,
                original_query_log_id=kwargs["query_log_id"],
            )

        return chart.get_edit_url()


class ChartBuilderEditView(View):
    template_name = "explorer/charts/chart_builder.html"

    @csp_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get(self, request, chart_id):
        chart = get_object_or_404(ChartBuilderChart, created_by=request.user, pk=chart_id)
        return render(
            request,
            self.template_name,
            context={"chart": chart},
        )


class ChartQueryStatusView(View):
    def get(self, request, chart_id):
        try:
            chart = ChartBuilderChart.objects.get(created_by=request.user, pk=chart_id)
        except ChartBuilderChart.DoesNotExist:
            return JsonResponse({"state": QueryLogState.FAILED, "error": "Query does not exist"})

        return JsonResponse(
            {
                "state": chart.query_log.state,
                "error": chart.query_log.error,
                "columns": datasets_db.get_columns(
                    chart.query_log.connection, query=str(chart.query_log.sql)
                )
                if chart.query_log.state == QueryLogState.COMPLETE
                else [],
            }
        )


class ChartQueryResultsView(View):
    def _get_table_details(self, query_log):
        schema_name = f"{USER_SCHEMA_STEM}{db_role_schema_suffix_for_user(self.request.user)}"
        return schema_name, f"_data_explorer_tmp_query_{query_log.id}"

    def _get_rows(self, chart, columns):
        schema, table = self._get_table_details(chart.query_log)
        query = sql.SQL("SELECT {} from {}.{}").format(
            psycopg2.sql.SQL(",").join(map(psycopg2.sql.Identifier, columns)),
            sql.Identifier(schema),
            sql.Identifier(table),
        )
        user_connection_settings = get_user_explorer_connection_settings(
            self.request.user, chart.query_log.connection
        )
        with user_explorer_connection(user_connection_settings) as conn:
            with conn.cursor(
                name="query-log-data",
                cursor_factory=psycopg2.extras.RealDictCursor,
            ) as cursor:
                cursor.execute(query)
                data = defaultdict(list)
                for row in cursor.fetchall():
                    for k, v in row.items():
                        data[k].append(v)
                return data

    def get(self, request, chart_id):
        chart = get_object_or_404(ChartBuilderChart, created_by=request.user, pk=chart_id)
        columns = request.GET.get("columns", "").split(",")
        return JsonResponse(
            {
                "total_rows": chart.query_log.rows,
                "duration": chart.query_log.duration,
                "data": self._get_rows(chart, columns),
            }
        )
