from django.db import migrations, models
import medicos.models


class Migration(migrations.Migration):

    dependencies = [
        ("medicos", "0003_add_rg_comprovante_endereco"),
    ]

    operations = [
        # Remove o campo antigo rg (único arquivo) e adiciona rg_frente + rg_verso
        migrations.RemoveField(
            model_name="medico",
            name="rg",
        ),
        # Dados pessoais
        migrations.AddField(
            model_name="medico",
            name="rg_numero",
            field=models.CharField(blank=True, max_length=20, verbose_name="RG"),
        ),
        migrations.AddField(
            model_name="medico",
            name="estado_civil",
            field=models.CharField(
                blank=True,
                choices=[
                    ("solteiro", "Solteiro(a)"),
                    ("uniao_estavel", "União Estável"),
                    ("casado_separacao_total", "Casado(a) - separação total de bens"),
                    ("casado_comunhao_total", "Casado(a) - comunhão total de bens"),
                    ("casado_comunhao_parcial", "Casado(a) - comunhão parcial de bens"),
                    ("divorciado", "Divorciado(a)"),
                    ("separado", "Separado(a)"),
                    ("viuvo", "Viúvo(a)"),
                ],
                max_length=30,
                verbose_name="Estado civil",
            ),
        ),
        # Documentos
        migrations.AddField(
            model_name="medico",
            name="cnh",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_cnh, verbose_name="CNH"),
        ),
        migrations.AddField(
            model_name="medico",
            name="cpf_doc",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_cpf_doc, verbose_name="CPF (documento)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="rg_frente",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_rg_frente, verbose_name="RG (frente)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="rg_verso",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_rg_verso, verbose_name="RG (verso)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="crm_frente",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_crm_frente, verbose_name="CRM (frente)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="crm_verso",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_crm_verso, verbose_name="CRM (verso)"),
        ),
        migrations.AddField(
            model_name="medico",
            name="certidao_casamento",
            field=models.FileField(blank=True, null=True, upload_to=medicos.models.upload_certidao_casamento, verbose_name="Certidão de Casamento"),
        ),
    ]
