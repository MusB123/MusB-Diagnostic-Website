import jwt
import datetime
from django.conf import settings
from musb_backend.mongodb import get_research_users_collection

# In a real app, these would be in the database and hashed.
# For this lab portal demo, we use a controlled set of research users.
# Authentication now queries the 'research_users' MongoDB collection.

def generate_token(user_payload):
    """Generate a JWT for the research user."""
    payload = {
        'user_id': user_payload['id'],
        'email': user_payload['email'],
        'name': user_payload['name'],
        'institution': user_payload['institution'],
        'role': user_payload['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def login_manual(email, password):
    """
    Verify research credentials and return user info + token.
    Includes a demo fallback for presentation reliability.
    """
    # Hardcoded fallback for presentation stability
    if email == 'research@musb.com' and (password == 'research2026' or password == 'MusB123'):
        demo_user = {
            'id': 'research_demo_id',
            'email': email,
            'name': 'Dr. MusB (Demo)',
            'role': 'admin',
            'institution': 'MusB Central Lab'
        }
        return {
            'token': generate_token(demo_user),
            'user': demo_user
        }

    coll = get_research_users_collection()
    user = coll.find_one({'email': email})
    
    if user and user.get('password') == password:
        # Transform _id to id if necessary
        user_data = {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user['name'],
            'role': user.get('role', 'client'),
            'institution': user.get('institution', 'Independent Researcher')
        }
        token = generate_token(user_data)
        return {
            'token': token,
            'user': user_data
        }
    return None

def verify_token(token):
    """Decode and verify the research portal token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
