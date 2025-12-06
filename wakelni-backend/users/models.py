from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CLIENT = "CLIENT", "Client"
        CUISINIER = "CUISINIER", "Cuisinier"

    # Id Clerk (optionnel mais unique s'il existe)
    clerk_id = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )

    # Champs communs
    avatar_url = models.URLField(blank=True, null=True)

    # Spécifique Client
    adresse_principale = models.CharField(max_length=255, blank=True, null=True)
    preferences = models.TextField(blank=True, null=True)

    # Spécifique Cuisinier
    bio = models.TextField(blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    note_moyenne = models.FloatField(blank=True, null=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
