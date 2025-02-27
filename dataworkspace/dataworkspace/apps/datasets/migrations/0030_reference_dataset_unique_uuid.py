# Generated by Django 2.2.8 on 2019-12-18 15:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("datasets", "0029_reference_dataset_add_uuid")]
    operations = [
        # Drop foreign key constraint on ReferenceDatasetField.reference_dataset
        migrations.AlterField(
            model_name="referencedatasetfield",
            name="reference_dataset",
            field=models.ForeignKey(
                "ReferenceDataset",
                db_constraint=False,
                db_index=False,
                null=False,
                on_delete=models.CASCADE,
            ),
        )
    ]
