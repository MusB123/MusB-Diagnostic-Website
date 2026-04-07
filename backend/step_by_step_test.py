import os
import django
import sys

# Set up Django
sys.path.append('c:/Users/baren/OneDrive/Desktop/MusB Diagnostic website/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_db, transform_doc

def test_logic():
    print("--- Step-by-Step Logic Test ---")
    try:
        db = get_db()
        print("1. DB Connection: OK")
        
        coll = db['appointments']
        all_missions = [transform_doc(m) for m in coll.find()]
        print(f"2. Mission Fetch: OK (Count: {len(all_missions)})")
        
        roster = [transform_doc(staff) for staff in db['phlebotomists'].find()]
        print(f"3. Roster Fetch: OK (Count: {len(roster)})")
        
        coverage = [transform_doc(zone) for zone in db['coverage_zones'].find()]
        print(f"4. Coverage Fetch: OK (Count: {len(coverage)})")
        
        print("SUCCESS: All tactical data fetches are functional.")
    except Exception as e:
        import traceback
        print(f"FAILED: Logic crashed at step.")
        traceback.print_exc()

if __name__ == "__main__":
    test_logic()
