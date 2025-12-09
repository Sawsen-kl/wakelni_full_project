# reclamations/models.py
import uuid
from django.conf import settings
from django.db import models
from commandes.models import Commande
from plats.models import Plat


class StatutReclamation(models.TextChoices):
    OUVERT = "OUVERT", "Ouvert"
    LU = "LU", "Lue par le cuisinier"
    EN_COURS = "EN_COURS", "En cours de traitement"
    TRAITEE = "TRAITEE", "Traitée"
    REJETEE = "REJETEE", "Rejetée"


class MotifReclamation(models.TextChoices):
    QUALITE_PLAT = "QUALITE_PLAT", "Qualité du plat"
    DELAI = "DELAI", "Délai de livraison"
    ERREUR_COMMANDE = "ERREUR_COMMANDE", "Erreur dans la commande"
    AUTRE = "AUTRE", "Autre"


class Reclamation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name="reclamations",
    )

    plat = models.ForeignKey(
        Plat,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reclamations",
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reclamations",
        limit_choices_to={"role": "CLIENT"},
    )

    cuisinier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reclamations_recues",
        limit_choices_to={"role": "CUISINIER"},
    )

    motif = models.CharField(
        max_length=30,
        choices=MotifReclamation.choices,
        default=MotifReclamation.AUTRE
    )

    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=StatutReclamation.choices,
        default=StatutReclamation.OUVERT,
    )

    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("client", "commande", "plat")

    def __str__(self):
        return f"Réclamation {self.id} - Cmd {self.commande.id} - Plat {self.plat}"
    

    
