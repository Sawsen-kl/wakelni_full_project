# reclamations/urls.py
from django.urls import path
from .views import ChangerStatutReclamationView, CreerReclamationView, MesReclamationsClientView, ReclamationsRecuesCuisinierView

urlpatterns = [
    path("creer/", CreerReclamationView.as_view()),
    path("mes-reclamations/", MesReclamationsClientView.as_view()),
    path("cuisinier/", ReclamationsRecuesCuisinierView.as_view(), name="reclamations-cuisinier"),
    path("<uuid:pk>/changer-statut/", ChangerStatutReclamationView.as_view(), name="reclamation-changer-statut"),
]
