from __future__ import unicode_literals

import logging
import re
import uuid
from collections import defaultdict

import psycopg2
from psycopg2 import sql

from django.conf import settings
from django.db import connections, models
from django.urls import reverse
from dynamic_models.models import AbstractFieldSchema, AbstractModelSchema  # noqa: I202

from dataworkspace.apps.core.utils import USER_SCHEMA_STEM, db_role_schema_suffix_for_user
from dataworkspace.apps.core.models import TimeStampedUserModel
from dataworkspace.apps.explorer.constants import QueryLogState


logger = logging.getLogger(__name__)


def swap_params(sql, params):
    p = params.items() if params else {}
    for k, v in p:
        regex = re.compile(r"\$\$%s(?:\:([^\$]+))?\$\$" % str(k).lower(), re.I)
        sql = regex.sub(str(v), sql)
    return sql


def extract_params(text):
    regex = re.compile(r"\$\$([a-z0-9_]+)(?:\:([^\$]+))?\$\$")
    params = re.findall(regex, text.lower())
    return {p[0]: p[1] if len(p) > 1 else "" for p in params}


def shared_dict_update(target, source):
    for k_d1 in target:
        if k_d1 in source:
            target[k_d1] = source[k_d1]
    return target


def get_params_for_url(query):  # pylint: disable=inconsistent-return-statements
    if query.params:
        return "|".join(["%s:%s" % (p, v) for p, v in query.params.items()])


class PlaygroundSQL(models.Model):
    """All records in this field are transient and shouldn't be relied upon. These are used to facilitate
    post-redirect-get flow when moving from 'building a query' to 'saving a query', which has an intermediate
    dialogue page that needs to be populated. Originally this passed SQL through URL query parameters, but
    our proxy (and some old browser) don't support long URLs (>2000 bytes) so we need to use POSTs."""

    id = models.AutoField(primary_key=True)
    sql = models.TextField()
    created_at = models.DateTimeField(auto_now=True)
    created_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=False, blank=False, on_delete=models.CASCADE
    )

    def get_absolute_url(self):
        return f"{reverse('explorer:index')}?play_id={self.id}"


class Query(models.Model):
    title = models.CharField(max_length=255)
    sql = models.TextField()
    description = models.TextField(null=True, blank=True)
    created_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_run_date = models.DateTimeField(auto_now=True)
    connection = models.CharField(
        max_length=128,
        help_text="Name of DB connection (as specified in settings) to use for this query.",
    )

    def __init__(self, *args, **kwargs):
        self.params = kwargs.get("params")
        kwargs.pop("params", None)
        # pylint: disable=super-with-arguments
        super(Query, self).__init__(*args, **kwargs)

    class Meta:
        ordering = ["title"]
        verbose_name_plural = "Queries"

    def __str__(self):
        return self.title

    def get_run_count(self):
        return self.querylog_set.count()

    def avg_duration(self):
        return self.querylog_set.aggregate(models.Avg("duration"))["duration__avg"]

    def final_sql(self):
        return swap_params(self.sql, self.available_params())

    def available_params(self):
        """
        Merge parameter values into a dictionary of available parameters

        :param param_values: A dictionary of Query param values.
        :return: A merged dictionary of parameter names and values.
         Values of non-existent parameters are removed.
        """

        p = extract_params(self.sql)
        if self.params:
            shared_dict_update(p, self.params)
        return p

    def get_absolute_url(self):
        return reverse("explorer:query_detail", kwargs={"query_id": self.id})

    @property
    def params_for_url(self):
        return get_params_for_url(self)


class QueryLog(models.Model):
    sql = models.TextField(null=True, blank=True)
    query = models.ForeignKey(Query, null=True, blank=True, on_delete=models.SET_NULL)
    run_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE
    )
    run_at = models.DateTimeField(auto_now_add=True)
    duration = models.FloatField(blank=True, null=True)  # milliseconds
    connection = models.CharField(max_length=128)
    state = models.IntegerField(choices=QueryLogState.choices, default=QueryLogState.RUNNING)
    rows = models.IntegerField(null=True, blank=True)
    page = models.IntegerField(default=1)
    page_size = models.IntegerField(default=settings.EXPLORER_DEFAULT_ROWS, null=True)
    error = models.TextField(null=True, blank=True)

    @property
    def is_playground(self):
        return self.query_id is None

    @property
    def title(self):
        if self.query is not None:
            return self.query.title

        return f"Playground - {self.sql[:32]}"

    class Meta:
        ordering = ["-run_at"]


class ModelSchema(AbstractModelSchema):
    name = models.CharField(max_length=256, unique=True)


class FieldSchema(AbstractFieldSchema):
    name = models.CharField(max_length=256, unique=True)


class ChartBuilderChart(TimeStampedUserModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    query_log = models.ForeignKey(QueryLog, related_name="chart", on_delete=models.PROTECT)
    original_query_log = models.ForeignKey(QueryLog, related_name="+", on_delete=models.DO_NOTHING)
    chart_config = models.JSONField(null=True)

    class Meta:
        ordering = ("-created_date",)

    def __str__(self):
        return f"{self.title} ({self.created_by.get_full_name()})"

    def get_edit_url(self):
        return reverse("explorer:explorer-charts:edit-chart", args=(self.id,))

    def get_table_details(self):
        schema_name = f"{USER_SCHEMA_STEM}{db_role_schema_suffix_for_user(self.created_by)}"
        return schema_name, f"_chart_builder_tmp_{self.query_log.id}"

    def get_table_data(self, columns=None):
        schema, table = self.get_table_details()
        query = sql.SQL("SELECT {} from {}.{}").format(
            sql.SQL(",").join(map(sql.Identifier, columns))
            if columns is not None
            else sql.SQL("*"),
            sql.Identifier(schema),
            sql.Identifier(table),
        )
        conn = connections[self.query_log.connection]
        conn.ensure_connection()
        cursor = conn.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query)
        data = defaultdict(list)
        for row in cursor.fetchall():
            for k, v in row.items():
                data[k].append(v)
        return data

    def get_required_columns(self):
        columns = []
        for trace in self.chart_config.get("traces", []):
            for column_name in trace["meta"].get("columnNames", {}).values():
                columns.append(column_name)
            if trace.get("textsrc", None) is not None:
                columns.append(trace["textsrc"])
        return columns

    def is_published(self):
        return self.datasets.count() > 0
