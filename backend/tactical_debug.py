import os
import django
import sys
from pathlib import Path

# Setup Django Environment
base_path = 'c:/Users/baren/OneDrive/Desktop/MusB Diagnostic website/backend'
sys.path.append(base_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_db, transform_doc

def run_tactical_check():
    print("--- [TACTICAL DEBUG] ---")
    try:
        db = get_db()
        print("1. Success: Database instance retrieved.")
        
        # Check Appointments
        coll_name = 'appointments'
        print(f"2. Inspecting collection: {coll_name}")
        docs = list(db[coll_name].find())
        print(f"   - Documents Found: {len(docs)}")
        for d in docs[:2]:
            print(f"   - Sample Doc: {transform_doc(d)}")
            
        # Check phlebotomists
        coll_name = 'phlebotomists'
        print(f"3. Inspecting collection: {coll_name}")
        staff = list(db[coll_name].find())
        print(f"   - Staff Found: {len(staff)}")
        
        # Check coverage_zones
        coll_name = 'coverage_zones'
        print(f"4. Inspecting collection: {coll_name}")
        zones = list(db[coll_name].find())
        print(f"   - Zones Found: {len(zones)}")
        
        print("\n🏆 RESULT: All MongoDB collections are fully reachable.")
        
    except Exception as e:
        print("\n❌ CRITICAL CRASH:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_tactical_check()
