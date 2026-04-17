import requests
import pyotp

BASE_URL = "http://localhost:8000/api/patients"

def test_email_otp():
    print("--- Testing Email OTP ---")
    res = requests.post(f"{BASE_URL}/request-otp/", json={"email": "test@example.com"})
    print(res.json())
    # Should print message in console since no password in .env

def test_totp_setup():
    print("\n--- Testing TOTP Setup ---")
    res = requests.post(f"{BASE_URL}/setup-totp/", json={"email": "test@example.com"})
    data = res.json()
    print(f"Secret: {data['secret']}")
    print(f"QR Code: {data['qr_code'][:50]}...")
    return data['secret']

def test_totp_verify(secret):
    print("\n--- Testing TOTP Verify ---")
    totp = pyotp.TOTP(secret)
    code = totp.now()
    res = requests.post(f"{BASE_URL}/verify-otp/", json={
        "email": "test@example.com",
        "token": code,
        "method": "totp",
        "secret": secret
    })
    print(res.json())

if __name__ == "__main__":
    test_email_otp()
    secret = test_totp_setup()
    test_totp_verify(secret)
