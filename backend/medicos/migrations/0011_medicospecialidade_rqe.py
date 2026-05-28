from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0010_split_status_ativo"),
    ]

    operations = [
        migrations.AddField(
            model_name="medicoespecialidade",
            name="rqe_numero",
            field=models.CharField(blank=True, default='', max_length=20, verbose_name="Número do RQE"),
        ),
        migrations.AddField(
            model_name="medicoespecialidade",
            name="sem_rqe",
            field=models.BooleanField(default=False, verbose_name="Não possui RQE"),
        ),
    ]
