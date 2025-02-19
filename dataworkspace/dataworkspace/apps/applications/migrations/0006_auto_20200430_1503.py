# Generated by Django 3.0.5 on 2020-04-30 15:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("applications", "0005_visualisationapproval")]

    operations = [
        migrations.AlterField(
            model_name="applicationtemplate",
            name="visible",
            field=models.BooleanField(
                default=True,
                help_text="For tools, whether this appears on the Tools page. "
                "For visualisations, whether it's accessible at its production URL.",
            ),
        )
    ]
