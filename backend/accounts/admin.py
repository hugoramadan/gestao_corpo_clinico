from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ["email", "nome", "role", "is_active", "date_joined"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "nome"]
    ordering = ["nome"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informações Pessoais", {"fields": ("nome", "role")}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nome", "role", "password1", "password2"),
        }),
    )
