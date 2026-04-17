import random
import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .otp_service import OTPService
from .auth import generate_token
from musb_backend.mongodb import get_db, transform_doc

def get_otps_collection():
    return get_db()['otps']

def get_patients_collection():
    return get_db()['patients']

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
    coll.update_one(
        {'identifier': identifier},
        {'$set': {
            'identifier': identifier,
            'type': id_type,
            'code': otp_code,
            'expiry': expiry,
            'created_at': datetime.datetime.utcnow()
        }},
        upsert=True
    )
    
    # Send via Email (if email provided)
    if email:
        sent = OTPService.send_email_otp(email, otp_code)
    else:
        # Fallback to console for phone for now (since user wanted to move away from Twilio)
        print(f"\n[INTERNAL] SMS OTP for {phone}: {otp_code}\n")
        sent = True
    
    if sent:
        return Response({'message': f'OTP sent successfully to {id_type}.'})
    else:
        return Response({'error': f'Failed to send code to {id_type}.'}, status= status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            return Response({'error': 'TOTP secret not found. Please restart setup.'}, status=400)
            
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
            if otp_record['expiry'] > datetime.datetime.utcnow():
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
