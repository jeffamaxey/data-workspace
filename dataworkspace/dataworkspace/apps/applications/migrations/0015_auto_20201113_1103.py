# Generated by Django 3.0.8 on 2020-11-13 11:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0014_usertoolconfiguration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="usertoolconfiguration",
            name="size",
            field=models.IntegerField(
                choices=[(1, "Small"), (2, "Medium"), (3, "Large"), (4, "Extra Large")],
                default=2,
            ),
        ),
    ]
