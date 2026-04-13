import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_lab_tests_collection, transform_doc

def check_tests():
    coll = get_lab_tests_collection()
    print(f"Using collection: {coll}")
    
    all_tests = list(coll.find())
    print(f"Total tests in DB: {len(all_tests)}")
    
    if len(all_tests) > 0:
        print("First test sample:")
        print(transform_doc(all_tests[0]))
    
    # Try the specific query that the view uses
    query = {'is_active': {'$ne': False}}
    query['price'] = {'$lte': '150'}
    
    matched = list(coll.find(query))
    print(f"Tests matching 'is_active != False' AND 'price <= 150': {len(matched)}")
    
    if len(matched) == 0 and len(all_tests) > 0:
        print("ALERT: Query returned 0 results but DB is not empty!")
        # Check why
        t = all_tests[0]
        price = t.get('price')
        print(f"Sample price from DB: {price} (type: {type(price)})")
        print(f"Comparison: '{price}' <= '150' is {price <= '150'}")

if __name__ == "__main__":
    check_tests()
