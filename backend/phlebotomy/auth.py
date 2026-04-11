import jwt
import datetime
from django.conf import settings
import logging
from musb_backend.mongodb import get_phlebotomists_collection

logger = logging.getLogger(__name__)


def _phleb_public_id(user_doc):
    """Match dispatch: assigned_phlebotomist_id uses `id` when present, else Mongo _id."""
    if not user_doc:
        return ''
    uid = user_doc.get('id')
    if uid is not None and str(uid).strip() != '':
        return str(uid)
    raw = user_doc.get('_id')
    return str(raw) if raw is not None else ''


def generate_token(user_payload):
    """Generate a JWT for the phlebotomist."""
    payload = {
        'user_id': user_payload['id'],
        'email': user_payload['email'],
        'name': user_payload['name'],
        'company': user_payload['company'],
        'role': 'phlebotomist',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def login_phleb(email, password):
    """Verify phlebotomist credentials and return user info + token."""
    try:
        # Robustness: trim and lower case for email
        email = email.strip().lower() if email else ""
        password = password.strip() if password else ""
        
        logger.info(f"Phleb Login attempt for {email}")
        
        # Hardcoded demo user for developer testing
        if (email == 'phleb@musb.com') and (password == 'MusB2026'):
            demo_user = {
                'id': 'PHLEB-01',
                'email': email,
                'name': 'Demo Specialist (Sarah route)',
                'company': 'MusB Field Ops'
            }
            token = generate_token(demo_user)
            return {'token': token, 'user': demo_user}

        coll = get_phlebotomists_collection()
        user = coll.find_one({'email': email})
        
        if user:
            # Defensive field access
            db_password = user.get('password')
            if db_password == password:
                user_data = {
                    'id': _phleb_public_id(user),
                    'email': user.get('email', email),
                    'name': user.get('name', 'Specialist'),
                    'company': user.get('company', 'MusB Logistics')
                }
                token = generate_token(user_data)
                return {
                    'token': token,
                    'user': user_data
                }
            else:
                logger.warning(f"Auth failed: Incorrect password for {email}")
        else:
            logger.warning(f"Auth failed: User {email} not found")
            
    except Exception as e:
        logger.error(f"SYSTEM AUTH ERROR [Phleb Login]: {str(e)}", exc_info=True)
        raise # Rethrow to be caught by view
        
    return None

def verify_token(token):
    """Decode and verify the phlebotomist portal token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
