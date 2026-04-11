from django.db import models
from django.conf import settings


UF_CHOICES = [
    ("AC", "AC"), ("AL", "AL"), ("AP", "AP"), ("AM", "AM"), ("BA", "BA"),
    ("CE", "CE"), ("DF", "DF"), ("ES", "ES"), ("GO", "GO"), ("MA", "MA"),
    ("MT", "MT"), ("MS", "MS"), ("MG", "MG"), ("PA", "PA"), ("PB", "PB"),
    ("PR", "PR"), ("PE", "PE"), ("PI", "PI"), ("RJ", "RJ"), ("RN", "RN"),
    ("RS", "RS"), ("RO", "RO"), ("RR", "RR"), ("SC", "SC"), ("SP", "SP"),
    ("SE", "SE"), ("TO", "TO"),
]

ESTADO_CIVIL_CHOICES = [
    ("solteiro", "Solteiro(a)"),
    ("uniao_estavel", "União Estável"),
    ("casado_separacao_total", "Casado(a) - separação total de bens"),
    ("casado_comunhao_total", "Casado(a) - comunhão total de bens"),
    ("casado_comunhao_parcial", "Casado(a) - comunhão parcial de bens"),
    ("divorciado", "Divorciado(a)"),
    ("separado", "Separado(a)"),
    ("viuvo", "Viúvo(a)"),
]

# Campos obrigatórios para ativação do cadastro
CAMPOS_OBRIGATORIOS = [
    # Dados pessoais
    ("data_nascimento", "Data de nascimento"),
    ("estado_civil", "Estado civil"),
    ("email", "E-mail"),
    ("telefone", "Telefone"),
    ("rg_numero", "Número do RG"),
    # Endereço
    ("cep", "CEP"),
    ("logradouro", "Logradouro"),
    ("numero", "Número"),
    ("bairro", "Bairro"),
    ("cidade", "Cidade"),
    ("estado", "Estado"),
    # Formação
    ("instituicao_formacao", "Instituição de formação"),
    ("ano_formatura", "Ano de formatura"),
    ("link_lattes", "Link Currículo Lattes"),
    # CRM
    ("crm_numero", "Número do CRM"),
    ("crm_estado", "Estado do CRM"),
    # Financeiro
    ("tipo_chave_pix", "Tipo de chave PIX"),
    ("chave_pix", "Chave PIX"),
    # Documentos
    ("cnh", "CNH"),
    ("rg_cpf", "RG e CPF"),
    ("crm_doc", "CRM"),
    ("comprovante_endereco", "Comprovante de endereço"),
    ("diploma_medico", "Diploma médico"),
    ("declaracao_quitacao_crm", "Certidão de regularidade fiscal CRM"),
    ("etica_crm", "Certidão Ético-profissional CRM"),
    ("curriculo_lattes", "Currículo Lattes resumido atualizado"),
]


def upload_foto(instance, filename):
    return f"medicos/{instance.pk}/foto/{filename}"


def upload_diploma(instance, filename):
    return f"medicos/{instance.pk}/diploma/{filename}"


def upload_rg(instance, filename):
    return f"medicos/{instance.pk}/rg/{filename}"


def upload_crm_doc(instance, filename):
    return f"medicos/{instance.pk}/crm/{filename}"


def upload_cnh(instance, filename):
    return f"medicos/{instance.pk}/cnh/{filename}"


def upload_rg_cpf(instance, filename):
    return f"medicos/{instance.pk}/rg_cpf/{filename}"


# Mantidos para compatibilidade com histórico de migrations
def upload_cpf_doc(instance, filename):
    return f"medicos/{instance.pk}/cpf_doc/{filename}"


# Mantidos para compatibilidade com histórico de migrations
def upload_rg_frente(instance, filename):
    return f"medicos/{instance.pk}/rg/frente_{filename}"


def upload_rg_verso(instance, filename):
    return f"medicos/{instance.pk}/rg/verso_{filename}"


