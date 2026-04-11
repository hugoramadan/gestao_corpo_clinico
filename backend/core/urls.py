from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from core.configuracao import ConfiguracaoView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/users/", include("accounts.user_urls")),
    path("api/medicos/", include("medicos.urls")),
    path("api/config/", ConfiguracaoView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
