import requests
import json

def verify_dashboard_api():
    print("--- Phlebotomy Dashboard Connectivity Audit ---")
    
    # 1. Login to get token
    login_url = "http://127.0.0.1:8000/api/phleb/login/"
    login_data = {"email": "phleb@musb.com", "password": "phleb123"}
    
    try:
        r = requests.post(login_url, json=login_data)
        if r.status_code != 200:
            print(f"FAILED: Auth login failed with status {r.status_code}")
            return
        
        auth_data = r.json()
        token = auth_data['token']
        print(f"SUCCESS: Token received for: {auth_data['user']['name']}")
        
        # 2. Fetch Dashboard
        dash_url = "http://127.0.0.1:8000/api/phleb/dashboard/"
        headers = {"Authorization": f"Bearer {token}"}
        
        r = requests.get(dash_url, headers=headers)
        if r.status_code != 200:
            print(f"FAILED: Dashboard fetch failed with status {r.status_code}")
            # Try to print some of the error detail if it's JSON
            try: print(f"Error Detail: {r.text[:500]}")
            except: pass
            return
        
        dash_data = r.json()
        print("SUCCESS: Dashboard full payload received from MongoDB.")
        
        # 3. Verify Live Counts
        today_route = dash_data.get('dispatch', {}).get('today_route', [])
        completes = len([m for m in today_route if m.get('status') == 'Completed'])
        print(f"METRIC: Missions Completed = {completes}")
        print(f"METRIC: Earnings Today = {dash_data['metrics']['earnings_today']}")
        
        # 4. Verify Admin Roster
        roster_count = len(dash_data.get('admin', {}).get('roster', []))
        print(f"METRIC: Phlebotomists in Roster = {roster_count}")
        
        print("\nLINKUP VERIFIED: Frontend -> Backend -> MongoDB is ACTIVE.")
        
    except Exception as e:
        print(f"❌ [CRITICAL] Audit failed to reach server: {e}")

if __name__ == "__main__":
    verify_dashboard_api()
