import requests
import json

URL = "http://localhost:8000/api/superadmin/phleb-management/phlebotomists/PHL-006/status/"

try:
    response = requests.post(URL, json={"status": "active"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
