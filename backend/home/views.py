from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import datetime
from musb_backend.mongodb import (
    get_hero_content_collection, get_services_collection, 
    get_testimonials_collection, get_popular_panels_collection,
    get_newsletter_subscribers_collection, transform_doc
)


@api_view(['GET'])
def hero_content(request):
    """GET /api/home/hero/ — Hero section content (from MongoDB)."""
    try:
        coll = get_hero_content_collection()
        docs = list(coll.find())
        return Response([transform_doc(d) for d in docs])
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def services_list(request):
    """GET /api/home/services/ — 'Choose Your Path' service cards (from MongoDB)."""
    try:
        coll = get_services_collection()
        docs = list(coll.find())
        return Response([transform_doc(d) for d in docs])
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def testimonials_list(request):
    """GET /api/home/testimonials/ — Customer testimonials (from MongoDB)."""
    try:        
        coll = get_testimonials_collection()
        docs = list(coll.find())
        return Response([transform_doc(d) for d in docs])
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def popular_panels_list(request):
    """GET /api/home/popular-panels/ — Popular test panels (from MongoDB)."""
    try:
        coll = get_popular_panels_collection()
        docs = list(coll.find())
        return Response([transform_doc(d) for d in docs])
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def newsletter_subscribe(request):
    """POST /api/home/newsletter/ — Subscribe to newsletter (saves to MongoDB)."""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    coll = get_newsletter_subscribers_collection()
    coll.insert_one({'email': email, 'subscribed_at': str(datetime.datetime.utcnow())})
    
    return Response(
        {'message': 'Successfully subscribed to the newsletter!'},
        status=status.HTTP_201_CREATED,
    )

@api_view(['GET'])
def health_check(request):
    """GET /api/home/health/ — Diagnostic endpoint for production."""
    from musb_backend.mongodb import get_db, is_mock_database
    import os
    import sys
    
    health_report = {
        'status': 'Online',
        'environment': 'Production' if os.getenv('RENDER') else 'Development',
        'database': {
            'connection': 'Unknown',
            'is_mock': False,
            'details': ''
        },
        'dependencies': {
            'dnspython': 'Missing'
        }
    }
    
    # Check dnspython
    try:
        import dns
        health_report['dependencies']['dnspython'] = 'Installed'
    except ImportError:
        pass
        
    # Check Database
    try:
        db = get_db()
        # Try a simple operation
        db.command('ping')
        health_report['database']['connection'] = 'Connected'
        health_report['database']['is_mock'] = is_mock_database()
        health_report['database']['details'] = 'MongoDB handshake successful'
    except Exception as e:
        health_report['status'] = 'Degraded'
        health_report['database']['connection'] = 'Failed'
        health_report['database']['details'] = str(e)
        
    return Response(health_report)
