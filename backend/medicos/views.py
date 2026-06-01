import csv

from django.http import HttpResponse
from rest_framework import status, generics, filters, mixins
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Medico, Especialidade, MedicoEspecialidade
from .serializers import (
    MedicoSerializer,
    MedicoListSerializer,
    EspecialidadeSerializer,
    MedicoEspecialidadeSerializer,
)
from .permissions import IsGestorOrAdmin, IsAdminOnly, IsMedicoOwnerOrStaff

_STATUS_LABEL = {
    "pendente": "Pendente",
    "ativo_com_contrato": "Ativo com Contrato",
    "ativo_sem_contrato": "Ativo sem Contrato",
    "inativo": "Inativo",
}

_PIX_LABEL = {
    "cpf": "CPF",
    "cnpj": "CNPJ",
    "email": "E-mail",
    "telefone": "Telefone",
    "aleatoria": "Aleatória",
}

FIELD_MAP = {
    "nome_completo":       ("Nome Completo",         lambda m: m.nome_completo or ""),
    "cpf":                 ("CPF",                   lambda m: m.cpf or ""),
    "data_nascimento":     ("Data de Nascimento",    lambda m: m.data_nascimento.strftime("%d/%m/%Y") if m.data_nascimento else ""),
    "rg_numero":           ("RG",                    lambda m: m.rg_numero or ""),
    "estado_civil":        ("Estado Civil",          lambda m: m.get_estado_civil_display() if m.estado_civil else ""),
    "email":               ("E-mail",                lambda m: m.email or ""),
    "telefone":            ("Telefone",              lambda m: m.telefone or ""),
    "cep":                 ("CEP",                   lambda m: m.cep or ""),
    "logradouro":          ("Logradouro",            lambda m: m.logradouro or ""),
    "numero":              ("Número",                lambda m: m.numero or ""),
    "complemento":         ("Complemento",           lambda m: m.complemento or ""),
    "bairro":              ("Bairro",                lambda m: m.bairro or ""),
    "cidade":              ("Cidade",                lambda m: m.cidade or ""),
    "estado":              ("Estado (UF)",           lambda m: m.estado or ""),
    "instituicao_formacao":("Instituição de Formação", lambda m: m.instituicao_formacao or ""),
    "ano_formatura":       ("Ano de Formatura",      lambda m: str(m.ano_formatura) if m.ano_formatura else ""),
    "link_lattes":         ("Link Lattes",           lambda m: m.link_lattes or ""),
    "crm_numero":          ("CRM",                   lambda m: m.crm_numero or ""),
    "crm_estado":          ("UF CRM",                lambda m: m.crm_estado or ""),
    "especialidades":      ("Especialidades",        lambda m: "; ".join(e.nome for e in m.especialidades.all())),
    "tipo_chave_pix":      ("Tipo Chave PIX",        lambda m: _PIX_LABEL.get(m.tipo_chave_pix, m.tipo_chave_pix or "")),
    "chave_pix":           ("Chave PIX",             lambda m: m.chave_pix or ""),
    "status":              ("Status",                lambda m: _STATUS_LABEL.get(m.status, m.status or "")),
    "cadastro_completo":   ("Cadastro Completo",     lambda m: "Sim" if m.cadastro_completo() else "Não"),
    "created_at":          ("Data de Cadastro",      lambda m: m.created_at.strftime("%d/%m/%Y %H:%M") if m.created_at else ""),
    "updated_at":          ("Última Atualização",    lambda m: m.updated_at.strftime("%d/%m/%Y %H:%M") if m.updated_at else ""),
}


