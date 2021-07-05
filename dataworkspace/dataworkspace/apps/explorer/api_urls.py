from django.urls import path

from dataworkspace.apps.accounts.utils import login_required
from dataworkspace.apps.explorer.api_views import (
    QueryLogResultsView,
    QueryLogStatusView,
    RunQueryView,
    ShareQueryView,
    UserEmailSearchView,
    UserQueriesView,
    UserSchemasView,
)

urlpatterns = [
    path(
        'user-schemas', login_required(UserSchemasView.as_view()), name='user-schemas'
    ),
    path(
        'user-queries', login_required(UserQueriesView.as_view()), name='user-queries'
    ),
    path(
        'user-queries/<int:query_id>',
        login_required(UserQueriesView.as_view()),
        name='user-query',
    ),
    path('run-query', login_required(RunQueryView.as_view()), name='run-query'),
    path(
        'query-status/<int:query_log_id>',
        login_required(QueryLogStatusView.as_view()),
        name='query-status',
    ),
    path(
        'query-results/<int:query_log_id>',
        login_required(QueryLogResultsView.as_view()),
        name='query-results',
    ),
    path(
        'user-emails',
        login_required(UserEmailSearchView.as_view()),
        name='user-emails',
    ),
    path('share-query', login_required(ShareQueryView.as_view()), name='share-query',),
]
