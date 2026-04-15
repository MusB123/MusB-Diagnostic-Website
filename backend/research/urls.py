from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.research_stats, name='research-stats'),
    path('services/', views.services_list, name='research-services'),
    path('biorepository/', views.biorepository_info, name='research-biorepository'),
    path('collaborations/', views.collaborations_list, name='research-collaborations'),
    path('quote/', views.submit_quote, name='research-quote'),
    path('newsletter/', views.newsletter_subscribe, name='research-newsletter'),
    
    # Portal Endpoints
    path('portal/login/', views.login_view, name='research-portal-login'),
    path('portal/signup/', views.signup_view, name='research-portal-signup'),
    path('portal/dashboard/', views.dashboard_overview, name='research-portal-dashboard'),
    path('portal/studies/', views.study_management, name='research-portal-studies'),
    path('portal/samples/', views.sample_tracking, name='research-portal-samples'),
    path('portal/reporting/', views.inventory_reporting, name='research-portal-reporting'),
    path('portal/universities/', views.university_directory, name='research-portal-universities'),
    
    # Validation Pathways
    path('validation/submit/', views.submit_validation_brief, name='research-validation-submit'),
    path('validation/tracker/', views.validation_tracker_list, name='research-validation-tracker'),
    
    # NEW: Diagnostic Development Panel Modules
    path('diag/tasks/', views.diagnostic_tasks, name='diag-tasks'),
    path('diag/messages/', views.diagnostic_messages, name='diag-messages'),
    path('diag/documents/', views.diagnostic_documents, name='diag-documents'),
    path('diag/invoices/', views.diagnostic_invoices, name='diag-invoices'),
    path('diag/pipeline/', views.diagnostic_pipeline, name='diag-pipeline'),
]
