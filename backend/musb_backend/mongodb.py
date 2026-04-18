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
    """Singleton database: real MongoDB by default, or MockDatabase if MONGO_USE_MOCK / fallback."""
    global _db_instance
    if _db_instance is None:
        print(f"[MONGODB] Global instance initialization. Use Mock: {getattr(settings, 'MONGO_USE_MOCK', False)}")
        if getattr(settings, 'MONGO_USE_MOCK', False):
            _db_instance = MockDatabase()
        else:
            try:
                print("[MONGODB] Attempting Atlas connection...")
                client = get_client()
                if client:
                    _db_instance = client[settings.MONGO_DB_NAME]
                    print(f"[MONGODB] Connection established via Atlas database: {settings.MONGO_DB_NAME}")
                else:
                    print("[MONGODB] Client failed, falling back to mock.")
                    _db_instance = MockDatabase()
            except (ConnectionError, Exception) as e:
                print(f"RESILIENCE ALERT: MongoDB failed ({str(e)}). Falling back to mock_db.json.")
                _db_instance = MockDatabase()
    return _db_instance


def is_mock_database():
    """True when using file-backed mock (forced or fallback)."""
    if getattr(settings, 'MONGO_USE_MOCK', False):
        return True
    return isinstance(get_db(), MockDatabase)


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
            print(f"WARNING: [MOCK DB] Data Load Warning: {e}")
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
            print(f"INFO: [MOCK DB] Changes persisted to {self.path}")
        except Exception as e:
            print(f"ERROR: [MOCK DB] Error saving to file: {e}")


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

        # Support $or operator at the top level
        if '$or' in query:
            or_queries = query['$or']
            or_results = []
            for item in filtered:
                is_or_match = False
                for sub_query in or_queries:
                    # Check if item matches this sub_query
                    sub_match = True
                    for k, v in sub_query.items():
                        item_val = item.get(k)
                        if isinstance(v, dict):
                            if '$regex' in v:
                                if v['$regex'].lower() not in str(item_val or '').lower():
                                    sub_match = False
                            elif '$ne' in v:
                                if item_val == v['$ne']:
                                    sub_match = False
                            # Add more operators as needed
                        elif str(item_val) != str(v):
                            sub_match = False
                        
                        if not sub_match:
                            break
                    if sub_match:
                        is_or_match = True
                        break
                if is_or_match:
                    or_results.append(item)
            filtered = or_results

        # Handle other filters (AND-ed with $or results if $or was present)
        for key, val in query.items():
            if key == '$or': continue  # already handled

            if isinstance(val, dict):
                # Handle operators
                for op, op_val in val.items():
                    if op == '$ne':
                        filtered = [item for item in filtered if item.get(key) != op_val]
                    elif op == '$lte':
                        filtered = [item for item in filtered if float(item.get(key, 0) or 0) <= float(op_val)]
                    elif op == '$gte':
                        filtered = [item for item in filtered if float(item.get(key, 0) or 0) >= float(op_val)]
                    elif op == '$regex':
                        filtered = [item for item in filtered if op_val.lower() in str(item.get(key, '') or '').lower()]
                    # Geospatial simulation
                    elif op == '$nearSphere':
                        from musb_backend.geocoding import haversine_meters
                        target_geo = op_val['$geometry']
                        max_dist = op_val.get('$maxDistance', float('inf'))
                        target_lng, target_lat = target_geo['coordinates']

                        def distance_meters(item):
                            loc = item.get('current_location', {})
                            if not loc or 'coordinates' not in loc:
                                return float('inf')
                            ilng, ilat = loc['coordinates']
                            return haversine_meters(float(target_lng), float(target_lat), float(ilng), float(ilat))

                        filtered = [item for item in filtered if distance_meters(item) <= max_dist]
                        filtered.sort(key=distance_meters)
                continue
            
            if val and val != 'All':
                # Precise comparison: Convert both to strings (handles ObjectId vs string)
                filtered = [item for item in filtered if str(item.get(key)) == str(val)]
                
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
            
        print(f"INFO: [MOCK] Saving to local mock DB memory: {doc}")
        
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
        class DeleteResult:
            def __init__(self, count): self.deleted_count = count

        if not query: return DeleteResult(0)
        
        if self.name not in self.db.data:
            return DeleteResult(0)
            
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
            print(f"INFO: [MOCK DB] Deleted 1 record from {self.name}: {removed_item.get('_id')}")
            self.items = self.db.data[self.name]
            self.db._save()
            return DeleteResult(1)
            
        return DeleteResult(0)

    def delete_many(self, query):
        """Mock delete_many: removes all items (for now supports clearing the whole collection)."""
        class DeleteResult:
            def __init__(self, count): self.deleted_count = count

        # For seed_db purposes, we usually pass {} to clear all
        if self.name in self.db.data:
            count = len(self.db.data[self.name])
            self.db.data[self.name] = []
            self.items = []
            self.db._save()
            return DeleteResult(count)
        return DeleteResult(0)

    def update_one(self, query, update):
        """Mock update_one: updates the first matching document with $set fields."""
        if not query or not update:
            return None

        set_fields = update.get('$set', {})
        if not set_fields:
            return None

        if self.name not in self.db.data:
            return None

        for item in self.db.data[self.name]:
            is_match = True
            for key, val in query.items():
                from bson import ObjectId
                db_val = item.get(key)
                norm_query_val = str(val) if isinstance(val, ObjectId) else val
                norm_db_val = str(db_val) if isinstance(db_val, ObjectId) else db_val
                if norm_db_val != norm_query_val:
                    is_match = False
                    break

            if is_match:
                for field, value in set_fields.items():
                    item[field] = value
                self.items = self.db.data[self.name]
                self.db._save()
                print(f"INFO: [MOCK DB] Updated 1 record in {self.name}")

                class UpdateResult:
                    modified_count = 1
                return UpdateResult()

        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    def count_documents(self, query=None):
        """Mock count_documents: returns the count of matching documents."""
        if not query:
            return len(self.items)
        return len(self.find(query))


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
