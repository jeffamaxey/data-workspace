# Generated by Django 3.2.11 on 2022-01-27 13:58

import dataworkspace.apps.core.storage
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("case_studies", "0005_alter_casestudy_image"),
    ]

    operations = [
        migrations.AlterField(
            model_name="casestudy",
            name="image",
            field=models.FileField(
                blank=True,
                storage=dataworkspace.apps.core.storage.S3FileStorage(location="case-studies"),
                upload_to="",
                validators=[
                    dataworkspace.apps.core.storage.malware_file_validator,
                    django.core.validators.FileExtensionValidator(
                        ["bmp", "doc", "docx", "bmp", "jpeg", "jpg", "pdf"]
                    ),
                ],
            ),
        ),
    ]
