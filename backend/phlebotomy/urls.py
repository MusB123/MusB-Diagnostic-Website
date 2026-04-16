from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='phleb-signup'),
    path('login/', views.login_view, name='phleb-login'),
    path('dashboard/', views.dashboard_stats, name='phleb-dashboard'),
    path('test/<str:test_id>/status/', views.update_test_status, name='phleb-test-status'),
    path('profile/', views.update_profile, name='phleb-profile-update'),
    path('heartbeat/', views.heartbeat, name='phleb-heartbeat'),
    path('apply/', views.submit_application, name='phleb-apply'),
]
