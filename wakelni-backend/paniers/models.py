import uuid
from django.conf import settings
from django.db import models
from plats.models import Plat


class Panier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paniers",
        limit_choices_to={"role": "CLIENT"},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total(self):
        return sum(ligne.sous_total for ligne in self.lignes.all())

    def __str__(self):
        return f"Panier #{self.id} de {self.client.username}"


class LignePanier(models.Model):
    panier = models.ForeignKey(
        Panier,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=8, decimal_places=2)
    remarques = models.CharField(max_length=255, blank=True)

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire

    class Meta:
        unique_together = ("panier", "plat")  # 1 ligne par plat

    def __str__(self):
        return f"{self.quantite} x {self.plat.nom} (panier {self.panier.id})"
