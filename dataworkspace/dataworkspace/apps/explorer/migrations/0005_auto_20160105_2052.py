# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-01-05 20:52
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("explorer", "0004_querylog_duration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="query",
            name="snapshot",
            field=models.BooleanField(
                default=False, help_text="Include in snapshot task (if enabled)"
            ),
        ),
    ]
