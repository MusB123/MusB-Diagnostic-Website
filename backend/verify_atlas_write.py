import os
import django
from pathlib import Path
import sys

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_db, is_mock_database
from bson import ObjectId

def verify_write():
    db = get_db()
    print(f"Using database: {db}")
    print(f"Is Mock Database? {is_mock_database()}")
    
    test_coll = db['connection_test']
    test_id = ObjectId()
    doc = {
        '_id': test_id,
        'message': 'Verification write from Antigravity',
        'timestamp': '2026-04-13T05:00:00'
    }
    
    print(f"Attempting to insert doc with ID: {test_id}")
    try:
        res = test_coll.insert_one(doc)
        print(f"Insert success! Inserted ID: {res.inserted_id}")
        
        # Verify read
        found = test_coll.find_one({'_id': test_id})
        if found:
            print(f"READ SUCCESS: Found the document in DB.")
        else:
            print("READ FAILURE: Could not find the document after insert.")
    except Exception as e:
        print(f"ERROR: Write failed: {e}")

if __name__ == "__main__":
    verify_write()