def upload_crm_frente(instance, filename):
    return f"medicos/{instance.pk}/crm/frente_{filename}"


def upload_crm_verso(instance, filename):
    return f"medicos/{instance.pk}/crm/verso_{filename}"


def upload_certidao_casamento(instance, filename):
    return f"medicos/{instance.pk}/certidao_casamento/{filename}"


def upload_curriculo_lattes(instance, filename):
    return f"medicos/{instance.pk}/curriculo_lattes/{filename}"


def upload_comprovante_endereco(instance, filename):
    return f"medicos/{instance.pk}/comprovante_endereco/{filename}"


def upload_quitacao(instance, filename):
    return f"medicos/{instance.pk}/quitacao_crm/{filename}"


def upload_etica(instance, filename):
    return f"medicos/{instance.pk}/etica_crm/{filename}"


def upload_comprovante(instance, filename):
    return f"medicos/{instance.medico.pk}/comprovantes/{filename}"


class Especialidade(models.Model):
    nome = models.CharField(max_length=150, unique=True, verbose_name="Nome")

    class Meta:
        verbose_name = "Especialidade"
        verbose_name_plural = "Especialidades"
        ordering = ["nome"]

    def __str__(self):
        return self.nome


class Medico(models.Model):
    class Status(models.TextChoices):
        PENDENTE = "pendente", "Pendente"
        ATIVO = "ativo", "Ativo"
        INATIVO = "inativo", "Inativo"

    class TipoChavePix(models.TextChoices):
        CPF = "cpf", "CPF"
        CNPJ = "cnpj", "CNPJ"
        EMAIL = "email", "E-mail"
        TELEFONE = "telefone", "Telefone"
        ALEATORIA = "aleatoria", "Chave Aleatória"

    # Vínculo com usuário
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medico",
        verbose_name="Usuário",
    )

    # --- Dados pessoais (nome e CPF obrigatórios; restante opcional) ---
    nome_completo = models.CharField(max_length=250, verbose_name="Nome completo")
    cpf = models.CharField(max_length=14, unique=True, null=True, blank=True, verbose_name="CPF")
    data_nascimento = models.DateField(null=True, blank=True, verbose_name="Data de nascimento")
    rg_numero = models.CharField(max_length=20, blank=True, verbose_name="RG")
    estado_civil = models.CharField(
        max_length=30, choices=ESTADO_CIVIL_CHOICES, blank=True, verbose_name="Estado civil"
    )
    foto_perfil = models.ImageField(upload_to=upload_foto, null=True, blank=True, verbose_name="Foto de perfil")
    email = models.EmailField(blank=True, verbose_name="E-mail")
    telefone = models.CharField(max_length=20, blank=True, verbose_name="Telefone")

    # --- Endereço (todos opcionais) ---
    cep = models.CharField(max_length=9, blank=True, verbose_name="CEP")
    logradouro = models.CharField(max_length=250, blank=True, verbose_name="Logradouro")
    numero = models.CharField(max_length=20, blank=True, verbose_name="Número")
    complemento = models.CharField(max_length=100, blank=True, verbose_name="Complemento")
    bairro = models.CharField(max_length=100, blank=True, verbose_name="Bairro")
    cidade = models.CharField(max_length=100, blank=True, verbose_name="Cidade")
    estado = models.CharField(max_length=2, choices=UF_CHOICES, blank=True, verbose_name="Estado")

    # --- Formação (todos opcionais) ---
    instituicao_formacao = models.CharField(max_length=250, blank=True, verbose_name="Instituição de formação")
    ano_formatura = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name="Ano de formatura")
    link_lattes = models.URLField(blank=True, verbose_name="Currículo Lattes")

    # --- CRM (opcionais) ---
    crm_numero = models.CharField(max_length=20, blank=True, verbose_name="Número do CRM")
    crm_estado = models.CharField(max_length=2, choices=UF_CHOICES, blank=True, verbose_name="Estado do CRM")
    especialidades = models.ManyToManyField(
        Especialidade,
        through="MedicoEspecialidade",
        blank=True,
        verbose_name="Especialidades",
    )

    # --- Financeiro (opcionais) ---
    tipo_chave_pix = models.CharField(
        max_length=10,
        choices=TipoChavePix.choices,
        blank=True,
        verbose_name="Tipo de chave PIX",
    )
    chave_pix = models.CharField(max_length=150, blank=True, verbose_name="Chave PIX")

    # --- Documentos (opcionais) ---
    cnh = models.FileField(
        upload_to=upload_cnh, null=True, blank=True, verbose_name="CNH"
    )
    rg_cpf = models.FileField(
        upload_to=upload_rg_cpf, null=True, blank=True, verbose_name="RG e CPF (frente e verso)"
    )
    crm_doc = models.FileField(
        upload_to=upload_crm_doc, null=True, blank=True, verbose_name="CRM (frente e verso)"
    )
    comprovante_endereco = models.FileField(
        upload_to=upload_comprovante_endereco, null=True, blank=True, verbose_name="Comprovante de endereço"
    )
    diploma_medico = models.FileField(
        upload_to=upload_diploma, null=True, blank=True, verbose_name="Diploma médico"
    )
    declaracao_quitacao_crm = models.FileField(
        upload_to=upload_quitacao, null=True, blank=True, verbose_name="Certidão de regularidade fiscal CRM"
    )
    etica_crm = models.FileField(
        upload_to=upload_etica, null=True, blank=True, verbose_name="Certidão Ético-profissional CRM"
    )
    certidao_casamento = models.FileField(
        upload_to=upload_certidao_casamento, null=True, blank=True, verbose_name="Certidão de Casamento"
    )
    curriculo_lattes = models.FileField(
        upload_to=upload_curriculo_lattes, null=True, blank=True, verbose_name="Currículo Lattes resumido atualizado"
    )

    # --- Status ---
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDENTE,
        verbose_name="Status",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Médico"
        verbose_name_plural = "Médicos"
        ordering = ["nome_completo"]

    def __str__(self):
        return f"{self.nome_completo} — CRM {self.crm_numero}/{self.crm_estado}"

    def campos_pendentes(self):
        """Retorna lista de (campo, label) que ainda não foram preenchidos."""
        pendentes = []
        for campo, label in CAMPOS_OBRIGATORIOS:
            valor = getattr(self, campo, None)
            if not valor:
                pendentes.append({"campo": campo, "label": label})
        # Certidão de casamento só é obrigatória para casados
        if self.estado_civil and self.estado_civil.startswith("casado") and not self.certidao_casamento:
            pendentes.append({"campo": "certidao_casamento", "label": "Certidão de Casamento"})
        # Ao menos uma especialidade deve estar cadastrada
        if self.pk and not self.comprovantes_especialidade.exists():
            pendentes.append({"campo": "comprovante_especialidade", "label": "Comprovante de especialidade"})
        return pendentes

    def cadastro_completo(self):
        return len(self.campos_pendentes()) == 0


class MedicoEspecialidade(models.Model):
    medico = models.ForeignKey(
        Medico,
        on_delete=models.CASCADE,
        related_name="comprovantes_especialidade",
        verbose_name="Médico",
    )
    especialidade = models.ForeignKey(
        Especialidade,
        on_delete=models.PROTECT,
        verbose_name="Especialidade",
    )
    comprovante = models.FileField(
        upload_to=upload_comprovante,
        null=True,
        blank=True,
        verbose_name="Comprovante de especialidade",
    )
    data_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Comprovante de Especialidade"
        verbose_name_plural = "Comprovantes de Especialidade"
        unique_together = [("medico", "especialidade")]

    def __str__(self):
        return f"{self.medico.nome_completo} — {self.especialidade.nome}"
