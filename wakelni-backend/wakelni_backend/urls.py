# wakelni_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return JsonResponse({"message": "API Wakelni fonctionne 🥙"})


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/plats/", include("plats.urls")),
    path("api/paniers/", include("paniers.urls")),
    path("api/commandes/", include("commandes.urls")),
    path("api/paiements/", include("paiements.urls")),
    path("api/reclamations/", include("reclamations.urls")),
]

# important pour servir les images en DEBUG
if settings.DEBUG:
  urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
