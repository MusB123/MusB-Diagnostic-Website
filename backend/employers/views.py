import uuid
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def plans_list(request):
    """GET /api/employers/plans/ — Corporate plan tiers (mock data)."""
    data = [
        {
            'id': 1, 'name': 'Annual Coverage',
            'price_display': '$108 - $178', 'price_suffix': '/ employee',
            'description': 'Annual allotment per employee for covered diagnostic testing.',
            'is_featured': False, 'tag_label': '', 'icon_name': 'Shield',
            'features': [
                {'id': 1, 'text': 'Annual allotment per employee'},
                {'id': 2, 'text': 'Onsite or in-clinic collections'},
                {'id': 3, 'text': 'Pre-employment & DOT testing'},
                {'id': 4, 'text': 'Basic health screenings'},
            ],
        },
        {
            'id': 2, 'name': 'Match Program',
            'price_display': 'Co-Pay', 'price_suffix': 'Ledger tracked',
            'description': 'Employer matches a portion of employee lab test costs.',
            'is_featured': True, 'tag_label': 'Most Popular', 'icon_name': 'Handshake',
            'features': [
                {'id': 5, 'text': 'Employer-employee cost sharing'},
                {'id': 6, 'text': 'Flexible match ratios'},
                {'id': 7, 'text': 'Executive health credits'},
                {'id': 8, 'text': 'Family member add-ons'},
            ],
        },
        {
            'id': 3, 'name': 'Free Membership',
            'price_display': '$0', 'price_suffix': '/ employee',
            'description': 'Employees get self-pay pricing with no employer cost.',
            'is_featured': False, 'tag_label': '', 'icon_name': 'Gift',
            'features': [
                {'id': 9, 'text': 'Zero employer cost'},
                {'id': 10, 'text': 'Self-pay discounted pricing'},
                {'id': 11, 'text': 'Mobile phlebotomy access'},
                {'id': 12, 'text': 'Online results portal'},
            ],
        },
        {
            'id': 4, 'name': 'Medical Advice',
            'price_display': 'Custom', 'price_suffix': '',
            'description': 'White-glove concierge medical advisory for executives.',
            'is_featured': False, 'tag_label': '', 'icon_name': 'Stethoscope',
            'features': [
                {'id': 13, 'text': 'Dedicated medical advisor'},
                {'id': 14, 'text': 'Personalized health plans'},
                {'id': 15, 'text': 'Priority scheduling'},
                {'id': 16, 'text': '24/7 telemedicine access'},
            ],
        },
    ]
    return Response(data)


@api_view(['GET'])
def comparison_list(request):
    """GET /api/employers/comparison/ — Feature comparison matrix (mock data)."""
    data = [
        {'id': 1, 'feature_name': 'Annual Health Screening', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 2, 'feature_name': 'Onsite Collections (5+ employees)', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 3, 'feature_name': 'Pre-Employment & DOT Testing', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 4, 'feature_name': 'Executive Health Credits', 'annual_coverage': False, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 5, 'feature_name': 'Family Member Add-ons', 'annual_coverage': False, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 6, 'feature_name': 'Dedicated Medical Advisor', 'annual_coverage': False, 'match_program': False, 'free_membership': False, 'medical_advice': True},
        {'id': 7, 'feature_name': 'Mobile Phlebotomy Access', 'annual_coverage': True, 'match_program': True, 'free_membership': True, 'medical_advice': True},
        {'id': 8, 'feature_name': 'Online Results Portal', 'annual_coverage': True, 'match_program': True, 'free_membership': True, 'medical_advice': True},
    ]
    return Response(data)

# --- Employer Portal Endpoints ---

from .auth import login_manual, verify_token, generate_token
from musb_backend.mongodb import (
    get_employers_collection, get_employees_collection, 
    get_credits_collection, get_onsite_requests_collection,
    get_invoices_collection, get_activity_log_collection,
    transform_doc
)
import datetime

