import random
import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .otp_service import OTPService
from .auth import generate_token, verify_token
from django.conf import settings
from musb_backend.mongodb import (
    get_patients_collection, get_otps_collection, 
    get_appointments_collection, get_phlebotomists_collection,
    get_diag_documents_collection, transform_doc
)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/patients/login/
    Body: { "email": "...", "password": "..." }
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)

    coll = get_patients_collection()
    patient = coll.find_one({'email': email})

    if not patient:
        return Response({'error': 'Account not found. Please sign up.'}, status=401)

    # SECURE CHECK: Strictly verify password exists and matches
    db_password = patient.get('password')
    if db_password is None or db_password == "":
        return Response({
            'error': 'Account security mismatch. Please use "Sign Up" with your email to set a valid password.'
        }, status=401)

    if str(db_password) != str(password):
        return Response({'error': 'Invalid password.'}, status=401)

    # Standardize doc for token generation (ensures 'id' field exists)
    patient = transform_doc(patient)

    return Response({
        'token': generate_token(patient),
        'user': {
            'id': str(patient.get('_id')),
            'name': patient.get('name'),
            'email': patient.get('email'),
            'phone': patient.get('phone'),
            'mfa_enabled': bool(patient.get('totp_secret'))
        }
    })

@api_view(['GET'])
def dashboard_view(request):
    """
    GET /api/patients/dashboard/
    Requires JWT token in Authorization header.
    """
    # 1. Verify Token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Unauthorized'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload:
        return Response({'error': 'Invalid or expired session.'}, status=401)
    
    email = payload.get('email')
    
    # 2. Fetch Data from MongoDB
    appt_coll = get_appointments_collection()
    
    # Filter by logged-in patient's email
    # Try multiple keys to support legacy and new data
    user_query = {'$or': [{'patient_email': email}, {'email': email}]}
    all_appts = list(appt_coll.find(user_query))
    
    # Categorize based on status
    upcoming_statuses = ['upcoming', 'pending_approval', 'Pending', 'approved', 'assigned', 'in_progress']
    past_statuses = ['completed', 'cancelled', 'rejected']
    
    upcoming = [transform_doc(a) for a in all_appts if a.get('status') in upcoming_statuses]
    past = [transform_doc(a) for a in all_appts if a.get('status') in past_statuses]
    
    # specialists
    phleb_coll = get_phlebotomists_collection()
    saved_phlebs = list(phleb_coll.find({}))[:3] # Limit to 3 for overview
    
    # documents
    doc_coll = get_diag_documents_collection()
    docs = list(doc_coll.find({}))
    
    def _format_appt(a):
        doc = transform_doc(a)
        # Add formatted date parts for the frontend UI
        pref_date = doc.get('preferred_date')
        if pref_date:
            try:
                dt = datetime.datetime.fromisoformat(pref_date)
                doc['month'] = dt.strftime('%b')
                doc['day'] = dt.strftime('%d')
            except:
                doc['month'] = '???'
                doc['day'] = '??'
        else:
            doc['month'] = 'TBD'
            doc['day'] = '--'
        
        # Use test_name if available
        doc['test'] = doc.get('test_name', 'Clinical Test')
        # Map time fields
        doc['time'] = doc.get('preferred_time', 'TBD')
        # Phlebotomist assignment placeholder or real name
        doc['phlebotomist'] = doc.get('assigned_phlebotomist_name', 'Awaiting Assignment')
        # Include rejection reason for feedback
        doc['rejection_reason'] = doc.get('rejection_reason', '')
        return doc

    return Response({
        'upcoming': [_format_appt(a) for a in all_appts if a.get('status') in upcoming_statuses],
        'past': [_format_appt(a) for a in all_appts if a.get('status') in past_statuses],
        'saved_phlebotomists': [transform_doc(p) for p in saved_phlebs],
        'documents': [transform_doc(d) for d in docs],
        'stats': {
            'total': len(all_appts),
            'completed': len([a for a in all_appts if a.get('status') == 'completed']),
            'upcoming': len(upcoming)
        }
    })

