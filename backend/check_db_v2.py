import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_lab_tests_collection, transform_doc, is_mock_database

def check_tests():
    print(f"Using Mock DB: {is_mock_database()}")
    coll = get_lab_tests_collection()
    print(f"Collection: {coll}")
    
    all_tests = list(coll.find({}))
    print(f"Total tests in collection: {len(all_tests)}")
    
    if len(all_tests) > 0:
        print("Sample test keys:", all_tests[0].keys())
        print("Sample test price type:", type(all_tests[0].get('price')))
    
    # Try the view's exact logic
    query = {'is_active': {'$ne': False}}
    # In my updated code, catalog/views.py uses float(max_price)
    query['price'] = {'$lte': 150.0}
    
    matched = list(coll.find(query))
    print(f"Matched with query: {len(matched)}")

if __name__ == "__main__":
    check_tests()
