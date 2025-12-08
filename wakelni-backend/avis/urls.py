# avis/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("laisser-avis/", views.LaisserAvisView.as_view(), name="laisser-avis"),
    path("mon-avis/", views.MonAvisView.as_view(), name="mon-avis"),
    path("avis-par-plat/", views.AvisParPlatView.as_view(), name="avis-par-plat"),
    path(
        "avis-cuisinier/",
        views.AvisRecusCuisinierView.as_view(),
        name="avis-cuisinier",
    ),
]
