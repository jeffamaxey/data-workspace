# Generated by Django 3.0.8 on 2020-12-22 09:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0064_drop_audit_log_constraints"),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE UNIQUE INDEX tool_query_audit_log_unique "
            "ON datasets_toolqueryauditlog (rolename, timestamp, MD5(query_sql))",
            reverse_sql="DROP INDEX tool_query_audit_log_unique",
        )
    ]
