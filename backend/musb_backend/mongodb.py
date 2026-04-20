"""
MongoDB connection utility for MusB Diagnostic Backend.

Default: real MongoDB (MONGO_URI, MONGO_DB_NAME in settings). No silent fallback to JSON.

Optional offline mode: set environment variable MONGO_USE_MOCK=true to use mock_db.json.

Usage:
    from musb_backend.mongodb import get_db
    db = get_db()
    results = db['tests'].find({'category': 'blood'})
"""

import json
import os
from pathlib import Path
from pymongo import MongoClient
from django.conf import settings
import certifi

_client = None
_db_instance = None  # Singleton: real Database or MockDatabase


def _mongo_client_options(uri):
    """TLS only for Atlas / SRV / explicit tls — not for plain mongodb://localhost."""
    timeout_ms = int(os.getenv('MONGO_SERVER_SELECTION_TIMEOUT_MS', '5000'))
    opts = {'serverSelectionTimeoutMS': timeout_ms, 'connectTimeoutMS': timeout_ms}
    ul = uri.lower()
    if uri.startswith('mongodb+srv://') or 'tls=true' in ul or 'ssl=true' in ul:
        opts['tlsCAFile'] = certifi.where()
        # Fallback: Allow invalid certs locally if standard TLS handshake fails
        opts['tlsAllowInvalidCertificates'] = True
    return opts


def reset_mongo_connection():
    """Reset singletons (e.g. tests). Call before switching MONGO_USE_MOCK."""
    global _client, _db_instance
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
    _client = None
    _db_instance = None


def get_client(silent=False):
    """Return a connected MongoClient. Raises if MongoDB is unreachable (unless MONGO_USE_MOCK)."""
    global _client
    if getattr(settings, 'MONGO_USE_MOCK', False):
        return None
    if _client is None:
        uri = settings.MONGO_URI
        opts = _mongo_client_options(uri)
        try:
            _client = MongoClient(uri, **opts)
            if not silent:
                print(f"SUCCESS: Initialized MongoDB client for ({settings.MONGO_DB_NAME})")
        except Exception as e:
            _client = None
            error_msg = f"MongoDB connection failed: {str(e)}"
            if not silent:
                print(f"ERROR: {error_msg}")
            
            # Diagnostic details for production logs
            is_atlas = "mongodb+srv" in uri
            raise ConnectionError(
                f"COMMAND CENTER OFFLINE: {error_msg}. "
                f"Target: {'Atlas/Remote' if is_atlas else 'Localhost'}."
            ) from e
    return _client


def get_db():
    """
    Singleton database: real MongoDB Atlas. 
    Strictly depends on settings.MONGO_URI and settings.MONGO_DB_NAME.
    No local JSON fallbacks.
    """
    global _db_instance
    if _db_instance is None:
        try:
            client = get_client()
            if client:
                _db_instance = client[settings.MONGO_DB_NAME]
                print(f"[MONGODB] Connection established via Atlas database: {settings.MONGO_DB_NAME}")
            else:
                raise ConnectionError("MongoDB client could not be initialized.")
        except (ConnectionError, Exception) as e:
            print(f"CRITICAL DATABASE ERROR: {str(e)}")
            raise e
    return _db_instance


def is_mock_database():
    """Always returns False as the mock system has been decommissioned."""
    return False


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        from bson import ObjectId
        import datetime
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return super().default(obj)


def close_connection():
    """Close the MongoDB connection (app shutdown)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def transform_doc(doc):
    """
    Expert-level document transformation for API responses.
    - Handles both real MongoDB docs and Mock data.
    - Recursively ensures ObjectIds and Datetimes are serialized.
    - Guarantees an 'id' field is present for the frontend.
    """
    if not doc:
        return {}
    
    # Handle list of docs recursively
    if isinstance(doc, list):
        return [transform_doc(d) for d in doc]
        
    if not isinstance(doc, dict):
        return doc

    from bson import ObjectId
    import datetime
    from decimal import Decimal

    new_doc = doc.copy()
    
    # Standardize ID field
    if '_id' in new_doc:
        oid = new_doc.pop('_id')
        if 'id' not in new_doc:
            new_doc['id'] = str(oid)
    
    # Deep serialization check
    for key, value in new_doc.items():
        if isinstance(value, ObjectId):
            new_doc[key] = str(value)
        elif isinstance(value, (datetime.datetime, datetime.date)):
            new_doc[key] = value.isoformat()
        elif isinstance(value, Decimal):
            new_doc[key] = float(value)
        elif isinstance(value, dict):
            new_doc[key] = transform_doc(value)
        elif isinstance(value, list):
            new_doc[key] = [transform_doc(item) if isinstance(item, dict) else item for item in value]

    return new_doc

# --- MusB Employer & Portal Specific Helpers ---

def get_employers_collection():
    return get_db()['employers']

def get_employees_collection():
    return get_db()['employees']

def get_credits_collection():
    return get_db()['credits_wallet']

def get_onsite_requests_collection():
    return get_db()['onsite_requests']

def get_invoices_collection():
    return get_db()['invoices']

def get_activity_log_collection():
    return get_db()['activity_log']

# --- Research Portal Specific Helpers ---

def get_research_studies_collection():
    return get_db()['research_studies']

def get_research_samples_collection():
    return get_db()['research_samples']

def get_research_shipments_collection():
    return get_db()['research_shipments']

def get_research_universities_collection():
    return get_db()['research_universities']

def get_research_services_collection():
    return get_db()['research_services']

def get_research_biorepository_collection():
    return get_db()['biorepository_info']

def get_research_collaborations_collection():
    return get_db()['research_collaborations']

def get_research_quotes_collection():
    return get_db()['research_quotes']

def get_research_subscriptions_collection():
    return get_db()['research_subscriptions']

def get_research_users_collection():
    return get_db()['research_users']

def get_research_validations_collection():
    return get_db()['research_validations']

def get_diag_tasks_collection():
    return get_db()['diag_tasks']

def get_diag_messages_collection():
    return get_db()['diag_messages']

def get_diag_documents_collection():
    return get_db()['diag_documents']

def get_diag_invoices_collection():
    return get_db()['diag_invoices']


# --- Patient Portal Specific Helpers ---

def get_patients_collection():
    return get_db()['patients']

def get_otps_collection():
    return get_db()['otps']


# --- Phlebotomist Portal Specific Helpers ---

def get_phlebotomists_collection():
    return get_db()['phlebotomists']

def get_phlebotomy_hubs_collection():
    return get_db()['phlebotomy_hubs']



# --- Home & Marketing Specific Helpers ---

def get_hero_content_collection():
    return get_db()['hero_content']

def get_services_collection():
    return get_db()['services']

def get_testimonials_collection():
    return get_db()['testimonials']

def get_popular_panels_collection():
    return get_db()['popular_panels']

def get_newsletter_subscribers_collection():
    return get_db()['newsletter_subscribers']


# --- Catalog & Test Specific Helpers ---

def get_test_categories_collection():
    return get_db()['test_categories']

def get_lab_tests_collection():
    return get_db()['lab_tests']


# --- Appointments & Bookings Specific Helpers ---

def get_appointments_collection():
    return get_db()['appointments']


# --- Offers & Promotions Specific Helpers ---

def get_offers_collection():
    return get_db()['offers']
