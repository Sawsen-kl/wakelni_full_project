# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="user-register"),
    path("login/", views.LoginView.as_view(), name="user-login"),
    path("clerk-sync/", views.ClerkSyncView.as_view(), name="clerk-sync"),
]
