import pyotp
import qrcode
import base64
from io import BytesIO
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class OTPService:
    """
    Centralized service for generating and sending OTPs via Email 
    and Managing App-based (TOTP) verification.
    """

    @staticmethod
    def send_email_otp(recipient_email, code):
        """
        Sends a verification code via Email using Django's configured backend.
        """
        subject = "MusB Diagnostic Verification Code"
        message = f"Your verification code is: {code}. It will expire in 5 minutes."
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                fail_silently=False,
            )
            logger.info(f"OTP Email sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"EMAIL ERROR during OTP send to {recipient_email}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    @staticmethod
    def generate_totp_secret():
        """Generates a new random base32 secret for TOTP."""
        return pyotp.random_base32()

    @staticmethod
    def get_totp_uri(secret, user_email):
        """Generates a provisioning URI for authenticator apps."""
        return pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name="MusB Diagnostic"
        )

    @staticmethod
    def get_totp_qr_base64(uri):
        """Generates a base64 encoded QR code image for the user to scan."""
        img = qrcode.make(uri)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    @staticmethod
    def verify_totp(secret, code):
        """Verifies a 6-digit TOTP code against the secret."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code)
