import uuid
from django.conf import settings
from django.db import models
from commandes.models import Commande


class StatutReclamation(models.TextChoices):
    OUVERT = "OUVERT", "Ouvert"
    EN_ANALYSE = "EN_ANALYSE", "En analyse"
    RESOLU = "RESOLU", "Résolu"
    REJETE = "REJETE", "Rejeté"


class Reclamation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name="reclamations",
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reclamations",
        limit_choices_to={"role": "CLIENT"},
    )

    # ✅ peut être vide + on garde la réclamation même si le cuisinier est supprimé
    cuisinier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reclamations_recues",
        limit_choices_to={"role": "CUISINIER"},
    )

    motif = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=StatutReclamation.choices,
        default=StatutReclamation.OUVERT,
    )

    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Réclamation {self.id} sur cmd {self.commande.id}"
