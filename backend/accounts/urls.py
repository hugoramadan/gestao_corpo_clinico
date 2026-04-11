from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    register_view,
    me_view,
    change_password_view,
    password_reset_request_view,
    password_reset_confirm_view,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("register/", register_view, name="auth-register"),
    path("me/", me_view, name="auth-me"),
    path("change-password/", change_password_view, name="auth-change-password"),
    path("password-reset/", password_reset_request_view, name="auth-password-reset"),
    path("password-reset/confirm/", password_reset_confirm_view, name="auth-password-reset-confirm"),
]
