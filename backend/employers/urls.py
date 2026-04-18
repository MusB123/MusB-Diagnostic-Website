from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.plans_list, name='plans-list'),
    path('comparison/', views.comparison_list, name='comparison-list'),
    
    # Auth & Dashboard
    path('login/', views.login_view, name='employer-login'),
    path('signup/', views.signup_view, name='employer-signup'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('employees/', views.employee_list, name='employee-list'),
    path('employees/<str:employee_id>/', views.employee_detail, name='employee-detail'),
    path('employees/<str:employee_id>/send-email/', views.send_invite_email, name='send-invite-email'),
    path('billing/', views.billing_history, name='billing-history'),
    path('onsite/', views.onsite_requests, name='onsite-requests'),
    path('select-plan/', views.select_plan, name='select-plan'),
    path('enroll/verify/<str:token>/', views.verify_enrollment, name='enroll-verify'),
    path('enroll/complete/<str:token>/', views.complete_enrollment, name='enroll-complete'),
    path('debug-email/', views.debug_email, name='debug-email'),
]
