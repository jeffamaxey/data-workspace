# Generated by Django 3.2.4 on 2021-08-02 09:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0083_merge_20210730_1531'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sourcetable',
            name='data_grid_column_config',
            field=models.JSONField(
                blank=True,
                help_text='Must be a json object with a `columns` key containing a list of json '
                'objects defining:\n\n- "field": "[column name]" (required)\n- '
                '"headerName": "[pretty column name]" (optional, defaults to "field")\n- '
                '"sortable": [true|false] (optional, default: true)\n- '
                '"filter": "[true|false|ag-grid filter name]" (optional, default: true)'
                '\n\nOptionally can include the fields:\n\n- '
                '"download_enabled" (defaults to false)\n- "download_limit" (defaults to 5000 rows)',
                null=True,
            ),
        ),
    ]
