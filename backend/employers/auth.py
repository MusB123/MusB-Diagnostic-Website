import jwt
import datetime
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from musb_backend.mongodb import get_employers_collection

def generate_token(employer_id, email):
    payload = {
        'employer_id': str(employer_id),
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_manual(email, password):
    """
    Expert implementation of employer login: 
    Checks the 'employers' collection for an email match, then verifies the password.
    Includes a demo fallback for presentation reliability.
    coll = get_employers_collection()
    employer = coll.find_one({'email': email})
    
    # Simple password check for this demo/research project
    if employer and employer.get('password') == password:
        employer_id = employer['_id']
        token = generate_token(employer_id, email)
        
        return {
            'token': token,
            'user': {
                'id': str(employer_id),
                'email': email,
                'company_name': employer.get('company_name', 'Unnamed Corp'),
                'name': employer.get('name', 'Employer')
            }
        }
        
    return None
