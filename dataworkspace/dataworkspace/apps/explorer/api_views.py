import json
from collections import defaultdict

import psycopg2
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from psycopg2 import sql

from dataworkspace import datasets_db
from dataworkspace.apps.core.utils import (
    USER_SCHEMA_STEM,
    db_role_schema_suffix_for_user,
    streaming_query_response,
)
from dataworkspace.apps.datasets.constants import GRID_DATA_TYPE_MAP
from dataworkspace.apps.datasets.utils import build_filtered_dataset_query
from dataworkspace.apps.explorer.forms import QueryForm
from dataworkspace.apps.explorer.models import Query, QueryLog
from dataworkspace.apps.explorer.schema import schema_info
from dataworkspace.apps.explorer.tasks import submit_query_for_execution
from dataworkspace.apps.explorer.utils import (
    QueryException,
    get_user_explorer_connection_settings,
    tempory_query_table_name,
    user_explorer_connection,
)


class UserSchemasView(View):
    def get(self, request):
        user_tables = schema_info(
            user=request.user, connection_alias=settings.EXPLORER_DEFAULT_CONNECTION
        )
        schemas = defaultdict(list)
        for table in user_tables:
            schemas[table.name.schema].append(table.name.name)

        return JsonResponse(
            [
                {'schema': schema, 'tables': tables}
                for (schema, tables) in schemas.items()
            ],
            safe=False,
        )


class UserQueriesView(View):
    def get(self, request):
        return JsonResponse(
            [
                {
                    'id': q.id,
                    'name': q.title,
                    'description': q.description,
                    'query': q.sql,
                }
                for q in Query.objects.filter(created_by_user=request.user)
                .all()
                .order_by('title')
            ],
            safe=False,
        )

    def post(self, request):
        post_data = json.loads(request.body)
        query = Query.objects.create(
            created_by_user=request.user,
            title=post_data.get('name'),
            description=post_data.get('description'),
            sql=post_data.get('sql'),
            connection=settings.EXPLORER_DEFAULT_CONNECTION,
        )
        return JsonResponse({'id': query.id})

    def put(self, request, query_id):
        post_data = json.loads(request.body)
        try:
            query = Query.objects.get(pk=query_id, created_by_user=request.user)
        except Query.DoesNotExist:
            return JsonResponse(404, status=404)
        query.title = post_data.get('name')
        query.description = post_data.get('description')
        query.sql = post_data.get('sql')
        query.save()
        return JsonResponse({'id': query.id})

    def delete(self, request, query_id):
        try:
            query = Query.objects.get(pk=query_id, created_by_user=request.user)
        except Query.DoesNotExist:
            return JsonResponse({}, status=404)
        query.delete()
        return JsonResponse({})


class RunQueryView(View):
    connection = 'datasets'

    def post(self, request):
        post_data = json.loads(request.body)
        query = Query(
            sql=post_data.get('query'), title="Playground", connection='datasets'
        )
        form = QueryForm(
            {
                'sql': post_data.get('query'),
                'title': 'Playground',
                'connection': 'datasets',
            }
        )
        if not form.is_valid():
            return JsonResponse(
                {'error': dict(form.errors).get('sql', ['Unknown error'])[0]},
                safe=False,
            )

        try:
            query_log = submit_query_for_execution(
                query.final_sql(),
                query.connection,
                query.id,
                request.user.id,
                1,
                settings.EXPLORER_DEFAULT_ROWS,
                settings.EXPLORER_QUERY_TIMEOUT_MS,
            )
            return JsonResponse({'query_log_id': query_log.id})
        except QueryException as e:
            return JsonResponse({'error': str(e)})


class QueryLogStatusView(View):
    def get(self, request, query_log_id):
        try:
            query_log = QueryLog.objects.get(pk=query_log_id, run_by_user=request.user)
            state = query_log.state
            error = query_log.error
        except QueryLog.DoesNotExist:
            error = 'Error fetching results. Please try running your query again.'

        return JsonResponse({'state': state, 'error': error})


class QueryLogResultsView(View):
    def _get_table_details(self, query_log):
        schema_name = (
            f'{USER_SCHEMA_STEM}{db_role_schema_suffix_for_user(self.request.user)}'
        )
        return schema_name, f'_data_explorer_tmp_query_{query_log.id}'

    def _get_rows(self, connection, query, params):
        user_connection_settings = get_user_explorer_connection_settings(
            self.request.user, connection
        )
        with user_explorer_connection(user_connection_settings) as conn:
            with conn.cursor(
                name='query-log-data', cursor_factory=psycopg2.extras.RealDictCursor,
            ) as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()

    def _get_column_config(self, connection, query):
        column_config = []
        for column in datasets_db.get_columns(
            connection, query=str(query), include_types=True,
        ):
            column_config.append(
                {
                    'field': column[0],
                    'filter': True,
                    'sortable': True,
                    'dataType': GRID_DATA_TYPE_MAP.get(column[1], column[1]),
                }
            )
        return column_config

    def post(self, request, query_log_id):
        try:
            query_log = QueryLog.objects.get(pk=query_log_id, run_by_user=request.user)
        except QueryLog.DoesNotExist:
            return JsonResponse(data={}, status=404)

        column_config = self._get_column_config(
            query_log.connection,
            f'SELECT * FROM {tempory_query_table_name(request.user, query_log_id)}',
        )

        if request.GET.get('download'):
            filters = {}
            for filter_data in [json.loads(x) for x in request.POST.getlist('filters')]:
                filters.update(filter_data)
            column_config = [
                x
                for x in column_config
                if x['field'] in request.POST.getlist('columns', [])
            ]
            if not column_config:
                return JsonResponse({}, status=400)

            post_data = {
                'filters': filters,
                'limit': None,
                'sortDir': request.POST.get('sortDir', 'ASC'),
                'sortField': request.POST.get('sortField', column_config[0]['field']),
            }
        else:
            post_data = json.loads(request.body.decode('utf-8'))
            post_data['limit'] = min(post_data.get('limit', 100), 100)

        schema, table = self._get_table_details(query_log)
        query = sql.SQL('SELECT * from {}.{}').format(
            sql.Identifier(schema), sql.Identifier(table)
        )
        query, params = build_filtered_dataset_query(query, column_config, post_data)

        if request.GET.get('download'):
            return streaming_query_response(
                request.user.email,
                'datasets',
                query,
                request.POST.get('export_file_name', 'data-explorer-export.csv'),
                params,
            )

        return JsonResponse(
            {
                'total_rows': query_log.rows,
                'duration': query_log.duration,
                'page': query_log.page,
                'column_config': column_config,
                'data': self._get_rows(query_log.connection, query, params),
            }
        )
