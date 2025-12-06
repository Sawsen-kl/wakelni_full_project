
from django.db import models
from django.conf import settings

class Notification(models.Model):
    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.CharField(max_length=255)
    est_lu = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.destinataire.username} - {self.message[:30]}..."
