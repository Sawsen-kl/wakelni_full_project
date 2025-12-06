# commandes/models.py
from decimal import Decimal

from django.conf import settings
from django.db import models

from plats.models import Plat


class Commande(models.Model):
    STATUT_EN_PREPARATION = "EN_PREPARATION"
    STATUT_EN_LIVRAISON = "EN_LIVRAISON"
    STATUT_LIVREE = "LIVREE"

    STATUT_CHOICES = [
        (STATUT_EN_PREPARATION, "En cours de préparation"),
        (STATUT_EN_LIVRAISON, "En cours de livraison"),
        (STATUT_LIVREE, "Livrée"),
    ]

    # ⚠️ ON NE DÉCLARE PLUS id : Django va créer tout seul
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="commandes",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_EN_PREPARATION,
    )

    total = models.DecimalField(max_digits=8, decimal_places=2)

    stripe_session_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID de la session Stripe Checkout liée à cette commande",
    )

    def __str__(self):
        return f"Commande #{self.pk} - {self.client} - {self.total} $"

    class Meta:
        ordering = ["-created_at"]


class LigneCommande(models.Model):
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    plat = models.ForeignKey(
        Plat,
        on_delete=models.CASCADE,
        related_name="lignes_commandes",
    )
    quantite = models.PositiveIntegerField(default=1)
    sous_total = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    def __str__(self):
        return f"{self.quantite} x {self.plat.nom} (commande #{self.commande_id})"