@api_view(['POST'])
def signup_view(request):
    """
    POST /api/employers/signup/ — Register a new employer.
    Fields: name, company_name, email, office_location, office_contact_number, password
    """
    data = request.data
    required_fields = ['name', 'company_name', 'email', 'office_location', 'office_contact_number', 'password']
    
    # 1. Validation
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'"{field}" is required'}, status=status.HTTP_400_BAD_REQUEST)
            
    coll = get_employers_collection()
    
    # 2. Check for existing employer
    if coll.find_one({'email': data['email']}):
        return Response({'error': 'An employer with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    # 3. Create entry
    new_employer = {
        'name': data['name'],
        'company_name': data['company_name'],
        'email': data['email'],
        'office_location': data['office_location'],
        'office_contact_number': data['office_contact_number'],
        'password': data['password'], # Demo research project: storing as string
        'plan_name': 'Free Membership', # Default plan for new signups
        'plan_status': 'Active',
        'renewal_date': 'Pending',
        'created_at': datetime.datetime.utcnow()
    }
    
    insert_res = coll.insert_one(new_employer)
    employer_id = insert_res.inserted_id
    
    # 4. Generate initial token
    token = generate_token(employer_id, data['email'])
    
    return Response({
        'token': token,
        'user': {
            'id': str(employer_id),
            'email': data['email'],
            'company_name': data['company_name'],
            'name': data['name']
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_view(request):
    """POST /api/employers/login/ — Login with credentials or Google."""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check manual login (Developer account)
        login_data = login_manual(email, password)
        if login_data:
            return Response(login_data)
            
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        import traceback
        print(f"🔥 LOGIN CRASH: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': 'Internal Server Error (Login view crashed)',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_current_employer(request):
    """Helper to verify JWT and get employer info from request."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    return verify_token(token)

@api_view(['GET'])
def dashboard_stats(request):
    """GET /api/employers/dashboard/stats/ — Dynamic dashboard overview stats."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    employer_id = employer_payload['employer_id']
    
    # 1. Total Employees
    emp_coll = get_employees_collection()
    employees = list(emp_coll.find({'employer_id': employer_id}))
    emp_count = len(employees)
    
    # 2. Urgent / Next Due (simplified logic: status is Scheduled or Invited)
    next_due = len([e for e in employees if e.get('status') in ['Scheduled', 'Invited']])
    
    # 3. Credits / Wallet
    credits_coll = get_credits_collection()
    wallet = credits_coll.find_one({'employer_id': employer_id}) 
    if not wallet:
        wallet = {'owner_credits': 0, 'family_credits': 0, 'points': 0}
    
    # 4. Plan Info (from employer profile)
    emp_profile_coll = get_employers_collection()
    profile = emp_profile_coll.find_one({'employer_id': employer_id}) or {}
    
    stats = {
        'plan_status': profile.get('plan_status', 'Active'),
        'renewal_date': profile.get('renewal_date', 'Next Month'),
        'employees_count': emp_count,
        'next_due_count': next_due,
        'credits_wallet': {
            'owner_credits': wallet.get('owner_credits', 0),
            'family_credits': wallet.get('family_credits', 0),
            'points': wallet.get('points', 0)
        }
    }
    return Response(stats)

@api_view(['GET', 'POST'])
def employee_list(request):
    """GET/POST /api/employers/employees/ — Manage company employees."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    employer_id = employer_payload['employer_id']
    coll = get_employees_collection()
    
    if request.method == 'GET':
        employees = list(coll.find({'employer_id': employer_id}))
        return Response([transform_doc(e) for e in employees])
    
    elif request.method == 'POST':
        data = request.data
        data['employer_id'] = employer_id
        data['status'] = 'Invited'
        # Generate secure unique invitation token
        data['invite_token'] = str(uuid.uuid4())
        coll.insert_one(data)
        return Response({
            'message': 'Employee invited successfully',
            'invite_token': data['invite_token']
        })

@api_view(['DELETE'])
def employee_detail(request, employee_id):
    """DELETE /api/employers/employees/<id>/ — Remove an employee."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
    employer_id = employer_payload['employer_id']
    coll = get_employees_collection()
    
    # Verify ownership before deleting
    emp = coll.find_one({'_id': employee_id, 'employer_id': employer_id})
    if not emp:
        return Response({'error': 'Employee not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        
    success = coll.delete_one({'_id': employee_id})
    if success:
        return Response({'message': 'Employee removed successfully'})
    return Response({'error': 'Failed to delete'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def billing_history(request):
    """GET /api/employers/billing/ — Invoices and payment history from MongoDB."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    employer_id = employer_payload['employer_id']
    coll = get_invoices_collection()
    invoices = list(coll.find({'employer_id': employer_id}))
    
    return Response([transform_doc(i) for i in invoices])

@api_view(['GET', 'POST'])
def onsite_requests(request):
    """GET/POST /api/employers/onsite/ — Onsite event scheduling."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    coll = get_onsite_requests_collection()
    employer_id = employer_payload['employer_id']
    
    if request.method == 'GET':
        requests = list(coll.find({'employer_id': employer_id}))
        return Response([transform_doc(r) for r in requests])
        
    elif request.method == 'POST':
        data = request.data
        data['employer_id'] = employer_id
        data['status'] = 'Pending Approval'
        coll.insert_one(data)
        return Response({'message': 'Onsite request submitted'}, status=status.HTTP_201_CREATED)
