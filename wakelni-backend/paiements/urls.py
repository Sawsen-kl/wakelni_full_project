from django.urls import path
from .views import CreateCheckoutSessionView, ConfirmPaymentView

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view()),
    path("confirm/", ConfirmPaymentView.as_view()),
]
