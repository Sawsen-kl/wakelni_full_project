# plats/urls.py
from django.urls import path
from .views import PlatListCreateView, MesPlatsView, PlatDetailView

urlpatterns = [
    path("", PlatListCreateView.as_view(), name="plats-list-create"),
    path("mes-plats/", MesPlatsView.as_view(), name="mes-plats"),
    path("<uuid:id>/", PlatDetailView.as_view(), name="plat-detail"),
]
