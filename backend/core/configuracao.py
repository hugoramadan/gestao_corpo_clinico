from django.db import models
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from medicos.permissions import IsAdminOnly


class Configuracao(models.Model):
    nome = models.CharField(max_length=100, default="Corpo Clínico")
    subtitulo = models.CharField(
        max_length=200, default="Gestão de Profissionais de Saúde"
    )
    cor_primaria = models.CharField(max_length=7, default="#1d4ed8")
    logo = models.ImageField(upload_to="config/logo/", null=True, blank=True)

    class Meta:
        verbose_name = "Configuração"
        verbose_name_plural = "Configurações"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ConfiguracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuracao
        fields = ["nome", "subtitulo", "cor_primaria", "logo"]

    def update(self, instance, validated_data):
        # Se o cliente enviou o campo "remover_logo=1", limpa o arquivo
        request = self.context.get("request")
        if request and request.data.get("remover_logo") == "1":
            if instance.logo:
                instance.logo.delete(save=False)
            instance.logo = None
        return super().update(instance, validated_data)


class ConfiguracaoView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdminOnly()]

    def get(self, request):
        config = Configuracao.get()
        return Response(ConfiguracaoSerializer(config, context={"request": request}).data)

    def patch(self, request):
        config = Configuracao.get()
        serializer = ConfiguracaoSerializer(
            config, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
