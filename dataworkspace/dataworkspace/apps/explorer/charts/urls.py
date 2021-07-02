from django.urls import path

from dataworkspace.apps.accounts.utils import login_required
from dataworkspace.apps.explorer.charts.views import ChartBuilderCreateView

urlpatterns = [
    path("create", login_required(ChartBuilderCreateView.as_view()), name="create-chart"),
]
