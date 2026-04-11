from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging
import traceback

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Expert-level exception handler that GUARANTEES a JSON response.
    Never returns an HTML error page to the frontend.
    """
    # Call DRF's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    # If response is None, it means the error was NOT handled by DRF (e.g. standard Python/Django error)
    if response is None:
        # Log the full traceback for production debugging
        logger.error(f"UNHANDLED SYSTEM ERROR: {str(exc)}")
        logger.error(traceback.format_exc())

        return Response({
            'error': 'Operational System Error',
            'message': str(exc),
            'code': 'INTERNAL_SERVER_ERROR',
            'hint': 'Check backend logs on Render'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Enhance standard DRF errors with a generic flag if needed
    if isinstance(response.data, dict):
        response.data['status'] = 'error'
    
    return response
