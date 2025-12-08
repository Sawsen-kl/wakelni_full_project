from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommandeViewSet, MesCommandesClientView

router = DefaultRouter()
router.register('', CommandeViewSet, basename='commande')

urlpatterns = [
    path('mes-commandes/', MesCommandesClientView.as_view(), name='mes-commandes'),
    path('', include(router.urls)),
]
