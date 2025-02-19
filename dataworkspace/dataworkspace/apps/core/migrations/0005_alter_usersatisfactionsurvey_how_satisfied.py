# Generated by Django 3.2.4 on 2021-11-04 20:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_auto_20210615_1619"),
    ]

    operations = [
        migrations.AlterField(
            model_name="usersatisfactionsurvey",
            name="how_satisfied",
            field=models.CharField(
                choices=[
                    ("very-satified", "Very satisfied"),
                    ("satified", "Satisfied"),
                    ("neither", "Neither satisfied nor dissatisfied"),
                    ("dissatisfied", "Dissatisfied"),
                    ("very-dissatisfied", "Very dissatisfied"),
                ],
                max_length=32,
            ),
        ),
    ]
