from rest_framework.decorators import api_view
from rest_framework.response import Response
from musb_backend.mongodb import get_offers_collection, transform_doc


@api_view(['GET'])
def offers_list(request):
    """GET /api/offers/ — List ACTIVE offers with optional filtering (from MongoDB)."""
    coll = get_offers_collection()
    query = {}

    search = request.query_params.get('search')
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'includes': {'$regex': search, '$options': 'i'}}
        ]

    offer_type = request.query_params.get('type')
    if offer_type and offer_type != 'All':
        query['offer_type'] = offer_type

    category = request.query_params.get('category')
    if category and category != 'All':
        query['category'] = category

    docs = list(coll.find(query))
    # Only return active offers on the public API
    active_docs = [d for d in docs if d.get('is_active', True)]
    return Response([transform_doc(d) for d in active_docs])


@api_view(['GET'])
def offer_detail(request, pk):
    """GET /api/offers/{id}/ — Single offer detail (from MongoDB)."""
    coll = get_offers_collection()
    try:
        doc = coll.find_one({'id': int(pk)})
        if doc and doc.get('is_active', True):
            return Response(transform_doc(doc))
    except (ValueError, TypeError):
        pass
        
    return Response({'error': 'Offer not found'}, status=404)