@api_view(['POST'])
def book_appointment(request):
    """
    POST /api/patients/book-appointment/
    Body: { 
        "test_id": "...", 
        "full_name": "...", 
        "email": "...", 
        "phone": "...", 
        "address": "...", 
        "visit_type": "...", 
        "preferred_date": "...", 
        "preferred_time": "...",
        "payment_method": "...",
        "payment_info": { ... }
    }
    """
    # 1. Verify Token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Unauthorized'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload:
        return Response({'error': 'Invalid or expired session.'}, status=401)
    
    # 2. Extract and Sanitize Data
    data = request.data
    email_from_token = payload.get('email')
    
    # Robust Name Resolution: Fetch from DB using token email
    patients_coll = get_patients_collection()
    patient_record = patients_coll.find_one({'email': email_from_token})
    db_name = patient_record.get('name') if patient_record else None
    
    booking_data = {
        'test_id': data.get('test_id'),
        'test_name': data.get('test_name'),
        'test_price': data.get('test_price'),
        'patient_email': email_from_token,
        'full_name': db_name or data.get('full_name') or 'Patient',
        'email': data.get('email'), # Contact email
        'phone': data.get('phone'),
        'address': data.get('address'),
        'visit_type': data.get('visit_type'),
        'preferred_date': data.get('preferred_date'),
        'preferred_time': data.get('preferred_time'),
        'payment_method': data.get('payment_method', 'Credit Card'),
        'status': 'pending_approval',
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    
    # Optional non-sensitive payment bits
    if 'payment_info' in data:
        p_info = data['payment_info']
        sensitive = ['card_number', 'cvv', 'cvc', 'expiry', 'password']
        booking_data['payment_info'] = {k: v for k, v in p_info.items() if k.lower() not in sensitive}

    # 3. Save to MongoDB
    coll = get_appointments_collection()
    res = coll.insert_one(booking_data)
    
    return Response({
        'message': 'Appointment request submitted successfully. Waiting for Admin Approval.',
        'appointment_id': str(res.inserted_id)
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def request_otp(request):
    """
    POST /api/patients/request-otp/
    Body: { "email": "user@example.com" } OR { "phone": "+123..." }
    """
    data = request.data
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    
    if not email and not phone:
        return Response({'error': 'Email or Phone is required.'}, status=400)
    
    identifier = email if email else phone
    id_type = 'email' if email else 'phone'
    
    # Generate 6-digit OTP
    otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    
    # Store in MongoDB
    coll = get_otps_collection()
    otp_payload = {
        'identifier': identifier,
        'type': id_type,
        'code': otp_code,
        'expiry': expiry,
        'created_at': datetime.datetime.utcnow()
    }
    # Real MongoDB path with upsert
    coll.update_one({'identifier': identifier}, {'$set': otp_payload}, upsert=True)
    
    # Send via Email (if email provided)
    sent = True
    email_error = None
    if email:
        sent, email_error = OTPService.send_email_otp(email, otp_code)
    else:
        # Fallback to console for phone for now
        print(f"\n[INTERNAL] SMS OTP for {phone}: {otp_code}\n")
    
    if sent:
        return Response({'message': f'OTP sent successfully to {id_type}.'})
    
    # Expert Resilience: We allow the request to succeed if email delivery fails but we are in DEBUG 
    # OR if SMTP is simply not configured yet (matching local experience).
    if settings.DEBUG or not getattr(settings, 'EMAIL_HOST_PASSWORD', None):
        return Response({
            'message': f'OTP generated successfully. Check server logs for code.',
            'debug_info': f'Email delivery failed: {email_error}'
        })

    return Response({
        'error': f'Failed to send code to {id_type}.',
        'details': email_error or 'Unknown SMTP error. Check backend configuration.'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def setup_totp(request):
    """
    POST /api/patients/setup-totp/
    Body: { "email": "user@example.com" }
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required for App-based setup.'}, status=400)
    
    secret = OTPService.generate_totp_secret()
    uri = OTPService.get_totp_uri(secret, email)
    qr_code = OTPService.get_totp_qr_base64(uri)
    
    # Pre-save secret in patient doc or a pending_setup collection
    # For now, we'll return it to the frontend to hold until verification
    return Response({
        'secret': secret,
        'qr_code': qr_code,
        'uri': uri
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    POST /api/patients/verify-otp/
    Body: { 
        "token": "123456", 
        "email": "user@example.com", 
        "phone": "+123...", 
        "method": "email" | "totp",
        "name": "...", 
        "secret": "..." (for totp setup)
    }
    """
    data = request.data
    method = data.get('method', 'email')
    token = data.get('token', '').strip() or data.get('code', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    secret = data.get('secret', '').strip() # For TOTP setup verification
    
    if not token:
        return Response({'error': 'Verification code is required.'}, status=400)

    is_valid = False
    
    if method == 'totp':
        # If user is already verified with TOTP in DB, we'd fetch secret from there. 
        # For setup, we use the secret passed from frontend.
        patients_coll = get_patients_collection()
        patient = patients_coll.find_one({'email': email})
        
        current_secret = secret
        if patient and patient.get('totp_secret'):
            current_secret = patient['totp_secret']
            
        if not current_secret:
            return Response({'error': 'Authenticator secret not found. Please restart setup.'}, status=400)
            
        is_valid = OTPService.verify_totp(current_secret, token)
        if is_valid and patient:
            # If it was a setup, save the secret
            if secret and not patient.get('totp_secret'):
                patients_coll.update_one({'email': email}, {'$set': {'totp_secret': secret}})
    else:
        # Email / Phone OTP
        identifier = email if email else phone
        coll = get_otps_collection()
        otp_record = coll.find_one({'identifier': identifier})
        
        if otp_record and otp_record['code'] == token:
            expiry = otp_record.get('expiry')
            if isinstance(expiry, str):
                try:
                    expiry = datetime.datetime.fromisoformat(expiry.replace('Z', '+00:00')).replace(tzinfo=None)
                except Exception:
                    expiry = None
            if expiry and expiry > datetime.datetime.utcnow():
                is_valid = True
                coll.delete_one({'identifier': identifier})
    
    if not is_valid:
        return Response({'error': 'Invalid or expired verification code.'}, status=400)
    
    # Success! Create/Update Patient User
    patients_coll = get_patients_collection()
    identifier_query = {'email': email} if email else {'phone': phone}
    patient = patients_coll.find_one(identifier_query)
    
    if not patient:
        patient_data = {
            'email': email,
            'phone': phone,
            'name': data.get('name', 'New Patient'),
            'password': data.get('password'), # Saving the password for real auth later
            'status': 'verified',
            'created_at': datetime.datetime.utcnow()
        }
        if method == 'totp' and secret:
            patient_data['totp_secret'] = secret
            
        res = patients_coll.insert_one(patient_data)
        patient = patient_data
        patient['id'] = str(res.inserted_id)
    else:
        update_fields = {'status': 'verified'}
        if data.get('name'): update_fields['name'] = data['name']
        
        # SECURE SIGNUP: Always reinforce password during verification/signup
        safe_password = data.get('password', '').strip()
        if safe_password:
            update_fields['password'] = safe_password
            
        if method == 'totp' and secret: update_fields['totp_secret'] = secret
        
        patients_coll.update_one(identifier_query, {'$set': update_fields})
        patient.update(update_fields)
        patient = transform_doc(patient)

    return Response({
        'token': generate_token(patient),
        'user': {
            'id': patient.get('id'),
            'name': patient.get('name'),
            'email': patient.get('email'),
            'phone': patient.get('phone'),
            'mfa_enabled': bool(patient.get('totp_secret'))
        }
    })
