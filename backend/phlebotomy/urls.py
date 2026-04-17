from django.urls import path
from . import views, hubs_views

urlpatterns = [
    path('signup/', views.signup_view, name='phleb-signup'),
    path('login/', views.login_view, name='phleb-login'),
    path('dashboard/', views.dashboard_stats, name='phleb-dashboard'),
    path('test/<str:test_id>/status/', views.update_test_status, name='phleb-test-status'),
    path('profile/', views.update_profile, name='phleb-profile-update'),
    path('heartbeat/', views.heartbeat, name='phleb-heartbeat'),
    path('apply/', views.submit_application, name='phleb-apply'),
    
    # Hub (Company) Management Routes
    path('hubs/register/', hubs_views.register_hub, name='hub-register'),
    path('hubs/login/', hubs_views.login_hub, name='hub-login'),
    path('hubs/fleet/', hubs_views.get_fleet, name='hub-fleet'),
    path('hubs/register-specialist/', hubs_views.register_specialist, name='hub-register-specialist'),
    path('hubs/assign/', hubs_views.assign_order, name='hub-assign'),
    path('hubs/auto-allocate/', hubs_views.auto_allocate_all, name='hub-auto-allocate'),
    path('hubs/dashboard/', hubs_views.hub_dashboard_stats, name='hub-dashboard'),
    path('hubs/reports/', hubs_views.hub_reports, name='hub-reports'),
]
