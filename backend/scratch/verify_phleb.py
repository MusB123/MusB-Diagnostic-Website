import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_phlebotomists_collection

coll = get_phlebotomists_collection()
test_phleb = coll.find_one({'email': 'testphleb@musb.com'})

if test_phleb:
    print(f"SUCCESS: Found phlebotomist '{test_phleb.get('name')}' in MongoDB.")
    print(f"Status: {test_phleb.get('status')}")
    print(f"ID: {test_phleb.get('id')}")
else:
    print("FAILURE: Phlebotomist not found.")
