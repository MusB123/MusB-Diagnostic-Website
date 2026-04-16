"""
Phlebotomy Management — Admin API Stubs
Provides mock data endpoints for the Super Admin Phlebotomy Management panel.
These endpoints return realistic demo data; swap to MongoDB queries when ready.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime, timedelta
import random


# ===================== OVERVIEW =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_overview(request):
    """GET /api/superadmin/phleb-management/overview/ — KPIs, charts, activity feed."""
    return Response({
        'kpis': {
            'orders_today': {'value': 47, 'change': '+12%', 'trend': 'up'},
            'orders_week': {'value': 312, 'change': '+8%', 'trend': 'up'},
            'orders_month': {'value': 1240, 'change': '+15%', 'trend': 'up'},
            'total_revenue': {'value': '$128,450', 'change': '+22%', 'trend': 'up'},
            'platform_fees': {'value': '$38,535', 'change': '+22%', 'trend': 'up'},
            'active_phlebotomists': {'value': 24, 'change': '+3', 'trend': 'up'},
            'registered_companies': {'value': 8, 'change': '+1', 'trend': 'up'},
            'flagged_accounts': {'value': 3, 'change': '-1', 'trend': 'down'},
        },
        'orders_over_time': [
            {'date': 'Mon', 'orders': 42},
            {'date': 'Tue', 'orders': 58},
            {'date': 'Wed', 'orders': 51},
            {'date': 'Thu', 'orders': 67},
            {'date': 'Fri', 'orders': 73},
            {'date': 'Sat', 'orders': 38},
            {'date': 'Sun', 'orders': 22},
        ],
        'top_zip_codes': [
            {'zip': '10001', 'city': 'Manhattan', 'orders': 145},
            {'zip': '10013', 'city': 'Tribeca', 'orders': 98},
            {'zip': '11201', 'city': 'Brooklyn Heights', 'orders': 87},
            {'zip': '10022', 'city': 'Midtown East', 'orders': 76},
            {'zip': '10003', 'city': 'East Village', 'orders': 64},
        ],
        'recent_activity': [
            {'id': 1, 'type': 'signup', 'message': 'New patient registered: Emily R.', 'time': '2 min ago'},
            {'id': 2, 'type': 'order', 'message': 'Order #1247 placed — CBC + Lipid Panel', 'time': '5 min ago'},
            {'id': 3, 'type': 'cancellation', 'message': 'Order #1243 cancelled by patient', 'time': '12 min ago'},
            {'id': 4, 'type': 'dispute', 'message': 'Payment dispute filed for Order #1198', 'time': '30 min ago'},
            {'id': 5, 'type': 'signup', 'message': 'New phlebotomist application: Carlos M.', 'time': '1 hr ago'},
            {'id': 6, 'type': 'order', 'message': 'Order #1246 completed — Sarah J.', 'time': '1.5 hr ago'},
        ]
    })


# ===================== PATIENTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_patients(request):
    """GET /api/superadmin/phleb-management/patients/ — All patient accounts."""
    patients = [
        {'id': 'PAT-001', 'name': 'Sarah Johnson', 'email': 'sarah.j@email.com', 'phone': '(555) 123-4567', 'total_bookings': 12, 'status': 'active', 'joined': 'Jan 15, 2026', 'last_booking': 'Apr 10, 2026', 'insurance': 'Blue Cross Blue Shield', 'payment_method': 'Visa •••• 4242'},
        {'id': 'PAT-002', 'name': 'Michael Roberts', 'email': 'mike.r@email.com', 'phone': '(555) 234-5678', 'total_bookings': 8, 'status': 'active', 'joined': 'Feb 3, 2026', 'last_booking': 'Apr 8, 2026', 'insurance': 'Aetna', 'payment_method': 'Mastercard •••• 8888'},
        {'id': 'PAT-003', 'name': 'Linda Park', 'email': 'linda.p@email.com', 'phone': '(555) 345-6789', 'total_bookings': 5, 'status': 'active', 'joined': 'Mar 1, 2026', 'last_booking': 'Apr 5, 2026', 'insurance': 'UnitedHealth', 'payment_method': 'Amex •••• 1234'},
        {'id': 'PAT-004', 'name': 'David Williams', 'email': 'david.w@email.com', 'phone': '(555) 456-7890', 'total_bookings': 3, 'status': 'suspended', 'joined': 'Mar 20, 2026', 'last_booking': 'Apr 2, 2026', 'insurance': 'Cigna', 'payment_method': 'Visa •••• 5555'},
        {'id': 'PAT-005', 'name': 'Emma Kim', 'email': 'emma.k@email.com', 'phone': '(555) 567-8901', 'total_bookings': 15, 'status': 'active', 'joined': 'Dec 10, 2025', 'last_booking': 'Apr 12, 2026', 'insurance': 'Kaiser Permanente', 'payment_method': 'Visa •••• 9999'},
        {'id': 'PAT-006', 'name': 'James Chen', 'email': 'james.c@email.com', 'phone': '(555) 678-9012', 'total_bookings': 1, 'status': 'active', 'joined': 'Apr 8, 2026', 'last_booking': 'Apr 8, 2026', 'insurance': 'None', 'payment_method': 'Mastercard •••• 3333'},
        {'id': 'PAT-007', 'name': 'Sophia Martinez', 'email': 'sophia.m@email.com', 'phone': '(555) 789-0123', 'total_bookings': 0, 'status': 'flagged', 'joined': 'Apr 11, 2026', 'last_booking': 'Never', 'insurance': 'Pending', 'payment_method': 'Not added'},
    ]
    return Response({'patients': patients, 'total': len(patients)})


# ===================== PHLEBOTOMISTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_phlebotomists(request):
    """GET /api/superadmin/phleb-management/phlebotomists/ — All phlebotomist accounts."""
    phlebotomists = [
        {'id': 'PHL-001', 'name': 'Marcus Thompson', 'type': 'independent', 'status': 'active', 'rating': 4.95, 'total_jobs': 234, 'compliance': {'dl': 'valid', 'certificate': 'valid', 'insurance': 'valid'}, 'zip_codes': ['10001', '10013', '10022'], 'email': 'marcus.t@musb.com', 'phone': '(555) 111-2222', 'joined': 'Nov 2025'},
        {'id': 'PHL-002', 'name': 'Angela Davis', 'type': 'company-linked', 'company': 'MedDraw LLC', 'status': 'active', 'rating': 4.88, 'total_jobs': 189, 'compliance': {'dl': 'valid', 'certificate': 'valid', 'insurance': 'expiring'}, 'zip_codes': ['11201', '11215', '11217'], 'email': 'angela.d@meddraw.com', 'phone': '(555) 222-3333', 'joined': 'Dec 2025'},
        {'id': 'PHL-003', 'name': 'Carlos Mendez', 'type': 'independent', 'status': 'pending', 'rating': 0, 'total_jobs': 0, 'compliance': {'dl': 'pending', 'certificate': 'pending', 'insurance': 'pending'}, 'zip_codes': ['10003', '10009'], 'email': 'carlos.m@email.com', 'phone': '(555) 333-4444', 'joined': 'Apr 2026'},
        {'id': 'PHL-004', 'name': 'Priya Sharma', 'type': 'independent', 'status': 'active', 'rating': 4.72, 'total_jobs': 156, 'compliance': {'dl': 'valid', 'certificate': 'valid', 'insurance': 'valid'}, 'zip_codes': ['10001', '10003', '10010'], 'email': 'priya.s@musb.com', 'phone': '(555) 444-5555', 'joined': 'Jan 2026'},
        {'id': 'PHL-005', 'name': 'Robert Lee', 'type': 'company-linked', 'company': 'HomeBlood Inc.', 'status': 'disqualified', 'rating': 2.8, 'total_jobs': 42, 'compliance': {'dl': 'expired', 'certificate': 'valid', 'insurance': 'expired'}, 'zip_codes': ['10022'], 'email': 'robert.l@homeblood.com', 'phone': '(555) 555-6666', 'joined': 'Feb 2026'},
        {'id': 'PHL-006', 'name': 'Fatima Al-Hassan', 'type': 'independent', 'status': 'active', 'rating': 4.98, 'total_jobs': 310, 'compliance': {'dl': 'valid', 'certificate': 'valid', 'insurance': 'valid'}, 'zip_codes': ['10001', '10013', '10007', '10038'], 'email': 'fatima.h@musb.com', 'phone': '(555) 666-7777', 'joined': 'Oct 2025'},
    ]
    return Response({'phlebotomists': phlebotomists, 'total': len(phlebotomists), 'rating_threshold': 3.5})


# ===================== COMPANIES =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_companies(request):
    """GET /api/superadmin/phleb-management/companies/ — All company accounts."""
    companies = [
        {'id': 'CMP-001', 'name': 'MedDraw LLC', 'contact': 'Jennifer Walsh', 'email': 'jen@meddraw.com', 'phlebotomist_count': 12, 'orders': 890, 'revenue': '$42,300', 'doc_status': 'complete', 'status': 'active', 'joined': 'Sep 2025'},
        {'id': 'CMP-002', 'name': 'HomeBlood Inc.', 'contact': 'Thomas Green', 'email': 'tom@homeblood.com', 'phlebotomist_count': 8, 'orders': 456, 'revenue': '$21,700', 'doc_status': 'complete', 'status': 'active', 'joined': 'Nov 2025'},
        {'id': 'CMP-003', 'name': 'VitalDraw Labs', 'contact': 'Rachel Kim', 'email': 'rachel@vitaldraw.com', 'phlebotomist_count': 0, 'orders': 0, 'revenue': '$0', 'doc_status': 'pending', 'status': 'pending', 'joined': 'Apr 2026'},
        {'id': 'CMP-004', 'name': 'SteriCollect Pro', 'contact': 'Ahmed Patel', 'email': 'ahmed@stericollect.com', 'phlebotomist_count': 5, 'orders': 312, 'revenue': '$14,800', 'doc_status': 'complete', 'status': 'suspended', 'joined': 'Jan 2026'},
    ]
    return Response({'companies': companies, 'total': len(companies)})


# ===================== ORDERS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_orders(request):
    """GET /api/superadmin/phleb-management/orders/ — Master order list."""
    orders = [
        {'id': 'ORD-1247', 'patient': 'Sarah Johnson', 'phlebotomist': 'Marcus Thompson', 'company': None, 'date': 'Apr 16, 2026', 'time': '10:30 AM', 'status': 'in_progress', 'zip': '10001', 'tests': 'CBC, Lipid Panel', 'charge': '$145.00', 'insurance': 'BCBS', 'has_order': True},
        {'id': 'ORD-1246', 'patient': 'Emma Kim', 'phlebotomist': 'Fatima Al-Hassan', 'company': None, 'date': 'Apr 16, 2026', 'time': '9:00 AM', 'status': 'completed', 'zip': '10013', 'tests': 'CMP', 'charge': '$89.00', 'insurance': 'Kaiser', 'has_order': True},
        {'id': 'ORD-1245', 'patient': 'Michael Roberts', 'phlebotomist': 'Angela Davis', 'company': 'MedDraw LLC', 'date': 'Apr 15, 2026', 'time': '2:00 PM', 'status': 'completed', 'zip': '11201', 'tests': 'Thyroid Panel', 'charge': '$120.00', 'insurance': 'Aetna', 'has_order': False},
        {'id': 'ORD-1244', 'patient': 'Linda Park', 'phlebotomist': 'Priya Sharma', 'company': None, 'date': 'Apr 15, 2026', 'time': '11:00 AM', 'status': 'completed', 'zip': '10003', 'tests': 'CBC + CMP', 'charge': '$165.00', 'insurance': 'UnitedHealth', 'has_order': True},
        {'id': 'ORD-1243', 'patient': 'David Williams', 'phlebotomist': None, 'company': None, 'date': 'Apr 15, 2026', 'time': '3:30 PM', 'status': 'cancelled', 'zip': '10022', 'tests': 'Glucose Fasting', 'charge': '$0.00', 'insurance': 'Cigna', 'has_order': True},
        {'id': 'ORD-1242', 'patient': 'James Chen', 'phlebotomist': 'Marcus Thompson', 'company': None, 'date': 'Apr 14, 2026', 'time': '4:00 PM', 'status': 'completed', 'zip': '10001', 'tests': 'Iron Panel', 'charge': '$95.00', 'insurance': 'None (Self-Pay)', 'has_order': False},
        {'id': 'ORD-1241', 'patient': 'Sarah Johnson', 'phlebotomist': 'Angela Davis', 'company': 'MedDraw LLC', 'date': 'Apr 14, 2026', 'time': '9:30 AM', 'status': 'disputed', 'zip': '10013', 'tests': 'CBC', 'charge': '$75.00', 'insurance': 'BCBS', 'has_order': True},
    ]
    return Response({'orders': orders, 'total': len(orders)})


# ===================== PAYMENTS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_payments(request):
    """GET /api/superadmin/phleb-management/payments/ — Payout queue and history."""
    payout_queue = [
        {'id': 'PAY-101', 'recipient': 'Marcus Thompson', 'type': 'phlebotomist', 'gross': '$1,890.00', 'fee': '$567.00', 'net': '$1,323.00', 'jobs': 14, 'status': 'pending'},
        {'id': 'PAY-102', 'recipient': 'Fatima Al-Hassan', 'type': 'phlebotomist', 'gross': '$2,145.00', 'fee': '$643.50', 'net': '$1,501.50', 'jobs': 18, 'status': 'pending'},
        {'id': 'PAY-103', 'recipient': 'MedDraw LLC', 'type': 'company', 'gross': '$4,520.00', 'fee': '$1,356.00', 'net': '$3,164.00', 'jobs': 32, 'status': 'pending'},
        {'id': 'PAY-104', 'recipient': 'Priya Sharma', 'type': 'phlebotomist', 'gross': '$1,245.00', 'fee': '$373.50', 'net': '$871.50', 'jobs': 10, 'status': 'on_hold'},
        {'id': 'PAY-105', 'recipient': 'Angela Davis', 'type': 'phlebotomist', 'gross': '$980.00', 'fee': '$294.00', 'net': '$686.00', 'jobs': 8, 'status': 'pending'},
    ]
    payment_history = [
        {'id': 'TXN-201', 'recipient': 'Marcus Thompson', 'date': 'Apr 11, 2026', 'gross': '$1,650.00', 'fee': '$495.00', 'net': '$1,155.00', 'status': 'paid'},
        {'id': 'TXN-202', 'recipient': 'Fatima Al-Hassan', 'date': 'Apr 11, 2026', 'gross': '$1,890.00', 'fee': '$567.00', 'net': '$1,323.00', 'status': 'paid'},
        {'id': 'TXN-203', 'recipient': 'MedDraw LLC', 'date': 'Apr 11, 2026', 'gross': '$3,800.00', 'fee': '$1,140.00', 'net': '$2,660.00', 'status': 'paid'},
        {'id': 'TXN-204', 'recipient': 'HomeBlood Inc.', 'date': 'Apr 4, 2026', 'gross': '$2,100.00', 'fee': '$630.00', 'net': '$1,470.00', 'status': 'paid'},
    ]
    return Response({
        'payout_queue': payout_queue,
        'payment_history': payment_history,
        'next_payout_day': 'Friday, Apr 18, 2026',
        'total_pending': '$7,546.00',
        'platform_fee_rate': '30%'
    })


# ===================== REVIEWS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_reviews(request):
    """GET /api/superadmin/phleb-management/reviews/ — All reviews for moderation."""
    reviews = [
        {'id': 'REV-001', 'patient': 'Sarah Johnson', 'phlebotomist': 'Marcus Thompson', 'rating': 5, 'text': 'Incredibly professional and quick. Best phlebotomy experience.', 'date': 'Apr 12, 2026', 'flagged': False},
        {'id': 'REV-002', 'patient': 'Michael Roberts', 'phlebotomist': 'Angela Davis', 'rating': 5, 'text': 'Very gentle with the draw. Will request again!', 'date': 'Apr 10, 2026', 'flagged': False},
        {'id': 'REV-003', 'patient': 'Linda Park', 'phlebotomist': 'Priya Sharma', 'rating': 4, 'text': 'Great service overall. Minor difficulty finding the vein.', 'date': 'Apr 8, 2026', 'flagged': False},
        {'id': 'REV-004', 'patient': 'David Williams', 'phlebotomist': 'Robert Lee', 'rating': 1, 'text': 'Showed up 45 minutes late. Very unprofessional.', 'date': 'Apr 5, 2026', 'flagged': True},
        {'id': 'REV-005', 'patient': 'Emma Kim', 'phlebotomist': 'Fatima Al-Hassan', 'rating': 5, 'text': 'Fatima is amazing! Barely felt anything.', 'date': 'Apr 12, 2026', 'flagged': False},
        {'id': 'REV-006', 'patient': 'James Chen', 'phlebotomist': 'Robert Lee', 'rating': 2, 'text': 'Had to be stuck three times. Not great.', 'date': 'Apr 3, 2026', 'flagged': True},
    ]
    return Response({
        'reviews': reviews,
        'total': len(reviews),
        'flagged_count': sum(1 for r in reviews if r['flagged']),
        'auto_flag_threshold': 2
    })


# ===================== MARKETING =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_marketing(request):
    """GET /api/superadmin/phleb-management/marketing/ — Campaigns, SEO, promos."""
    return Response({
        'campaigns': [
            {'id': 'CMP-01', 'name': 'Spring Health Check', 'platform': 'Facebook', 'status': 'active', 'spend': '$450', 'clicks': 1240, 'conversions': 86, 'utm': 'utm_source=facebook&utm_campaign=spring_health'},
            {'id': 'CMP-02', 'name': 'NYC Home Draw', 'platform': 'Google Ads', 'status': 'active', 'spend': '$820', 'clicks': 3100, 'conversions': 210, 'utm': 'utm_source=google&utm_campaign=nyc_home_draw'},
            {'id': 'CMP-03', 'name': 'Insurance Partners', 'platform': 'Instagram', 'status': 'paused', 'spend': '$200', 'clicks': 580, 'conversions': 32, 'utm': 'utm_source=instagram&utm_campaign=insurance_partners'},
        ],
        'seo_pages': [
            {'page': 'Manhattan Home Phlebotomy', 'meta_title': 'Mobile Phlebotomy in Manhattan | MusB', 'meta_desc': 'Book a certified phlebotomist...', 'keywords': 'home phlebotomy manhattan, blood draw nyc', 'zip': '10001'},
            {'page': 'Brooklyn Blood Draw', 'meta_title': 'At-Home Blood Draw Brooklyn | MusB', 'meta_desc': 'Professional blood collection...', 'keywords': 'blood draw brooklyn, mobile lab brooklyn', 'zip': '11201'},
        ],
        'promo_codes': [
            {'code': 'FIRST20', 'discount': '20%', 'usage': 145, 'limit': 500, 'expires': 'May 31, 2026', 'status': 'active'},
            {'code': 'SPRING10', 'discount': '$10 off', 'usage': 89, 'limit': 200, 'expires': 'Apr 30, 2026', 'status': 'active'},
            {'code': 'WELCOME50', 'discount': '50%', 'usage': 50, 'limit': 50, 'expires': 'Expired', 'status': 'expired'},
        ]
    })


# ===================== SETTINGS =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def phleb_settings(request):
    """GET /api/superadmin/phleb-management/settings/ — System config, roles, audit."""
    return Response({
        'admin_users': [
            {'id': 'ADM-001', 'name': 'Master Admin', 'email': 'admin@musb.com', 'role': 'Super Admin', 'last_login': 'Apr 16, 2026 05:30 AM'},
            {'id': 'ADM-002', 'name': 'Sarah Support', 'email': 'sarah.s@musb.com', 'role': 'Support Agent', 'last_login': 'Apr 15, 2026 09:15 AM'},
            {'id': 'ADM-003', 'name': 'Mike Finance', 'email': 'mike.f@musb.com', 'role': 'Finance Manager', 'last_login': 'Apr 14, 2026 02:00 PM'},
            {'id': 'ADM-004', 'name': 'Lisa Compliance', 'email': 'lisa.c@musb.com', 'role': 'Compliance Officer', 'last_login': 'Apr 16, 2026 04:45 AM'},
        ],
        'system_config': {
            'platform_fee_min': 25,
            'platform_fee_max': 35,
            'current_fee': 30,
            'cancellation_window_hours': 4,
            'payout_day': 'Friday',
            'rating_disqualify_threshold': 3.0,
            'auto_flag_review_threshold': 2,
            'max_dispatch_radius_miles': 125,
        },
        'audit_log': [
            {'id': 'AUD-001', 'admin': 'Master Admin', 'action': 'Approved phlebotomist PHL-003', 'timestamp': 'Apr 16, 2026 05:30:12 AM'},
            {'id': 'AUD-002', 'admin': 'Sarah Support', 'action': 'Suspended patient PAT-004', 'timestamp': 'Apr 15, 2026 09:15:30 AM'},
            {'id': 'AUD-003', 'admin': 'Mike Finance', 'action': 'Released payout PAY-101', 'timestamp': 'Apr 14, 2026 02:00:45 PM'},
            {'id': 'AUD-004', 'admin': 'Lisa Compliance', 'action': 'Flagged review REV-004', 'timestamp': 'Apr 14, 2026 11:20:00 AM'},
            {'id': 'AUD-005', 'admin': 'Master Admin', 'action': 'Updated platform fee to 30%', 'timestamp': 'Apr 13, 2026 08:00:00 AM'},
            {'id': 'AUD-006', 'admin': 'Sarah Support', 'action': 'Exported all patients to CSV', 'timestamp': 'Apr 12, 2026 03:30:00 PM'},
        ],
        'roles': ['Super Admin', 'Support Agent', 'Finance Manager', 'Compliance Officer']
    })
