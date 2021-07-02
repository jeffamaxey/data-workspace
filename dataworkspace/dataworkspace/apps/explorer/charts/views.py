from csp.decorators import csp_exempt
from django.views.generic import TemplateView


class ChartBuilderCreateView(TemplateView):
    template_name = "explorer/charts/chart_builder.html"

    @csp_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
