import requests
import json

url = "http://localhost:8000/api/phleb/apply/"
data = {
    "fullName": "Expert Verification Phleb",
    "email": "verification@musb.com",
    "phone": "9998887776",
    "address": "456 Verification Ave",
    "zipCodes": ["10001", "10002"]
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"ERROR: {str(e)}")
