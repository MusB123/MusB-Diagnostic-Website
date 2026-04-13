import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_lab_tests_collection, transform_doc

def migrate():
    coll = get_lab_tests_collection()
    print(f"Targeting collection: {coll}")
    
    all_tests = list(coll.find())
    print(f"Found {len(all_tests)} tests.")
    
    for test in all_tests:
        test_id = test.get('id', test.get('_id'))
        updates = {}
        
        # 1. Ensure is_active is True
        if test.get('is_active') is not True:
            updates['is_active'] = True
            print(f"  [ID {test_id}] Activating test...")
            
        # 2. Convert price to numeric
        price = test.get('price')
        if isinstance(price, str):
            try:
                num_price = float(price)
                updates['price'] = num_price
                print(f"  [ID {test_id}] Converting price '{price}' -> {num_price}")
            except (ValueError, TypeError):
                print(f"  [ID {test_id}] WARNING: Could not convert price '{price}'")
        
        if updates:
            from bson import ObjectId
            q = {'_id': test['_id']}
            coll.update_one(q, {'$set': updates})
            print(f"  [ID {test_id}] SUCCESS: Updated.")

    print("\nMigration complete. Re-checking results...")
    # Verify
    query = {'is_active': {'$ne': False}, 'price': {'$lte': 150.0}}
    matched = list(coll.find(query))
    print(f"Tests matching query in production now: {len(matched)}")

if __name__ == "__main__":
    migrate()
