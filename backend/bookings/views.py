from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import datetime
from musb_backend.mongodb import get_appointments_collection, transform_doc
from musb_backend.geocoding import geocode_address

@api_view(['POST'])
def create_booking(request):
    """POST /api/bookings/ — Create a new appointment in MongoDB."""
    data = request.data
    full_name = data.get('fullName') or data.get('full_name')
    phone = data.get('phone')
    alt_phone = data.get('alt_phone') or data.get('alternativePhone')
    email = data.get('email')
    test_id = data.get('testId') or data.get('test_id')
    date = data.get('date') or data.get('preferred_date')
    time_slot = data.get('timeSlot') or data.get('preferred_time')
    visit_type = data.get('visitType') or data.get('visit_type')
    address = data.get('address')

    if not all([full_name, phone, alt_phone, address, test_id]):
        return Response(
            {'error': 'Missing required fields: Name, Phone, Alt Phone, Address, and Test must be provided.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Optional fields defaults
    if not date: date = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    if not time_slot: time_slot = "TBD"
    if not email: email = "field@collection.com"

    # Validate address for home visits
    if visit_type == 'home' and not address:
        return Response({'error': 'Address is required for mobile phlebotomy.'}, status=400)

    # Perform geocoding for home visits
    coordinates = None
    if visit_type == 'home' and address:
        coordinates_list = geocode_address(address)
        if coordinates_list:
            coordinates = {
                'type': 'Point',
                'coordinates': coordinates_list # [lng, lat]
            }

    coll = get_appointments_collection()
    new_booking = {
        'full_name': full_name,
        'phone': phone,
        'alt_phone': alt_phone,
        'email': email,
        'test_id': test_id,
        'preferred_date': date,
        'preferred_time': time_slot,
        'visit_type': visit_type,
        'address': address,
        'coordinates': coordinates,
        'status': 'pending_approval', 
        'created_at': datetime.datetime.utcnow()
    }
    
    result = coll.insert_one(new_booking)
    
    return Response(
        {
            'message': 'Booking request submitted! Waiting for Admin approval.',
            'booking': transform_doc(new_booking)
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def bookable_tests(request):
    """GET /api/bookings/tests/ — Available tests for booking dropdown (from MongoDB)."""
    coll = get_lab_tests_collection()
    tests = list(coll.find())
    
    # Map for the dropdown format
    formatted = [{'value': str(t.get('id', t['_id'])), 'label': t['title']} for t in tests]
    return Response(formatted)
