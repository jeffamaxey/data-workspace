# Generated by Django 3.0.8 on 2021-04-17 14:10

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0073_auto_20210419_1639"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataSetBookmark",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to="datasets.DataSet",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "app_datasetbookmark",
                "unique_together": {("user", "dataset")},
            },
        ),
        migrations.CreateModel(
            name="ReferenceDataSetBookmark",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "reference_dataset",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to="datasets.ReferenceDataset",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "app_referencedatasetbookmark",
                "unique_together": {("user", "reference_dataset")},
            },
        ),
        migrations.CreateModel(
            name="VisualisationBookmark",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "visualisation",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to="datasets.VisualisationCatalogueItem",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "app_visualisationbookmark",
                "unique_together": {("user", "visualisation")},
            },
        ),
    ]
