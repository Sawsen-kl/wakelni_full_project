# plats/models.py
import uuid
from django.conf import settings
from django.db import models


class Plat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    cuisinier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plats",
        limit_choices_to={"role": "CUISINIER"},
    )

    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)

    prix = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)

    ville = models.CharField(max_length=100, blank=True)
    adresse = models.CharField(max_length=255, blank=True)

    est_actif = models.BooleanField(default=True)
    tags = models.CharField(max_length=255, blank=True)

    photo = models.ImageField(
        upload_to="plats/",  # sera dans MEDIA_ROOT/plats/
        blank=True,
        null=True
    )

    cree_le = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.cuisinier.username})"


class Avis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE, related_name="avis")
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="avis",
        limit_choices_to={"role": "CLIENT"},
    )
    note = models.IntegerField()  # 1 à 5 par exemple
    commentaire = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avis {self.note}/5 sur {self.plat.nom} par {self.client.username}"
