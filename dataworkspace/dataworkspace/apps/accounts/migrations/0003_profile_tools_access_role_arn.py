# Generated by Django 3.0.8 on 2020-10-28 16:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_profile_home_directory_efs_access_point_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="tools_access_role_arn",
            field=models.TextField(blank=True, default=""),
        ),
    ]
