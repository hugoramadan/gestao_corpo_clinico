from django.contrib import admin
from .models import Medico, Especialidade, MedicoEspecialidade


class MedicoEspecialidadeInline(admin.TabularInline):
    model = MedicoEspecialidade
    extra = 0


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ["nome_completo", "cpf", "crm_numero", "crm_estado", "status", "created_at"]
    list_filter = ["status", "crm_estado"]
    search_fields = ["nome_completo", "cpf", "crm_numero", "email"]
    ordering = ["nome_completo"]
    inlines = [MedicoEspecialidadeInline]
    fieldsets = (
        ("Dados Pessoais", {
            "fields": ("user", "nome_completo", "cpf", "data_nascimento", "foto_perfil", "email", "telefone")
        }),
        ("Endereço", {
            "fields": ("cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado")
        }),
        ("Formação", {
            "fields": ("instituicao_formacao", "ano_formatura", "link_lattes")
        }),
        ("CRM", {
            "fields": ("crm_numero", "crm_estado")
        }),
        ("Financeiro", {
            "fields": ("tipo_chave_pix", "chave_pix")
        }),
        ("Documentos", {
            "fields": ("diploma_medico", "declaracao_quitacao_crm", "etica_crm")
        }),
        ("Status", {
            "fields": ("status",)
        }),
    )


@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ["nome"]
    search_fields = ["nome"]


@admin.register(MedicoEspecialidade)
class MedicoEspecialidadeAdmin(admin.ModelAdmin):
    list_display = ["medico", "especialidade", "data_upload"]
    list_filter = ["especialidade"]
