from django.conf import settings
from django.urls import include, path

from dataworkspace.apps.accounts.utils import login_required
from dataworkspace.apps.explorer.views import (
    CreateQueryView,
    DataExplorerV2View,
    DeleteQueryView,
    DownloadFromQuerylogView,
    ListQueryLogView,
    ListQueryView,
    PlayQueryView,
    QueryLogResultView,
    QueryView,
    ShareQueryConfirmationView,
    ShareQueryView,
)

urlpatterns = [
    path('', login_required(PlayQueryView.as_view()), name='index'),
    path('v2/', login_required(DataExplorerV2View.as_view()), name='v2'),
    path(
        'download/<int:querylog_id>',
        login_required(DownloadFromQuerylogView.as_view()),
        name='download_querylog',
    ),
    path('queries/', login_required(ListQueryView.as_view()), name='list_queries'),
    path(
        'queries/create/',
        login_required(CreateQueryView.as_view()),
        name='query_create',
    ),
    path(
        'queries/<int:query_id>/',
        login_required(QueryView.as_view()),
        name='query_detail',
    ),
    path(
        'queries/<int:pk>/delete/',
        login_required(DeleteQueryView.as_view()),
        name='query_delete',
    ),
    path('logs/', login_required(ListQueryLogView.as_view()), name='explorer_logs'),
    path(
        'logs/<int:querylog_id>/results-json/',
        login_required(QueryLogResultView.as_view()),
        name='querylog_results',
    ),
    path(
        'queries/share/', login_required(ShareQueryView.as_view()), name='share_query',
    ),
    path(
        'queries/share/confirmation/<int:recipient_id>',
        login_required(ShareQueryConfirmationView.as_view()),
        name='share_query_confirmation',
    ),
    path(
        'api/',
        include(
            ('dataworkspace.apps.explorer.api_urls', 'explorer_api'),
            namespace='explorer-api',
        ),
    ),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
