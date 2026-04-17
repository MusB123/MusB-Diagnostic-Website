import jwt
import datetime
from django.conf import settings

def generate_token(user_payload):
    """Generate a JWT for the patient."""
    payload = {
        'user_id': user_payload['id'],
        'email': user_payload.get('email', ''),
        'name': user_payload.get('name', 'Patient'),
        'role': 'patient',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Decode and verify the patient portal token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
