
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('destinataire', 'message', 'est_lu', 'cree_le')
    list_filter = ('est_lu',)
