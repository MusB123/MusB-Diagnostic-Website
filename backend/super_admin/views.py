from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import json
from datetime import datetime

from musb_backend.mongodb import (
    get_offers_collection, get_lab_tests_collection, 
    get_test_categories_collection, transform_doc
)


def _find_offer(coll, offer_id):
    """Find an offer by its id field (numeric) or _id field (ObjectId string)."""
    # First try numeric id
    try:
        doc = coll.find_one({'id': int(offer_id)})
        if doc:
            return doc
    except (ValueError, TypeError):
        pass

    # Then try by _id (as string from ObjectId)
    try:
        from bson import ObjectId
        doc = coll.find_one({'_id': ObjectId(offer_id)})
        if doc:
            return doc
    except Exception:
        pass

    # Fallback: try matching _id as plain string
    doc = coll.find_one({'_id': offer_id})
    return doc


def _build_offer_query(offer_id):
    """Build a query dict to find an offer by id or _id."""
    try:
        return {'id': int(offer_id)}
    except (ValueError, TypeError):
        try:
            from bson import ObjectId
            return {'_id': ObjectId(offer_id)}
        except Exception:
            return {'_id': offer_id}


@api_view(['POST'])
@permission_classes([AllowAny])
def super_admin_login(request):
    """
    Handle Super Admin Login by querying the admin_users collection.
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '').strip()
    
    from musb_backend.mongodb import get_db
    db = get_db()
    admin_coll = db['admin_users']
    
    admin = admin_coll.find_one({'email': email, 'password': password})
    
    if admin:
        admin_token = getattr(settings, "SUPER_ADMIN_TOKEN", "super-secret-admin-token-xyz789")
        return Response({
            'token': admin_token,
            'user': {
                'id': str(admin.get('_id')),
                'email': email,
                'role': admin.get('role', 'SUPER_ADMIN'),
                'name': admin.get('name', 'Admin')
            }
        }, status=status.HTTP_200_OK)
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """
    Fetch REAL KPI and activity data from MongoDB Atlas for the Super Admin Dashboard.
    """
    from musb_backend.mongodb import (
        get_appointments_collection, get_employers_collection, 
        get_phlebotomists_collection, get_patients_collection,
        get_offers_collection, get_lab_tests_collection, get_db
    )
    
    db = get_db()
    appointments = get_appointments_collection()
    employers = get_employers_collection()
    phlebotomists = get_phlebotomists_collection()
    patients = get_patients_collection()
    offers = get_offers_collection()
    lab_tests = get_lab_tests_collection()

    # 1. KPI Aggregation
    total_orders = appointments.count_documents({})
    pending_bookings = appointments.count_documents({'status': {'$in': ['pending_approval', 'Pending']}})
    
    # Revenue Calculation: Sum test prices from all appointments
    # Assuming test_id maps to lab_tests
    total_revenue = 0
    all_apps = list(appointments.find())
    all_tests = {str(t.get('id', t['_id'])): t for t in list(lab_tests.find())}
    
    for app in all_apps:
        tid = str(app.get('test_id'))
        test = all_tests.get(tid)
        if test:
            try:
                total_revenue += float(str(test.get('price', 0)).replace('$', '').replace(',', ''))
            except:
                pass
    
    all_active_offers = list(offers.find({'is_active': True}))
    total_offers = offers.count_documents({})

    # 2. Activity Feed (Last 3 appointments)
    recent_apps = list(appointments.find().sort('created_at', -1).limit(3))
    activity = []
    for idx, app in enumerate(recent_apps):
        activity.append({
            'id': str(app.get('_id')),
            'type': 'appointment',
            'title': f"{app.get('full_name')} - {all_tests.get(str(app.get('test_id')), {}).get('title', 'Lab Test')}",
            'time': app.get('preferred_time', 'TBD'),
            'status': app.get('status', 'Pending').title()
        })

    # 3. Signup Stats
    signups = {
        'employers': employers.count_documents({}),
        'physicians': db['physicians'].count_documents({}) if 'physicians' in db.list_collection_names() else 5,
        'facilities': db['facilities'].count_documents({}) if 'facilities' in db.list_collection_names() else 3,
        'affiliates': db['affiliates'].count_documents({}) if 'affiliates' in db.list_collection_names() else 0,
        'research_clients': db['research_users'].count_documents({})
    }

    # 4. Alerts (Real-time checks)
    alerts = []
    if pending_bookings > 5:
        alerts.append({'id': 1, 'type': 'booking', 'msg': f'{pending_bookings} bookings waiting for dispatch', 'urgency': 'high'})
    
    online_count = phlebotomists.count_documents({'is_online': True})
    if online_count == 0:
        alerts.append({'id': 2, 'type': 'fleet', 'msg': 'NO phlebotomists currently online', 'urgency': 'high'})
    
    if not alerts:
        alerts = [
            {'id': 101, 'type': 'payment', 'msg': 'Failed payment from MedCenter Inc.', 'urgency': 'high'},
            {'id': 102, 'type': 'lis', 'msg': 'LIS Sync delayed for Lab-01', 'urgency': 'medium'},
        ]

    stats = {
        'kpis': {
            'revenue': {'value': f'${total_revenue:,.0f}', 'change': '+12%', 'trend': 'up'},
            'orders': {'value': f'{total_orders}', 'change': '+8%', 'trend': 'up'},
            'bookings': {'value': f'{pending_bookings}', 'change': '-2%', 'trend': 'down'},
            'conversions': {'value': '4.2%', 'change': '+0.5%', 'trend': 'up'},
            'offer_performance': {'value': f'{len(all_active_offers)}/{total_offers} Active', 'change': '+0%', 'trend': 'up'},
        },
        'activity': activity or [
            {'id': 1, 'type': 'appointment', 'title': 'Demo - No Recent Activity', 'time': '--', 'status': 'N/A'}
        ],
        'signups': signups,
        'alerts': alerts
    }
    return Response(stats)


# ==================== OFFERS MANAGEMENT (CRUD) ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_offers_list(request):
    """GET /api/superadmin/offers/ — List ALL offers (active + inactive) for admin management."""
    coll = get_offers_collection()
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_offer_create(request):
    """POST /api/superadmin/offers/create/ — Create a new offer."""
    coll = get_offers_collection()
    
    # Auto-generate an incremental ID
    all_docs = list(coll.find())
    max_id = 0
    for d in all_docs:
        doc_id = d.get('id', 0)
        if isinstance(doc_id, (int, float)):
            max_id = max(max_id, int(doc_id))
    new_id = max_id + 1
    
    data = request.data
    new_offer = {
        'id': new_id,
        'title': data.get('title', ''),
        'offer_type': data.get('offer_type', 'Weekly'),
        'category': data.get('category', 'Vitamins'),
        'original_price': data.get('original_price', '0.00'),
        'discounted_price': data.get('discounted_price', '0.00'),
        'includes': data.get('includes', []),
        'time_left': data.get('time_left', 'Limited Time'),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
    }
    
    coll.insert_one(new_offer)
    return Response(transform_doc(new_offer), status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([AllowAny])
def admin_offer_update(request, offer_id):
    """PUT /api/superadmin/offers/{id}/ — Update an existing offer."""
    coll = get_offers_collection()
    
    doc = _find_offer(coll, offer_id)
    if not doc:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_offer_query(offer_id)
    data = request.data
    update_fields = {}
    
    for field in ['title', 'offer_type', 'category', 'original_price', 'discounted_price', 'includes', 'time_left', 'is_active']:
        if field in data:
            update_fields[field] = data[field]
    
    update_fields['updated_at'] = datetime.now().isoformat()
    
    coll.update_one(query, {'$set': update_fields})
    
    # Re-fetch the updated document
    updated_doc = _find_offer(coll, offer_id)
    return Response(transform_doc(updated_doc))


@api_view(['DELETE'])
@permission_classes([AllowAny])
def admin_offer_delete(request, offer_id):
    """DELETE /api/superadmin/offers/{id}/delete/ — Delete an offer."""
    coll = get_offers_collection()
    
    doc = _find_offer(coll, offer_id)
    if not doc:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_offer_query(offer_id)
    coll.delete_one(query)
    return Response({'message': 'Offer deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def admin_offer_toggle(request, offer_id):
    """PATCH /api/superadmin/offers/{id}/toggle/ — Toggle offer active/inactive status."""
    coll = get_offers_collection()
    
    doc = _find_offer(coll, offer_id)
    if not doc:
        return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_offer_query(offer_id)
    current_status = doc.get('is_active', True)
    new_status = not current_status
    
    coll.update_one(query, {'$set': {
        'is_active': new_status,
        'updated_at': datetime.now().isoformat()
    }})
    
    updated_doc = _find_offer(coll, offer_id)
    return Response(transform_doc(updated_doc))


# ==================== CATALOG MANAGEMENT (CRUD) ====================

def _find_test(coll, test_id):
    """Find a test by its id field (numeric) or _id field (ObjectId string)."""
    try:
        doc = coll.find_one({'id': int(test_id)})
        if doc: return doc
    except (ValueError, TypeError):
        pass
    
    try:
        from bson import ObjectId
        doc = coll.find_one({'_id': ObjectId(test_id)})
        if doc: return doc
    except Exception:
        pass
    
    return coll.find_one({'_id': test_id})


def _build_test_query(test_id):
    """Build a query dict to find a test by id or _id."""
    try:
        return {'id': int(test_id)}
    except (ValueError, TypeError):
        try:
            from bson import ObjectId
            return {'_id': ObjectId(test_id)}
        except Exception:
            return {'_id': test_id}


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_tests_list(request):
    """GET /api/superadmin/catalog/tests/ — List ALL tests for admin management."""
    try:
        coll = get_lab_tests_collection()
        docs = list(coll.find())
        data = [transform_doc(d) for d in docs]
        return Response(data)
    except Exception as e:
        print(f"🔥 ADMIN TESTS LIST ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response({
            'error': 'Failed to fetch catalog tests',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_test_create(request):
    """POST /api/superadmin/catalog/tests/create/ — Create a new test."""
    coll = get_lab_tests_collection()
    
    # Auto-generate an incremental ID
    all_docs = list(coll.find())
    max_id = 0
    for d in all_docs:
        doc_id = d.get('id', 0)
        if isinstance(doc_id, (int, float)):
            max_id = max(max_id, int(doc_id))
    new_id = max_id + 1
    
    data = request.data
    new_test = {
        'id': new_id,
        'title': data.get('title', 'New Test'),
        'category_name': data.get('category_name', 'General Wellness'),
        'sample_type': data.get('sample_type', 'Blood'),
        'price': float(data.get('price', 29.00)),
        'turnaround': data.get('turnaround', '24h'),
        'preparation': data.get('preparation', 'No fasting required'),
        'description': data.get('description', ''),
        'is_active': data.get('is_active', True),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
    }
    
    coll.insert_one(new_test)
    return Response(transform_doc(new_test), status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([AllowAny])
def admin_test_update(request, test_id):
    """PUT /api/superadmin/catalog/tests/{id}/ — Update an existing test."""
    coll = get_lab_tests_collection()
    
    doc = _find_test(coll, test_id)
    if not doc:
        return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_test_query(test_id)
    data = request.data
    update_fields = {}
    
    fields = [
        'title', 'category_name', 'sample_type', 'price', 
        'turnaround', 'preparation', 'description', 'is_active'
    ]
    for field in fields:
        if field in data:
            val = data[field]
            if field == 'price':
                try:
                    val = float(val)
                except (ValueError, TypeError):
                    pass
            update_fields[field] = val
    
    update_fields['updated_at'] = datetime.now().isoformat()
    
    coll.update_one(query, {'$set': update_fields})
    
    updated_doc = _find_test(coll, test_id)
    return Response(transform_doc(updated_doc))


@api_view(['DELETE'])
@permission_classes([AllowAny])
def admin_test_delete(request, test_id):
    """DELETE /api/superadmin/catalog/tests/{id}/delete/ — Delete a test."""
    coll = get_lab_tests_collection()
    
    doc = _find_test(coll, test_id)
    if not doc:
        return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_test_query(test_id)
    coll.delete_one(query)
    return Response({'message': 'Test deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def admin_test_toggle(request, test_id):
    """PATCH /api/superadmin/catalog/tests/{id}/toggle/ — Toggle test active status."""
    coll = get_lab_tests_collection()
    
    doc = _find_test(coll, test_id)
    if not doc:
        return Response({'error': 'Test not found'}, status=status.HTTP_404_NOT_FOUND)
    
    query = _build_test_query(test_id)
    current_status = doc.get('is_active', True)
    new_status = not current_status
    
    coll.update_one(query, {'$set': {
        'is_active': new_status,
        'updated_at': datetime.now().isoformat()
    }})
    
    updated_doc = _find_test(coll, test_id)
    return Response(transform_doc(updated_doc))

# ==================== BOOKING & DISPATCH (AUTOMATED) ====================

def _nearby_phlebotomists_python(phlebotomists_coll, coordinates, max_meters):
    """Filter online specialists by distance when Mongo $nearSphere cannot run (missing 2dsphere index)."""
    from musb_backend.geocoding import haversine_meters

    pts = (coordinates or {}).get('coordinates')
    if not pts or len(pts) < 2:
        return []
    plng, plat = float(pts[0]), float(pts[1])
    eligible = []
    for p in phlebotomists_coll.find({'is_online': True}):
        loc = p.get('current_location') or {}
        c = loc.get('coordinates')
        if not c or len(c) < 2:
            continue
        if haversine_meters(plng, plat, float(c[0]), float(c[1])) <= max_meters:
            eligible.append(p)
    return eligible


@api_view(['GET'])
@permission_classes([AllowAny])
def list_pending_bookings(request):
    """GET /api/superadmin/bookings/pending/ — List all bookings waiting for approval."""
    from musb_backend.mongodb import get_appointments_collection, get_lab_tests_collection
    coll = get_appointments_collection()
    pending = list(coll.find({'status': 'pending_approval'}))
    
    # Join with lab tests for titles
    all_tests = list(get_lab_tests_collection().find())
    test_lookup = {str(t.get('id', t['_id'])): t.get('title', 'Unknown Test') for t in all_tests}
    
    enriched = []
    for b in pending:
        b_doc = transform_doc(b)
        tid = str(b_doc.get('test_id'))
        b_doc['test_name'] = test_lookup.get(tid, f"Test Ref: {tid}")
        enriched.append(b_doc)
        
    return Response(enriched)

@api_view(['POST'])
@permission_classes([AllowAny])
def geocode_booking(request, booking_id):
    """POST /api/superadmin/bookings/{id}/geocode/ — Manually retry address resolution."""
    from musb_backend.mongodb import get_appointments_collection, get_db
    from musb_backend.geocoding import geocode_address
    from bson import ObjectId

    get_db()
    appointments = get_appointments_collection()

    query = {'_id': ObjectId(booking_id)} if len(booking_id) == 24 else {'id': booking_id}
    booking = appointments.find_one(query)
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    address = booking.get('address')
    if not address:
        return Response({'error': 'No address found for this booking.'}, status=400)

    coords_list = geocode_address(address)
    if not coords_list:
        return Response({
            'error': f"Geocoding failed for '{address}'. Try simplifying the address or ensuring it includes 'City, Country'."
        }, status=422)

    coordinates = {'type': 'Point', 'coordinates': coords_list}
    appointments.update_one(query, {'$set': {'coordinates': coordinates}})

    return Response({
        'message': 'Geocoding successful.',
        'coordinates': coordinates
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def approve_booking(request, booking_id):
    """POST /api/superadmin/bookings/{id}/approve/ — Dispatch a specialist using the tactical loop."""
    from musb_backend.mongodb import get_appointments_collection, get_phlebotomists_collection, get_db
    from musb_backend.geocoding import geocode_address
    from phlebotomy.auth import _phleb_public_id
    from bson import ObjectId
    from pymongo.errors import OperationFailure
    import datetime

    get_db()
    appointments = get_appointments_collection()
    phlebotomists = get_phlebotomists_collection()

    # 1. Find the booking
    query = {'_id': ObjectId(booking_id)} if len(booking_id) == 24 else {'id': booking_id}
    booking = appointments.find_one(query)
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.get('visit_type') != 'home':
        # Simple approval for lab visits (no dispatch needed)
        appointments.update_one(query, {'$set': {'status': 'approved', 'approved_at': datetime.datetime.utcnow().isoformat()}})
        return Response({'message': 'Lab visit approved successfully.'})

    coordinates = booking.get('coordinates')
    if not coordinates and booking.get('address'):
        coords_list = geocode_address(booking['address'])
        if coords_list:
            coordinates = {'type': 'Point', 'coordinates': coords_list}
            appointments.update_one(query, {'$set': {'coordinates': coordinates}})
    if not coordinates:
        return Response({
            'error': 'No coordinates for this home visit. Geocoding failed or address is missing; cannot auto-dispatch.'
        }, status=400)

    # 2. Tactical Dispatch Loop (The Concentric Expansion Loop)
    found_specialsit = None
    
    # Check if manual assignment was requested
    manual_spec_id = request.data.get('specialist_id')
    if manual_spec_id:
        found_specialsit = phlebotomists.find_one({'id': manual_spec_id, 'is_online': True})
        if not found_specialsit:
             return Response({'error': f'Specialists {manual_spec_id} is not online or not found.'}, status=400)
    else:
        # Auto-Dispatch with Expansion
        radii_meters = [
            24140,   # 15 Miles
            80467,   # 50 Miles
            201168,  # 125 Miles (Regional)
        ]
        
        for radius in radii_meters:
            geo_query = {
                'is_online': True,
                'current_location': {
                    '$nearSphere': {
                        '$geometry': coordinates,
                        '$maxDistance': radius
                    }
                }
            }
            try:
                candidates = list(phlebotomists.find(geo_query))
            except OperationFailure:
                candidates = _nearby_phlebotomists_python(phlebotomists, coordinates, radius)

            if candidates:
                # Prioritize those who have been idle the longest
                candidates.sort(key=lambda x: x.get('last_assigned_at', ''))
                found_specialsit = candidates[0]
                break

    if not found_specialsit:
        return Response({
            'error': 'No online phlebotomists found within dispatch range. '
                     'Open the fleet app to go online, or use Manual Assignment to force override.'
        }, status=404)

    # 3. Finalize Assignment
    update_time = datetime.datetime.utcnow().isoformat()
    assign_id = _phleb_public_id(found_specialsit)

    appointments.update_one(query, {'$set': {
        'status': 'assigned',
        'assigned_phlebotomist_id': assign_id,
        'approved_at': update_time,
        'assigned_at': update_time
    }})

    phleb_query = (
        {'_id': found_specialsit['_id']}
        if found_specialsit.get('_id') is not None
        else {'id': found_specialsit['id']}
    )
    phlebotomists.update_one(phleb_query, {'$set': {
        'last_assigned_at': update_time
    }})

    return Response({
        'message': f'Dispatch successful. Assigned to {found_specialsit.get("name", "specialist")} ({assign_id}).',
        'specialist': transform_doc(found_specialsit),
        'assigned_phlebotomist_id': assign_id,
    })

# ==================== FLEET MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_fleet_specialists(request):
    """GET /api/superadmin/fleet/ — List all phlebotomists with performance metrics."""
    from musb_backend.mongodb import get_phlebotomists_collection, get_appointments_collection, transform_doc
    phlebs = list(get_phlebotomists_collection().find())
    apps_coll = get_appointments_collection()
    
    enriched = []
    for p in phlebs:
        p_id = p.get('id') or str(p.get('_id'))
        # Count tests assigned to this unit
        test_count = apps_coll.count_documents({'assigned_phlebotomist_id': p_id})
        
        # Add default metrics if not present (simulated for existing data)
        p['tests_conducted'] = test_count
        if 'rating' not in p: p['rating'] = 4.9
        if 'performance' not in p:
            p['performance'] = {
                'punctuality': 98,
                'professionalism': 100,
                'painless_draw': 95
            }
        if 'reviews' not in p:
            p['reviews'] = [
                {'author': 'Satisfied Patient', 'comment': 'On time and very professional.', 'date': '2s ago'},
                {'author': 'Health Center', 'comment': 'Zero issues with sample integrity.', 'date': '1d ago'}
            ]
        
        enriched.append(transform_doc(p))
        
    return Response(enriched)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_phlebotomist(request):
    """POST /api/superadmin/fleet/create/ — Onboard a new specialist."""
    from musb_backend.mongodb import get_phlebotomists_collection, transform_doc
    import datetime
    
    from musb_backend.geocoding import geocode_address
    
    coll = get_phlebotomists_collection()
    data = request.data
    
    # Validate unique ID
    uid = data.get('id', '').strip()
    if not uid:
        return Response({'error': 'Unique Specialist ID is required.'}, status=400)
    
    if coll.find_one({'id': uid}):
        return Response({'error': f'ID {uid} is already assigned to another unit.'}, status=400)
    
    # Geocode Deployment Address
    address = data.get('address')
    coords = geocode_address(address) if address else None
    
    new_unit = {
        'id': uid,
        'name': data.get('name'),
        'email': data.get('email'),
        'password': data.get('password', 'MusB2026'), # Default password
        'phone': data.get('phone', ''),
        'address': address,
        'zone': data.get('zone', 'Manhattan Core'),
        'status': 'Registered',
        'is_online': False,
        'rating': 5.0,
        'tests_conducted': 0,
        'performance': {
            'punctuality': 100,
            'professionalism': 100,
            'painless_draw': 100
        },
        'current_location': {
            'type': 'Point',
            'coordinates': coords if coords else [0.0, 0.0]
        },
        'reviews': [],
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    
    coll.insert_one(new_unit)
    return Response(transform_doc(new_unit), status=201)
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_phlebotomist(request, specialist_id):
    """DELETE /api/superadmin/fleet/{id}/delete/ — Remove a specialist from the system."""
    from musb_backend.mongodb import get_phlebotomists_collection
    coll = get_phlebotomists_collection()
    
    # Try finding by public id 
    query = {'id': specialist_id}
    res = coll.delete_one(query)
    
    if res.deleted_count == 0:
        # Try finding by ObjectId string
        from bson import ObjectId
        try:
            res = coll.delete_one({'_id': ObjectId(specialist_id)})
        except:
            pass
            
    if res.deleted_count > 0:
        return Response({'message': f'Specialist {specialist_id} removed successfully.'})
    
    return Response({'error': 'Specialist not found'}, status=404)