class MedicoRelatorioView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        nome = request.query_params.get("nome", "relatorio_medicos").strip() or "relatorio_medicos"
        fields_param = request.query_params.get("fields", "")
        status_param = request.query_params.get("status", "")
        situacao = request.query_params.get("situacao", "")

        valid_fields = [f for f in fields_param.split(",") if f in FIELD_MAP]
        if not valid_fields:
            valid_fields = list(FIELD_MAP.keys())

        qs = Medico.objects.select_related("user").prefetch_related("especialidades")
        if status_param:
            statuses = [s.strip() for s in status_param.split(",") if s.strip()]
            if statuses:
                qs = qs.filter(status__in=statuses)

        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in nome)
        response["Content-Disposition"] = f'attachment; filename="{safe_name}.csv"'

        writer = csv.writer(response)
        writer.writerow([FIELD_MAP[f][0] for f in valid_fields])

        for medico in qs:
            if situacao == "completo" and not medico.cadastro_completo():
                continue
            if situacao == "incompleto" and medico.cadastro_completo():
                continue
            writer.writerow([FIELD_MAP[f][1](medico) for f in valid_fields])

        return response


class MedicoListCreateView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nome_completo", "cpf", "crm_numero", "email"]
    ordering_fields = ["nome_completo", "created_at", "status"]
    ordering = ["nome_completo"]

    def get_queryset(self):
        qs = Medico.objects.select_related("user").prefetch_related(
            "especialidades",
            "comprovantes_especialidade__especialidade",
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            statuses = [s.strip() for s in status_param.split(",") if s.strip()]
            qs = qs.filter(status__in=statuses)
        return qs

    def get_serializer_class(self):
        if self.request.method == "GET":
            return MedicoListSerializer
        return MedicoSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsGestorOrAdmin()]
        # POST: qualquer usuário autenticado pode criar (médico cria o próprio cadastro)
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        # Se o criador é um médico, vincula automaticamente ao seu usuário
        if "medico" in (self.request.user.roles or []):
            if hasattr(self.request.user, "medico"):
                raise ValidationError({"detail": "Você já possui um cadastro médico."})
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class MedicoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medico.objects.select_related("user").prefetch_related(
        "especialidades", "comprovantes_especialidade__especialidade"
    )
    serializer_class = MedicoSerializer

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated(), IsAdminOnly()]
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user is not None and instance.user == request.user:
            return Response(
                {"detail": "Você não pode excluir seu próprio cadastro médico."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if instance.status != "inativo":
            return Response(
                {"detail": "Apenas cadastros com status inativo podem ser excluídos."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        user = instance.user  # salva referência antes de deletar
        instance.delete()
        if user is not None:
            user.delete()  # remove o login junto com o cadastro


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def meu_cadastro_view(request):
    """Retorna o cadastro do médico logado."""
    try:
        medico = request.user.medico
        return Response(MedicoSerializer(medico).data)
    except Medico.DoesNotExist:
        return Response({"detail": "Cadastro médico não encontrado."}, status=status.HTTP_404_NOT_FOUND)


class ComprovantesListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicoEspecialidadeSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_medico(self):
        medico = generics.get_object_or_404(Medico, pk=self.kwargs["pk"])
        self.check_object_permissions(self.request, medico)
        return medico

    def get_queryset(self):
        return MedicoEspecialidade.objects.filter(medico__pk=self.kwargs["pk"]).select_related("especialidade")

    def perform_create(self, serializer):
        medico = self.get_medico()
        serializer.save(medico=medico)


class ComprovantesDetailView(mixins.UpdateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView):
    serializer_class = MedicoEspecialidadeSerializer

    def get_permissions(self):
        return [IsAuthenticated(), IsMedicoOwnerOrStaff()]

    def get_queryset(self):
        return MedicoEspecialidade.objects.filter(medico__pk=self.kwargs["pk"])

    def get_object(self):
        obj = generics.get_object_or_404(
            MedicoEspecialidade, pk=self.kwargs["cid"], medico__pk=self.kwargs["pk"]
        )
        self.check_object_permissions(self.request, obj.medico)
        return obj

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)


class EspecialidadeListCreateView(generics.ListCreateAPIView):
    queryset = Especialidade.objects.all()
    serializer_class = EspecialidadeSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGestorOrAdmin()]
