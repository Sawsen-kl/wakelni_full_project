# paniers/urls.py
from django.urls import path
from .views import (
    MonPanierView,
    AjouterAuPanierView,
    MettreAJourItemView,
    SupprimerItemView,
    ViderPanierView,
)

urlpatterns = [
    path("mon-panier/", MonPanierView.as_view(), name="mon-panier"),
    path("ajouter/", AjouterAuPanierView.as_view(), name="ajouter-panier"),

    #  int et pas uuid
    path(
        "item/<int:item_id>/",
        MettreAJourItemView.as_view(),
        name="update-panier-item",
    ),
    path(
        "item/<int:item_id>/delete/",
        SupprimerItemView.as_view(),
        name="delete-panier-item",
    ),
    path("vider/", ViderPanierView.as_view()),
]
