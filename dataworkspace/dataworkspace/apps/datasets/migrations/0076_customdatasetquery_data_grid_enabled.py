# Generated by Django 3.0.12 on 2021-05-06 12:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0075_auto_20210504_1056'),
    ]

    operations = [
        migrations.AddField(
            model_name='customdatasetquery',
            name='data_grid_enabled',
            field=models.BooleanField(
                default=False,
                help_text='Allow users to filter, sort and export data from within the browser',
            ),
        ),
    ]
