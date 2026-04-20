from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('signup/', views.request_otp, name='signup'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('book-appointment/', views.book_appointment, name='book-appointment'),
    path('request-otp/', views.request_otp, name='request-otp'),
    path('verify-otp/', views.verify_otp, name='verify-otp'),
]
