
from rest_framework.routers import DefaultRouter
from .views import CommandeViewSet

router = DefaultRouter()
router.register('', CommandeViewSet, basename='commande')

urlpatterns = router.urls
