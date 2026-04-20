import uuid
from bson import ObjectId
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.utils.html import strip_tags
from email.mime.image import MIMEImage
import qrcode
import io
import base64
import datetime


@api_view(['GET'])
def plans_list(request):
    """GET /api/employers/plans/ — Corporate plan tiers fetched from MongoDB."""
    from musb_backend.mongodb import get_db
    db = get_db()
    coll = db['corporate_plans']
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])


@api_view(['GET'])
def comparison_list(request):
    """GET /api/employers/comparison/ — Feature comparison matrix fetched from MongoDB."""
    from musb_backend.mongodb import get_db
    db = get_db()
    coll = db['comparison_matrix']
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])

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
            # Enforce transformation for production serialization stability
            return Response(transform_doc(login_data))
            
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
    
    try:
        profile = emp_profile_coll.find_one({'_id': ObjectId(employer_id)}) or {}
    except:
        profile = {'plan_status': 'Active'}
    
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
    try:
        obj_id = ObjectId(employee_id)
    except:
        return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
    emp = coll.find_one({'_id': obj_id, 'employer_id': employer_id})
    if not emp:
        return Response({'error': 'Employee not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        
    success = coll.delete_one({'_id': obj_id})
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


# --- Plan Selection Endpoint ---

PLAN_NAMES = {
    1: 'Annual Coverage',
    2: 'Match Program',
    3: 'Free Membership',
    4: 'Medical Advice',
}

@api_view(['POST'])
def select_plan(request):
    """POST /api/employers/select-plan/ — Activate a chosen plan for the employer."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    plan_id = request.data.get('plan_id')
    if not plan_id or int(plan_id) not in PLAN_NAMES:
        return Response({'error': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)

    plan_name = PLAN_NAMES[int(plan_id)]
    employer_id = employer_payload['employer_id']

    emp_coll = get_employers_collection()
    renewal = (datetime.datetime.utcnow() + datetime.timedelta(days=365)).strftime('%b %d, %Y')

    try:
        emp_coll.update_one(
            {'_id': ObjectId(employer_id)},
            {'$set': {
                'plan_name': plan_name,
                'plan_status': 'Active',
                'renewal_date': renewal,
                'plan_activated_at': datetime.datetime.utcnow(),
            }}
        )
    except Exception as e:
        print(f"PLAN UPDATE ERROR: {e}")
        return Response({'error': 'Failed to update plan in database'}, status=500)

    return Response({
        'message': f'Plan "{plan_name}" activated successfully.',
        'plan_name': plan_name,
        'renewal_date': renewal,
    })


@api_view(['POST'])
def send_invite_email(request, employee_id):
    """POST /api/employers/employees/<id>/send-email/ — Send enrollment link via email."""
    employer_payload = get_current_employer(request)
    if not employer_payload:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    employer_id = employer_payload['employer_id']
    coll = get_employees_collection()

    try:
        obj_id = ObjectId(employee_id)
    except:
        return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)

    emp = coll.find_one({'_id': obj_id, 'employer_id': employer_id})
    if not emp:
        return Response({'error': 'Employee not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)

    # Link Construction - Using FRONTEND_URL from settings for production reliability
    recipient = emp['email']
    base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    
    enroll_link = f"{base_url}/enroll/{emp.get('invite_token')}"

    # Generate QR Code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(enroll_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    qr_buffer = io.BytesIO()
    img.save(qr_buffer, format="PNG")
    qr_data = qr_buffer.getvalue()

    # Compose Professional HTML Email
    company_name = employer_payload.get('company_name', 'MusB Health')
    subject = f"Invitation to Join {company_name}"
    
    html_content = f"""
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 5px;">MusB Diagnostics</h1>
          <p style="color: #64748b; margin: 0;">Corporate Wellness Program</p>
        </div>
        
        <h2 style="font-size: 1.25rem; font-weight: 700;">Hello {emp['full_name']},</h2>
        
        <p>You have been invited by <strong>{company_name}</strong> to join the MusB Diagnostic health platform. This program provides you with seamless access to diagnostic services and health tracking.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="{enroll_link}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">Accept Invitation & Enroll</a>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
          <p style="margin-top: 0; font-weight: 600;">Scan to Enroll Instantly</p>
          <img src="cid:qrcode_img" alt="QR Code" width="180" height="180" style="margin: 0 auto;" />
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0;">Scan this code with your phone camera</p>
        </div>
        
        <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #94a3b8;">
          <p>If the button above doesn't work, copy and paste this link: <br/> 
          <a href="{enroll_link}" style="color: #10b981;">{enroll_link}</a></p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: #94a3b8;">
          <p>&copy; {datetime.datetime.now().year} MusB Diagnostics. All rights reserved.</p>
        </div>
      </body>
    </html>
    """
    text_content = strip_tags(html_content)

    try:
        email = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [recipient])
        email.attach_alternative(html_content, "text/html")
        
        # Attach QR code inline with reliable MIME type handling
        mime_img = MIMEImage(qr_data)
        mime_img.add_header('Content-ID', '<qrcode_img>')
        mime_img.add_header('Content-Disposition', 'inline', filename='qr.png')
        email.attach(mime_img)
        
        email.send(fail_silently=False)

        # Update metadata
        coll.update_one({'_id': obj_id}, {'$set': {'invite_sent_at': datetime.datetime.utcnow()}})
        
        return Response({'message': f'Invitation email sent to {recipient}'})
        return Response({'message': f'Invitation email sent to {recipient}'})
    except Exception as e:
        # LOG RAW ERROR FOR PRODUCTION DEBUGGING
        err_msg = str(e)
        print(f"🔥 PRODUCTION SMTP ERROR: {err_msg}")
        return Response({
            'error': 'SMTP_DELIVERY_FAILURE',
            'message': 'Real email delivery failed.',
            'raw_technical_error': err_msg,
            'hint': 'Visit /api/employers/debug-email/ to see the exact reason Google rejected this send.'
        }, status=500)


@api_view(['GET'])
def debug_email(request):
    """
    Expert-level diagnostic endpoint to verify SMTP credentials in production.
    Visit this URL to see the RAW error message from Google.
    """
    try:
        from django.core.mail import send_mail
        subject = "SMTP Diagnostic Test - MusB Diagnostics"
        message = (
            "This is a technical diagnostic email.\n\n"
            "If you received this, your production SMTP settings (SSL Port 465) are WORKING CORRECTLY.\n"
            "Invitations will now be delivered successfully."
        )
        recipient = settings.EMAIL_HOST_USER
        
        # Force a real send test
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
        
        return Response({
            'status': 'SMTP_CONNECTION_VERIFIED',
            'message': f'Diagnostic email sent to {recipient}. Your settings are perfect.',
            'details': {
                'host': settings.EMAIL_HOST,
                'port': settings.EMAIL_PORT,
                'user': settings.EMAIL_HOST_USER,
                'ssl': settings.EMAIL_USE_SSL
            }
        })
    except Exception as e:
        import traceback
        return Response({
            'status': 'SMTP_CONNECTION_FAILED',
            'error_type': type(e).__name__,
            'raw_google_error': str(e),
            'traceback': traceback.format_exc() if settings.DEBUG else 'Hidden in production',
            'urgent_action': 'Check your Gmail App Password (16 chars) and verify EMAIL_HOST_USER.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def verify_enrollment(request, token):
    """
    GET /api/employers/enroll/verify/<token>/ — Publicly verify invitation token.
    No Auth needed as this is a public verification for the signup flow.
    """
    emp_coll = get_employees_collection()
    employee = emp_coll.find_one({'invite_token': token})
    
    if not employee:
        return Response({'error': 'Invitation invalid or expired'}, status=status.HTTP_404_NOT_FOUND)
    
    if employee.get('status') == 'Enrolled':
        return Response({'error': 'ALREADY_ENROLLED'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Fetch employer info for branding
    employer_coll = get_employers_collection()
    employer_id = employee.get('employer_id')
    
    company_name = "MusB Corporate Partner"
    plan_name = employee.get('plan_name', 'Annual Health Coverage')
    
    try:
        employer = employer_coll.find_one({'_id': ObjectId(employer_id)})
        if employer:
            company_name = employer.get('company_name', company_name)
    except Exception:
        pass
            
    return Response({
        'full_name': employee.get('full_name'),
        'email': employee.get('email'),
        'company_name': company_name,
        'program_type': plan_name,
        'status': employee.get('status')
    })


@api_view(['POST', 'GET']) # GET for easy debug
def complete_enrollment(request, token):
    """POST /api/employers/enroll/complete/<token>/ — Finalize employee enrollment."""
    emp_coll = get_employees_collection()
    employee = emp_coll.find_one({'invite_token': token})
    
    if not employee:
        return Response({'error': 'Invitation invalid or expired'}, status=status.HTTP_404_NOT_FOUND)
    
    if employee.get('status') == 'Enrolled':
        return Response({'error': 'This enrollment has already been completed.'}, status=status.HTTP_400_BAD_REQUEST)
        
    emp_coll.update_one({'invite_token': token}, {
        '$set': {
            'status': 'Enrolled', 
            'enrolled_at': datetime.datetime.utcnow()
        }
    })
    
    return Response({'message': 'Enrollment complete', 'status': 'Enrolled'})


