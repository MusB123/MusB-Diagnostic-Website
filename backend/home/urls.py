from django.urls import path
from . import views

urlpatterns = [
    path('hero/', views.hero_content, name='home-hero'),
    path('services/', views.services_list, name='home-services'),
    path('testimonials/', views.testimonials_list, name='home-testimonials'),
    path('popular-panels/', views.popular_panels_list, name='home-popular-panels'),
    path('newsletter/', views.newsletter_subscribe, name='home-newsletter'),
    path('health/', views.health_check, name='home-health'),
]
