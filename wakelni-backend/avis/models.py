# avis/models.py
import uuid
from django.db import models
from django.conf import settings
from plats.models import Plat


class Avis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="avis_laisses",   # côté User -> user.avis_laisses.all()
    )

    plat = models.ForeignKey(
        Plat,
        on_delete=models.CASCADE,
        related_name="avis_clients",   #  ICI on change le nom
    )

    note = models.PositiveSmallIntegerField()
    commentaire = models.TextField(blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("client", "plat")
        ordering = ["-date"]

    def __str__(self):
        return f"Avis {self.note}/5 par {self.client} pour {self.plat}"
