from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import uuid
import datetime
from .auth import login_manual, verify_token
from musb_backend.mongodb import (
    get_research_studies_collection, get_research_samples_collection,
    get_research_shipments_collection, get_research_universities_collection,
    get_research_services_collection, get_research_biorepository_collection,
    get_research_collaborations_collection, get_research_quotes_collection,
    get_research_subscriptions_collection, get_research_users_collection, transform_doc
)


@api_view(['GET'])
def services_list(request):
    """GET /api/research/services/ — Study support services (from MongoDB)."""
    coll = get_research_services_collection()
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])


@api_view(['GET'])
def biorepository_info(request):
    """GET /api/research/biorepository/ — Biorepository stats (from MongoDB)."""
    coll = get_research_biorepository_collection()
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])


@api_view(['GET'])
def collaborations_list(request):
    """GET /api/research/collaborations/ — Academic collaboration info (from MongoDB)."""
    coll = get_research_collaborations_collection()
    docs = list(coll.find())
    return Response([transform_doc(d) for d in docs])


@api_view(['GET'])
def research_stats(request):
    """GET /api/research/stats/ — Aggregated research stats."""
    return Response({'reliability': '99.99%', 'capacity': '10M+'})


@api_view(['POST'])
def submit_quote(request):
    """POST /api/research/quote/ — Submit proposal request."""
    coll = get_research_quotes_collection()
    data = request.data
    data['status'] = 'pending'
    data['created_at'] = str(datetime.datetime.utcnow())
    coll.insert_one(data)
    return Response({'message': 'Proposal request sent successfully!'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def newsletter_subscribe(request):
    """POST /api/research/newsletter/ — Research newsletter signup."""
    coll = get_research_subscriptions_collection()
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    coll.insert_one({'email': email, 'subscribed_at': str(datetime.datetime.utcnow())})
    return Response({'message': 'Subscribed!'}, status=status.HTTP_201_CREATED)

# --- Research Portal Authentication ---

@api_view(['POST'])
def login_view(request):
    """POST /api/research/portal/login/ — Portal authentication."""
    email = request.data.get('email')
    password = request.data.get('password')
    login_data = login_manual(email, password)
    if login_data:
        return Response(login_data)
    return Response({'error': 'Invalid research credentials'}, status=status.HTTP_401_UNAUTHORIZED)

def get_current_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    return verify_token(token)

@api_view(['POST'])
def signup_view(request):
    """POST /api/research/portal/signup/ — Register a new research lab/user."""
    coll = get_research_users_collection()
    data = request.data
    
    # Check if user already exists
    if coll.find_one({'email': data.get('email')}):
        return Response({'error': 'Email already registered in the repository.'}, status=400)
    
    # Map 'lab_name' to 'institution' for consistency with JWT/Auth
    if 'lab_name' in data:
        data['institution'] = data.pop('lab_name')
        
    data['role'] = 'client'  # Default role for new signups
    data['created_at'] = str(datetime.datetime.utcnow())
    
    coll.insert_one(data)
    
    # Automaticaly log them in after signup
    login_data = login_manual(data['email'], data['password'])
    return Response(login_data, status=status.HTTP_201_CREATED)

# --- Research Client & Admin Dashboard Modules ---

@api_view(['GET'])
def dashboard_overview(request):
    """GET /api/research/portal/dashboard/ — Aggregated stats for both roles."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    studies_coll = get_research_studies_collection()
    samples_coll = get_research_samples_collection()
    
    if user['role'] == 'client':
        # Clients only see their own institution's summary
        studies = list(studies_coll.find({'sponsor': user['institution']}))
        study_ids = [s.get('study_id') for s in studies]
        sample_count = len(list(samples_coll.find({'study_id': {'$in': study_ids}})))
        shipments_coll = get_research_shipments_collection()
        shipment_count = len(list(shipments_coll.find({'study_id': {'$in': study_ids}})))
        
        return Response({
            'active_studies': len(studies),
            'total_samples': sample_count,
            'recent_shipments': shipment_count,
            'pending_requests': 0
        })
    else:
        # Admins see global summary
        total_studies = len(list(studies_coll.find()))
        total_samples = len(list(samples_coll.find()))
        
        # Calculate storage utilization based on total sample capacity (let's assume 1M capacity for now)
        utilization = (total_samples / 1000000) * 100
        
        return Response({
            'active_studies': total_studies,
            'total_samples': total_samples,
            'storage_utilization': f"{utilization:.1f}%",
            'critical_alerts': 0
        })

@api_view(['GET', 'POST', 'DELETE'])
def study_management(request):
    """GET/POST/DELETE /api/research/portal/studies/ — Study protocols."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    coll = get_research_studies_collection()
    
    if request.method == 'GET':
        query = {} if user['role'] == 'admin' else {'sponsor': user['institution']}
        studies = list(coll.find(query))
        return Response([transform_doc(s) for s in studies])
    
    elif request.method == 'POST':
        if user['role'] != 'admin': return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        data['study_id'] = f"STUDY-{uuid.uuid4().hex[:6].upper()}"
        data['created_at'] = str(datetime.datetime.utcnow())
        coll.insert_one(data)
        return Response(transform_doc(data), status=status.HTTP_201_CREATED)
    
    elif request.method == 'DELETE':
        if user['role'] != 'admin': return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        study_id = request.GET.get('study_id')
        if not study_id: return Response({'error': 'Missing study_id'}, status=status.HTTP_400_BAD_REQUEST)
        coll.delete_one({'study_id': study_id})
        return Response({'success': True})

@api_view(['GET', 'POST'])
def sample_tracking(request):
    """GET/POST /api/research/portal/samples/ — LIMS Accessioning."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    coll = get_research_samples_collection()
    
    if request.method == 'GET':
        study_id = request.GET.get('study_id')
        query = {'study_id': study_id} if study_id else {}
        samples = list(coll.find(query))
        return Response([transform_doc(s) for s in samples])
        
    elif request.method == 'POST':
        if user['role'] != 'admin': return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        data['barcode'] = f"MUSB-{uuid.uuid4().hex[:8].upper()}"
        data['status'] = 'Received'
        coll.insert_one(data)
        return Response(transform_doc(data), status=status.HTTP_201_CREATED)

@api_view(['GET'])
def inventory_reporting(request):
    """GET /api/research/portal/reporting/ — Utilization reports."""
    user = get_current_user(request)
    if not user or user['role'] != 'admin': return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    samples_coll = get_research_samples_collection()
    samples = list(samples_coll.find({}))
    
    # Aggregation for reporting
    types = ['Whole Blood', 'Plasma', 'Serum', 'DNA', 'RNA']
    by_type = {t: len([s for s in samples if s.get('type') == t]) for t in types}
    
    # Storage trends: group by some date field if available, or mock for now but based on reality
    # For a real implementation, we'd group by created_at. Since we have limited mock data:
    report = {
        'total_inventory': len(samples),
        'by_type': by_type,
        'storage_trends': [120, 150, 400, 800, len(samples)],
        'storage_utilization': (len(samples) / 1000000) * 100
    }
    return Response(report)

@api_view(['GET', 'POST', 'DELETE'])
def university_directory(request):
    """GET/POST /api/research/portal/universities/ — Partnership management."""
    user = get_current_user(request)
    if not user or user['role'] != 'admin': return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    coll = get_research_universities_collection()
    
    if request.method == 'GET':
        universities = list(coll.find({}))
        return Response([transform_doc(u) for u in universities])
        
    elif request.method == 'POST':
        data = request.data
        coll.insert_one(data)
        return Response(transform_doc(data), status=status.HTTP_201_CREATED)
    
    elif request.method == 'DELETE':
        uni_id = request.data.get('id')
        coll.delete_one({'_id': uni_id})
        return Response({'success': True})

# --- Technology Validation & Research ---

@api_view(['POST'])
def submit_validation_brief(request):
    """POST /api/research/validation/submit/ — Submit technology brief for review."""
    from musb_backend.mongodb import get_research_validations_collection
    coll = get_research_validations_collection()
    data = request.data
    data['project_id'] = f"VAL-{uuid.uuid4().hex[:4].upper()}"
    data['status'] = 'Intake'
    data['progress'] = 10
    data['created_at'] = str(datetime.datetime.utcnow())
    data['last_updated'] = str(datetime.datetime.utcnow())
    coll.insert_one(data)
    return Response({'message': 'Technology brief submitted successfully!', 'project_id': data['project_id']}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def validation_tracker_list(request):
    """GET /api/research/validation/tracker/ — Get active validation projects."""
    from musb_backend.mongodb import get_research_validations_collection, transform_doc
    coll = get_research_validations_collection()
    docs = list(coll.find().sort('created_at', -1))
    
    # If empty, return some professional mock data for demo purposes
    if not docs:
        docs = [
            {'project_id': 'VAL-9021', 'name': 'GLP-1 Biomarker Assay', 'status': 'Analytical Validation', 'progress': 75, 'date': '2024-05-12'},
            {'project_id': 'VAL-8842', 'name': 'Neuro-Pro G5 Panel', 'status': 'Feasibility', 'progress': 40, 'date': '2024-06-18'},
            {'project_id': 'VAL-7721', 'name': 'Early Oncology Screening', 'status': 'Pilot Clinical', 'progress': 15, 'date': '2024-07-02'}
        ]
        return Response([transform_doc(d) for d in docs])
        
    return Response([transform_doc(d) for d in docs])

# --- Diagnostic Marker Development Panel Modules ---

@api_view(['GET', 'POST'])
def diagnostic_tasks(request):
    """GET/POST /api/research/diag/tasks/ — Project tasks."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=401)
    
    from musb_backend.mongodb import get_diag_tasks_collection
    coll = get_diag_tasks_collection()
    
    if request.method == 'GET':
        project_id = request.GET.get('project_id')
        query = {'project_id': project_id} if project_id else {}
        docs = list(coll.find(query))
        
        if not docs and not project_id:
            docs = [
                {'project_id': 'VAL-9021', 'title': 'Assay Precision Report', 'status': 'Pending', 'due_date': '2026-05-20'},
                {'project_id': 'VAL-9021', 'title': 'LOD Verification', 'status': 'Completed', 'due_date': '2026-04-10'},
                {'project_id': 'VAL-8842', 'title': 'Resource Assessment', 'status': 'In Progress', 'due_date': '2026-06-01'}
            ]
        return Response([transform_doc(d) for d in docs])
        
    if request.method == 'POST':
        data = request.data
        data['created_at'] = str(datetime.datetime.utcnow())
        coll.insert_one(data)
        return Response({'message': 'Task created'}, status=201)

@api_view(['GET', 'POST'])
def diagnostic_messages(request):
    """GET/POST /api/research/diag/messages/ — Project communication."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=401)
    
    from musb_backend.mongodb import get_diag_messages_collection
    coll = get_diag_messages_collection()
    
    if request.method == 'GET':
        project_id = request.GET.get('project_id')
        query = {'project_id': project_id} if project_id else {}
        docs = list(coll.find(query).sort('created_at', 1))
        
        if not docs and not project_id:
            docs = [
                {'project_id': 'VAL-9021', 'sender': 'MusB Admin', 'text': 'Received your preliminary assay data. Reviewing now.', 'created_at': '2026-04-12T10:00:00'},
                {'project_id': 'VAL-9021', 'sender': 'Biotech Developer', 'text': 'Great, let me know if you need the raw CSVs.', 'created_at': '2026-04-12T11:30:00'}
            ]
        return Response([transform_doc(d) for d in docs])
        
    if request.method == 'POST':
        data = request.data
        data['sender'] = user['name']
        data['created_at'] = str(datetime.datetime.utcnow())
        coll.insert_one(data)
        return Response({'message': 'Message sent'}, status=201)

@api_view(['GET', 'POST'])
def diagnostic_documents(request):
    """GET/POST /api/research/diag/documents/ — Project documents."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=401)
    
    from musb_backend.mongodb import get_diag_documents_collection
    coll = get_diag_documents_collection()
    
    if request.method == 'GET':
        project_id = request.GET.get('project_id')
        query = {'project_id': project_id} if project_id else {}
        docs = list(coll.find(query))
        
        if not docs and not project_id:
            docs = [
                {'project_id': 'VAL-9021', 'name': 'Technology_Brief.pdf', 'type': 'PDF', 'size': '2.4 MB', 'uploaded_by': 'Developer'},
                {'project_id': 'VAL-9021', 'name': 'NDA_Signed_MusB.pdf', 'type': 'PDF', 'size': '1.1 MB', 'uploaded_by': 'MusB Admin'}
            ]
        return Response([transform_doc(d) for d in docs])
        
    if request.method == 'POST':
        data = request.data
        data['uploaded_by'] = user['name']
        data['created_at'] = str(datetime.datetime.utcnow())
        coll.insert_one(data)
        return Response({'message': 'Document uploaded'}, status=201)

@api_view(['GET', 'POST'])
def diagnostic_invoices(request):
    """GET/POST /api/research/diag/invoices/ — Billing & Milestones."""
    user = get_current_user(request)
    if not user: return Response({'error': 'Unauthorized'}, status=401)
    
    from musb_backend.mongodb import get_diag_invoices_collection
    coll = get_diag_invoices_collection()
    
    if request.method == 'GET':
        project_id = request.GET.get('project_id')
        query = {'project_id': project_id} if project_id else {}
        docs = list(coll.find(query))
        
        if not docs and not project_id:
            docs = [
                {'project_id': 'VAL-9021', 'milestone': 'Intake Completion', 'amount': '$2,500', 'status': 'Paid', 'due_date': '2026-03-30'},
                {'project_id': 'VAL-9021', 'milestone': 'Feasibility Study', 'amount': '$5,000', 'status': 'Sent', 'due_date': '2026-04-25'}
            ]
        return Response([transform_doc(d) for d in docs])
        
    if request.method == 'POST':
        if user['role'] != 'admin': return Response({'error': 'Admin only'}, status=403)
        data = request.data
        data['created_at'] = str(datetime.datetime.utcnow())
        coll.insert_one(data)
        return Response({'message': 'Invoice created'}, status=201)

@api_view(['GET', 'PATCH'])
def diagnostic_pipeline(request):
    """GET/PATCH /api/research/diag/pipeline/ — Kanban Board (Admin)."""
    user = get_current_user(request)
    if not user or user['role'] != 'admin': return Response({'error': 'Unauthorized'}, status=401)
    
    from musb_backend.mongodb import get_research_validations_collection
    coll = get_research_validations_collection()
    
    if request.method == 'GET':
        docs = list(coll.find())
        if not docs:
            docs = [
                {'project_id': 'VAL-9021', 'name': 'GLP-1 Biomarker Assay', 'status': 'Analytical Validation', 'progress': 75},
                {'project_id': 'VAL-8842', 'name': 'Neuro-Pro G5 Panel', 'status': 'Feasibility', 'progress': 40},
                {'project_id': 'VAL-7721', 'name': 'Early Oncology Screening', 'status': 'Intake', 'progress': 10}
            ]
        return Response([transform_doc(d) for d in docs])
        
    if request.method == 'PATCH':
        project_id = request.data.get('project_id')
        new_status = request.data.get('status')
        new_progress = request.data.get('progress')
        
        update_data = {'status': new_status, 'last_updated': str(datetime.datetime.utcnow())}
        if new_progress is not None:
            update_data['progress'] = new_progress
            
        coll.update_one({'project_id': project_id}, {'$set': update_data})
        return Response({'message': 'Pipeline updated'})
