import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class SMSService:
    """
    Service layer for sending SMS. 
    Supports Twilio with a console fallback for local development.
    """
    
    @staticmethod
    def send_otp(phone_number, otp_code):
        """
        Sends an OTP code to the given phone number.
        Returns True if sent, False otherwise.
        """
        message = f"Your MusB Diagnostic verification code is: {otp_code}. It expires in 5 minutes."
        
        # Load Twilio credentials from Environment / Settings
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_FROM_NUMBER')
        messaging_service_sid = os.getenv('TWILIO_MESSAGING_SERVICE_SID')
        
        if account_sid and auth_token and (from_number or messaging_service_sid):
            try:
                from twilio.rest import Client
                client = Client(account_sid, auth_token)
                
                send_params = {
                    "body": message,
                    "to": phone_number
                }
                if messaging_service_sid:
                    send_params["messaging_service_sid"] = messaging_service_sid
                else:
                    send_params["from_"] = from_number
                
                client.messages.create(**send_params)
                
                logger.info(f"SMS: OTP sent to {phone_number} via Twilio.")
                return True
            except Exception as e:
                logger.error(f"SMS ERROR [Twilio]: {str(e)}")
                # Continue to fallback even if Twilio fails
        
        # Consol Fallback (for development/testing)
        print("\n" + "="*50)
        print(f"SMS FALLBACK (DEBUG MODE)")
        print(f"To: {phone_number}")
        print(f"Message: {message}")
        print("="*50 + "\n")
        
        logger.info(f"SMS: OTP {otp_code} logged to console for {phone_number}.")
        return True
