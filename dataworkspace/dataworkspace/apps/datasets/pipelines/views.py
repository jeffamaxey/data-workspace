import requests, json
from django.contrib import messages
from django.contrib.auth.mixins import UserPassesTestMixin
from django.urls.base import reverse_lazy
from django.views.generic import DetailView
from django.conf import settings
from django.views.generic.list import ListView
from django.views.generic.edit import CreateView, DeleteView, UpdateView
from django.urls import reverse

from mohawk import Sender

from dataworkspace.apps.datasets.models import Pipeline
from dataworkspace.apps.datasets.pipelines.forms import PipelineCreateForm, PipelineEditForm


class PipelineCreateView(CreateView):
    model = Pipeline
    form_class = PipelineCreateForm
    template_name = "datasets/pipelines/pipeline_detail.html"

    def get_success_url(self):
        return reverse("pipelines:index")

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        messages.success(self.request, "Pipeline created successfully.")
        return super().form_valid(form)


class PipelineUpdateView(UpdateView, UserPassesTestMixin):
    model = Pipeline
    form_class = PipelineEditForm
    template_name = "datasets/pipelines/pipeline_detail.html"

    def test_func(self):
        return self.request.user.is_superuser

    def get_success_url(self):
        return reverse("pipelines:index")

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        messages.success(self.request, "Pipeline updated successfully.")
        return super().form_valid(form)


class PipelineListView(ListView, UserPassesTestMixin):
    model = Pipeline
    template_name = "datasets/pipelines/list.html"

    def test_func(self):
        return self.request.user.is_superuser


class PipelineDeleteView(DeleteView, UserPassesTestMixin):
    model = Pipeline
    template_name = "datasets/pipelines/delete.html"
    success_url = reverse_lazy("pipelines:index")

    def test_func(self):
        return self.request.user.is_superuser

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, "Pipeline deleted successfully.")
        return super().delete(request, *args, **kwargs)



class PipelineLogsDetailView(DetailView, UserPassesTestMixin):
    model = Pipeline
    template_name = "datasets/pipelines/logs.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["log"] = self._get_api_log()
        return context

    def _get_api_log(self):
        derived_pipeline_object = self.object
        derived_pipeline_table_name = derived_pipeline_object.table_name

        # pipeline_name = "AppleCovid19MobilityTrendsPipeline"
        pipeline_name = f"DerivedPipeline-{derived_pipeline_table_name}"

        config = settings.DATAFLOW_API_CONFIG
        url = (
            f'{config["DATAFLOW_BASE_URL"]}/api/experimental/derived-dags/dag/'
            f'{pipeline_name}/logs'
        )

        hawk_creds = {
            "id": config["DATAFLOW_HAWK_ID"],
            "key": config["DATAFLOW_HAWK_KEY"],
            "algorithm": "sha256",
        }
        header = Sender(hawk_creds, url, "get", content="",
                        content_type="").request_header

        response = requests.get(url, headers={"Authorization": header,
                                              "Content-Type": ""})
        if response.status_code != 200:
            return "Error"

        try:
            json_data = response.json()
        except json.JSONDecodeError:
            return response.text

        processed_data = json_data

        return processed_data


    def test_func(self):
        return self.request.user.is_superuser


