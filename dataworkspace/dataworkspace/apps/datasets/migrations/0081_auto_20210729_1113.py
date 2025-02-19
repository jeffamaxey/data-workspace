# Generated by Django 3.2.4 on 2021-07-29 11:13

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0080_auto_20210611_0932"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataset",
            name="authorized_email_domains",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=256),
                blank=True,
                default=list,
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="visualisationcatalogueitem",
            name="authorized_email_domains",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=256),
                blank=True,
                default=list,
                size=None,
            ),
        ),
    ]
