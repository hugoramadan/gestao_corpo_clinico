from rest_framework import serializers
from .models import Medico, Especialidade, MedicoEspecialidade


class EspecialidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidade
        fields = ["id", "nome"]


class MedicoEspecialidadeSerializer(serializers.ModelSerializer):
    especialidade_nome = serializers.CharField(source="especialidade.nome", read_only=True)

    class Meta:
        model = MedicoEspecialidade
        fields = ["id", "especialidade", "especialidade_nome", "comprovante", "data_upload"]
        read_only_fields = ["id", "data_upload"]


class MedicoListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem."""
    especialidades = EspecialidadeSerializer(many=True, read_only=True)

    class Meta:
        model = Medico
        fields = [
            "id", "nome_completo", "cpf", "crm_numero", "crm_estado",
            "especialidades", "email", "telefone", "status",
            "foto_perfil", "created_at",
        ]


class MedicoSerializer(serializers.ModelSerializer):
    """Serializer completo para criação/edição/detalhe."""
    comprovantes_especialidade = MedicoEspecialidadeSerializer(many=True, read_only=True)
    especialidades_nomes = EspecialidadeSerializer(source="especialidades", many=True, read_only=True)
    campos_pendentes = serializers.SerializerMethodField()
    cadastro_completo = serializers.SerializerMethodField()

    def get_campos_pendentes(self, obj):
        return obj.campos_pendentes()

    def get_cadastro_completo(self, obj):
        return obj.cadastro_completo()

    class Meta:
        model = Medico
        fields = [
            "id", "user_id",
            # Dados pessoais
            "nome_completo", "cpf", "data_nascimento", "rg_numero", "estado_civil",
            "foto_perfil", "email", "telefone",
            # Endereço
            "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado",
            # Formação
            "instituicao_formacao", "ano_formatura", "link_lattes",
            # CRM
            "crm_numero", "crm_estado",
            "especialidades", "especialidades_nomes",
            # Financeiro
            "tipo_chave_pix", "chave_pix",
            # Documentos
            "cnh", "rg_cpf", "crm_doc",
            "comprovante_endereco",
            "diploma_medico", "declaracao_quitacao_crm", "etica_crm",
            "certidao_casamento", "curriculo_lattes",
            # Status
            "status", "created_at", "updated_at",
            # Comprovantes (via through)
            "comprovantes_especialidade",
            # Completude
            "campos_pendentes", "cadastro_completo",
        ]
        read_only_fields = [
            "id", "user_id", "created_at", "updated_at",
            "comprovantes_especialidade", "especialidades_nomes",
            "campos_pendentes", "cadastro_completo",
        ]

    def validate_cpf(self, value):
        # Remove formatação para validação simples
        digits = value.replace(".", "").replace("-", "")
        if not digits.isdigit() or len(digits) != 11:
            raise serializers.ValidationError("CPF inválido. Informe 11 dígitos numéricos.")
        return value

    def update(self, instance, validated_data):
        result = super().update(instance, validated_data)

        # Reclassifica para "pendente" se o próprio médico editar e o cadastro
        # ficar incompleto (só aplica quando status era "ativo")
        request = self.context.get("request")
        editor_is_owner = (
            request is not None
            and request.user.is_authenticated
            and instance.user is not None
            and request.user == instance.user
        )
        if editor_is_owner and result.status == "ativo" and not result.cadastro_completo():
            result.status = "pendente"
            result.save(update_fields=["status"])

        # Sincroniza is_active do usuário com o status do cadastro médico
        current_status = result.status
        if instance.user is not None:
            expected_active = current_status != "inativo"
            if instance.user.is_active != expected_active:
                instance.user.is_active = expected_active
                instance.user.save(update_fields=["is_active"])

        return result
