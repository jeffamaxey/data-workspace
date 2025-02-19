# Generated by Django 3.0.8 on 2020-12-22 15:21

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0065_merge_20201222_1521"),
    ]

    operations = [
        migrations.AlterField(
            model_name="toolqueryauditlogtable",
            name="schema",
            field=models.CharField(
                default="public",
                max_length=63,
                validators=[
                    django.core.validators.RegexValidator(regex="^[a-zA-Z][a-zA-Z0-9_\\.]*$")
                ],
            ),
        ),
        migrations.AlterField(
            model_name="toolqueryauditlogtable",
            name="table",
            field=models.CharField(
                max_length=63,
                validators=[
                    django.core.validators.RegexValidator(regex="^[a-zA-Z][a-zA-Z0-9_\\.]*$")
                ],
            ),
        ),
    ]
