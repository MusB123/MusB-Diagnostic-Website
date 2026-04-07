"""
MongoDB connection utility for MusB Diagnostic Backend.

Usage in views/services:
    from musb_backend.mongodb import get_db

    db = get_db()
    collection = db['tests']
    results = collection.find({'category': 'blood'})
"""

import json
from pathlib import Path
from pymongo import MongoClient
from django.conf import settings
import certifi

_client = None
_use_fallback = False
_db_instance = None # Singleton Instance

def get_client(silent=False):
    """Get or create singleton MongoClient with fallback detection."""
    global _client, _use_fallback
    if _client is None and not _use_fallback:
        try:
            # Using certifi for secure Atlas connection
            _client = MongoClient(
                settings.MONGO_URI, 
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=5000  # 5-second timeout for rapid fallback
            )
            # Force a connection check
            _client.admin.command('ping')
            if not silent:
                print("✅ Successfully connected to MongoDB Atlas!")
        except Exception as e:
            if not silent:
                print(f"⚠️  WARNING: MongoDB Atlas connection failed: {e}")
                print("🚀 Switching to Local Mock Database (backend/mock_db.json)")
            _use_fallback = True
            _client = None
    return _client


def get_db():
    """Get the database instance (Singleton)."""
    global _db_instance
    if _db_instance is None:
        client = get_client()
        if _use_fallback or client is None:
            _db_instance = MockDatabase()
        else:
            _db_instance = client[settings.MONGO_DB_NAME]
    return _db_instance


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        from bson import ObjectId
        import datetime
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return super().default(obj)

class MockDatabase:
    """A minimal mock object that behaves like a pymongo DB but reads from a JSON file."""
    def __init__(self):
        # Professional-grade absolute path resolution
        self._set_paths()
        try:
            with open(self.path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"⚠️ [MOCK DB] Data Load Warning: {e}")
            self.data = {}

    def _set_paths(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.path = base_dir / "mock_db.json"

    def __getitem__(self, collection_name):
        # Pass the database object to the collection so it can trigger saves
        return MockCollection(self, collection_name)

    def _save(self):
        """Write the current in-memory data back to the JSON file."""
        try:
            # Use custom encoder to handle ObjectId and datetime
            with open(self.path, 'w') as f:
                json.dump(self.data, f, indent=4, cls=MongoJSONEncoder)
            print(f"💾 [MOCK DB] Changes persisted to {self.path}")
        except Exception as e:
            print(f"❌ [MOCK DB] Error saving to file: {e}")


class MockCollection:
    """A minimal mock object for pymongo collections."""
    def __init__(self, db, name):
        self.db = db
        self.name = name
        self.items = db.data.get(name, [])

    def find(self, query=None, *args, **kwargs):
        if not query:
            return self.items
        
        filtered = self.items
        
        # Support search (regex-like)
        search_val = query.get('title', {}).get('$regex', '') if isinstance(query.get('title'), dict) else None
        if search_val:
            filtered = [i for i in filtered if search_val.lower() in i.get('title', '').lower()]
            
        # Support exact matches (category_name, sample_type, etc.)
        for key, val in query.items():
            if key == 'title' or isinstance(val, dict):
                continue
            if val and val != 'All':
                filtered = [i for i in filtered if i.get(key) == val]
                
        return filtered

    def find_one(self, query=None, *args, **kwargs):
        """Mock find_one: returns the first matching item or None."""
        results = self.find(query, *args, **kwargs)
        return results[0] if results and len(results) > 0 else None

    def insert_one(self, doc):
        """Mock insert_one: appends to internal list and persists to file."""
        if '_id' not in doc:
            from bson import ObjectId
            doc['_id'] = ObjectId()
            
        print(f"📝 [MOCK] Saving to local mock DB memory: {doc}")
        
        # Add to the correct collection in the DB object
        if self.name not in self.db.data:
            self.db.data[self.name] = []
        self.db.data[self.name].append(doc)
        
        # Update local ref for find()
        self.items = self.db.data[self.name]
        
        # Persist to disk
        self.db._save()
        
        class InsertResult:
            def __init__(self, id): self.inserted_id = id
        return InsertResult(doc['_id'])

    def insert_many(self, docs):
        """Mock insert_many: appends multiple documents."""
        results = []
        for doc in docs:
            results.append(self.insert_one(doc).inserted_id)
        
        class InsertManyResult:
            def __init__(self, ids): self.inserted_ids = ids
        return InsertManyResult(results)

    def delete_one(self, query):
        """Mock delete_one: removes ONLY the first item matching the query and persists."""
        if not query: return False
        
        if self.name not in self.db.data:
            return False
            
        target_idx = -1
        # Explicit search for the first match
        for idx, item in enumerate(self.db.data[self.name]):
            is_match = True
            for key, val in query.items():
                from bson import ObjectId
                db_val = item.get(key)
                
                # Precise comparison: Convert both to strings if they are ObjectIds
                norm_query_val = str(val) if isinstance(val, ObjectId) else val
                norm_db_val = str(db_val) if isinstance(db_val, ObjectId) else db_val
                
                if norm_db_val != norm_query_val:
                    is_match = False
                    break
            
            if is_match:
                target_idx = idx
                break
        
        if target_idx != -1:
            # Atomic removal of exactly one record
            removed_item = self.db.data[self.name].pop(target_idx)
            print(f"🗑️ [MOCK DB] Deleted 1 record from {self.name}: {removed_item.get('_id')}")
            self.items = self.db.data[self.name]
            self.db._save()
            return True
            
        return False

    def delete_many(self, query):
        """Mock delete_many: removes all items (for now supports clearing the whole collection)."""
        # For seed_db purposes, we usually pass {} to clear all
        if self.name in self.db.data:
            self.db.data[self.name] = []
            self.items = []
            self.db._save()
            return True
        return False


def close_connection():
    """Close the MongoDB connection (app shutdown)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def transform_doc(doc):
    """Transforms documents for API response, handling both real and mock formats."""
    if not doc or not isinstance(doc, dict):
        return {}
    new_doc = doc.copy()
    if '_id' in new_doc:
        new_doc['id'] = str(new_doc.pop('_id'))
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


# --- Phlebotomist Portal Specific Helpers ---

def get_phlebotomists_collection():
    return get_db()['phlebotomists']



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
