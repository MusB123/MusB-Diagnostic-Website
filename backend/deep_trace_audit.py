import os
import django
import sys

# Set up Django environment
sys.path.append('c:/Users/baren/OneDrive/Desktop/MusB Diagnostic website/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from phlebotomy.views import dashboard_stats
from rest_framework.test import APIRequestFactory
import json

def trace_error():
    print("--- Tactical Backend Traceback ---")
    factory = APIRequestFactory()
    # Mocking an authenticated request
    request = factory.get('/api/phleb/dashboard/')
    request.headers = {'Authorization': 'Bearer <MANUAL_TOKEN_IF_NEEDED>'}
    
    # We bypass the view Decorator to see the raw traceback if it crashes
    try:
        # Note: We need a real user payload or we bypass the token check for trace
        # For trace, let's just simulate the logic inside the view
        from phlebotomy.auth import login_phleb
        login_info = login_phleb('phleb@musb.com', 'phleb123')
        token = login_info['token']
        
        from phlebotomy.auth import verify_token
        user_payload = verify_token(token)
        
        # Now run the logic inside dashboard_stats directly
        from musb_backend.mongodb import get_db, get_appointments_collection, transform_doc
        coll = get_appointments_collection()
        all_missions = [transform_doc(m) for m in coll.find()]
        today_route = [m for m in all_missions if m.get('id', '').startswith('APP-9')]
        next_stop = next((m for m in today_route if m.get('status') not in ['Completed', 'Issue']), today_route[0] if today_route else None)
        active_case = next_stop if next_stop else today_route[0] if today_route else {}
        
        stats = {
            'specialist': {
                'name': user_payload.get('name'),
                'company': user_payload.get('company'),
                'id': user_payload.get('user_id')
            },
            'metrics': {
                'completed_collections': len([m for m in today_route if m.get('status') == 'Completed']),
                'earnings_today': f"${len([m for m in today_route if m.get('status') == 'Completed']) * 45}.00",
                'on_time_rate': '98%'
            },
            'dispatch': {
                'next_stop': next_stop,
                'today_route': today_route
            },
            'active_case': active_case,
            'admin': {
                'roster': [transform_doc(staff) for staff in get_db()['phlebotomists'].find()],
                'performance_history': [
                    {'month': 'Mar', 'visits': len([m for m in all_missions if m.get('status') == 'Completed']), 'no_shows': 0, 'issues': len([m for m in all_missions if m.get('status') == 'Issue'])}
                ],
                'coverage': [transform_doc(zone) for zone in get_db()['coverage_zones'].find()]
            }
        }
        print("SUCCESS: Internal logic executed perfectly.")
        print(json.dumps(stats, indent=2))
        
    except Exception as e:
        import traceback
        print("FAILED: Traceback captured below:")
        traceback.print_exc()

if __name__ == "__main__":
    trace_error()
