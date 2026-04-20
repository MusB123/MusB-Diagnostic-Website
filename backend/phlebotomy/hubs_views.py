from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import jwt
import datetime
from django.conf import settings
from .auth import verify_token
from musb_backend.mongodb import (
    get_phlebotomy_hubs_collection, 
    get_phlebotomists_collection, 
    get_appointments_collection, 
    transform_doc,
    get_db
)
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

def generate_hub_token(hub_payload):
    """Generate a JWT for the Hub Admin."""
    payload = {
        'hub_id': hub_payload['id'],
        'email': hub_payload['email'],
        'name': hub_payload['name'],
        'role': 'hub_admin',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

@api_view(['POST'])
def register_hub(request):
    """POST /api/phleb/hubs/register/"""
    coll = get_phlebotomy_hubs_collection()
    data = request.data
    
    email = data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=400)
    
    if coll.find_one({'email': email}):
        return Response({'error': 'Company email already registered.'}, status=400)
    
    hub_data = {
        'name': data.get('name') or data.get('companyName'),
        'email': email,
        'password': data.get('password'), 
        'address': data.get('address'),
        'status': 'active', 
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    
    result = coll.insert_one(hub_data)
    hub_data['id'] = str(result.inserted_id)
    
    token = generate_hub_token({'id': hub_data['id'], 'email': hub_data['email'], 'name': hub_data['name']})
    
    return Response({
        'token': token,
        'user': {
            'id': hub_data['id'],
            'email': hub_data['email'],
            'name': hub_data['name'],
            'role': 'hub_admin'
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login_hub(request):
    """POST /api/phleb/hubs/login/"""
    coll = get_phlebotomy_hubs_collection()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password')
    
    hub = coll.find_one({'email': email, 'password': password})
    if hub:
        hub_info = {'id': str(hub['_id']), 'email': hub['email'], 'name': hub['name']}
        token = generate_hub_token(hub_info)
        return Response({'token': token, 'user': {**hub_info, 'role': 'hub_admin'}})
        
    return Response({'error': 'Invalid hub credentials'}, status=401)

@api_view(['GET'])
def get_fleet(request):
    """GET /api/phleb/hubs/fleet/ — List phlebotomists belonging to this hub."""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload: return Response(status=401)
        
    hub_id = payload.get('hub_id')
    coll = get_phlebotomists_collection()
    
    query = {'hub_id': hub_id}
    fleet = list(coll.find(query)) 
    return Response(transform_doc(fleet))

@api_view(['POST'])
def register_specialist(request):
    """POST /api/phleb/hubs/register-specialist/"""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload: return Response(status=401)
    
    hub_id = payload.get('hub_id')
    data = request.data
    
    coll = get_phlebotomists_collection()
    if coll.find_one({'email': data.get('email')}):
        return Response({'error': 'Specialist already registered'}, status=400)
    
    new_spec = {
        'name': data.get('name'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'location': data.get('location', 'Eastern Sector'),
        'hub_id': hub_id,
        'status': 'active',
        'is_online': False,
        'created_at': datetime.datetime.utcnow().isoformat()
    }
    
    coll.insert_one(new_spec)
    return Response({'message': 'Specialist registered to hub fleet'})

@api_view(['POST'])
def assign_order(request):
    """POST /api/phleb/hubs/assign/"""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    data = request.data
    order_id = data.get('order_id')
    phleb_id = data.get('phleb_id')
    
    appointments = get_appointments_collection()
    query = {'id': order_id}
    if len(str(order_id)) == 24: query = {'_id': ObjectId(order_id)}
    
    appointments.update_one(query, {'$set': {
        'assigned_phlebotomist_id': phleb_id,
        'status': 'Assigned',
        'assigned_at': datetime.datetime.utcnow().isoformat()
    }})
    
    return Response({'message': 'Order assigned successfully'})

@api_view(['POST'])
def auto_allocate_all(request):
    """POST /api/phleb/hubs/auto-allocate/"""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    hub_id = payload.get('hub_id')
    
    appointments_coll = get_appointments_collection()
    phlebs_coll = get_phlebotomists_collection()
    
    pending = list(appointments_coll.find({'status': 'Pending'}))
    if not pending: return Response({'message': 'No pending orders found'})
    
    query = {'hub_id': hub_id, 'is_online': True}
    available_phlebs = list(phlebs_coll.find(query))
    
    if not available_phlebs:
        return Response({'error': 'No online specialists available'}, status=400)
    
    assigned_count = 0
    for idx, order in enumerate(pending):
        phleb = available_phlebs[idx % len(available_phlebs)]
        appointments_coll.update_one({'_id': order['_id']}, {'$set': {
            'assigned_phlebotomist_id': phleb.get('id', str(phleb['_id'])),
            'status': 'Assigned',
            'assigned_at': datetime.datetime.utcnow().isoformat()
        }})
        assigned_count += 1
        
    return Response({'message': f'Auto-dispatched {assigned_count} orders'})

@api_view(['GET'])
def hub_dashboard_stats(request):
    """GET /api/phleb/hubs/dashboard/"""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload: return Response(status=401)
    hub_id = payload.get('hub_id')
    
    app_coll = get_appointments_collection()
    phleb_coll = get_phlebotomists_collection()
    
    hub_filter = {'hub_id': hub_id}
    
    # 1. Fleet Stats
    total_fleet = phleb_coll.count_documents(hub_filter)
    online_fleet = phleb_coll.count_documents({**hub_filter, 'is_online': True})
    
    # 2. Identify Hub's Fleet IDs
    phlebs = list(phleb_coll.find(hub_filter))
    fleet_ids = [p.get('id', str(p.get('_id'))) for p in phlebs]
    
    # 3. Calculate Metrics for THIS Hub
    # Count orders already assigned to this fleet
    assigned_orders = list(app_coll.find({'assigned_phlebotomist_id': {'$in': fleet_ids}}))
    
    total_hub_revenue = 0
    for o in assigned_orders:
        price_str = str(o.get('price', '0')).replace('$', '').replace(',', '').strip()
        try:
            total_hub_revenue += float(price_str)
        except:
            pass
            
    # 4. Pipeline Data (Pending orders + Hub's assigned orders)
    pending_orders = list(app_coll.find({'status': 'Pending'}))
    combined_pipeline = pending_orders + assigned_orders
    
    # Create name map for phlebs
    phleb_name_map = {p.get('id', str(p.get('_id'))): p.get('name') for p in phlebs}
    
    pipeline_data = []
    for item in combined_pipeline[:20]: # Limit to 20 for dashboard
        d = transform_doc(item)
        pid = d.get('assigned_phlebotomist_id')
        pipeline_data.append({
            'id': d.get('id', d.get('_id', 'APP-UNKNOWN')),
            'patient': d.get('full_name', d.get('patient', d.get('patient_name', 'Patient Access'))),
            'location': d.get('location', d.get('address', d.get('addr', 'Hub Sector'))),
            'status': d.get('status', 'Pending'),
            'price': d.get('price', '$0.00'),
            'type': d.get('test_type', 'Medical Case'),
            'phlebotomist_name': phleb_name_map.get(pid, 'Request ID: ' + d.get('id', 'NEW')) if pid else 'Unassigned'
        })
    
    stats = {
        'metrics': {
            'total_orders': len(assigned_orders),
            'active_phlebs': online_fleet,
            'revenue': f"${total_hub_revenue:,.2f}",
            'growth': '+12%' if len(assigned_orders) > 0 else '0%'
        },
        'pipeline': pipeline_data,
        'fleet_summary': {'total': total_fleet, 'online': online_fleet}
    }
    return Response(stats)

@api_view(['GET'])
def hub_reports(request):
    """GET /api/phleb/hubs/reports/ — Real-time operational summaries."""
    auth_header = request.headers.get('Authorization')
    if not auth_header: return Response(status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    hub_id = payload.get('hub_id')
    
    app_coll = get_appointments_collection()
    phleb_coll = get_phlebotomists_collection()
    
    hub_filter = {'hub_id': hub_id}
    phlebs = list(phleb_coll.find(hub_filter))
    fleet_ids = [p.get('id', str(p.get('_id'))) for p in phlebs]
    
    total_assigned = app_coll.count_documents({'assigned_phlebotomist_id': {'$in': fleet_ids}})
    completed = app_coll.count_documents({'assigned_phlebotomist_id': {'$in': fleet_ids}, 'status': 'Completed'})
    
    today = datetime.date.today()
    reports = [
        {
            'id': f'REP-{today.strftime("%m%d")}-LIVE', 
            'name': 'Live Operational Summary', 
            'date': today.isoformat(), 
            'description': f'Fleet coverage: {len(phlebs)} specialists. Assignments: {total_assigned}.',
            'status': 'Generated'
        },
        {
            'id': 'REP-PERF-Q2', 
            'name': 'Fleet Conversion Report', 
            'date': today.isoformat(), 
            'description': f'Completion Rate: {(completed/total_assigned*100) if total_assigned > 0 else 0:.1f}%',
            'status': 'Ready'
        }
    ]
    return Response(reports)
