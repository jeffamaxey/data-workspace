from django.urls import path

from dataworkspace.apps.accounts.utils import login_required
from dataworkspace.apps.explorer.charts.views import (
    ChartBuilderCreateView,
    ChartBuilderEditView,
    ChartQueryResultsView,
    ChartQueryStatusView,
)

urlpatterns = [
    path(
        "create/<int:query_log_id>/",
        login_required(ChartBuilderCreateView.as_view()),
        name="create-chart",
    ),
    path(
        "edit/<uuid:chart_id>/",
        login_required(ChartBuilderEditView.as_view()),
        name="edit-chart",
    ),
    path(
        "query-status/<uuid:chart_id>/",
        login_required(ChartQueryStatusView.as_view()),
        name="chart-query-status",
    ),
    path(
        "query-results/<uuid:chart_id>/",
        login_required(ChartQueryResultsView.as_view()),
        name="chart-query-results",
    ),
]
