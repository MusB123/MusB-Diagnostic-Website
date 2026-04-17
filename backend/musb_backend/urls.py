"""
URL configuration for musb_backend project.
All API endpoints are namespaced under /api/.
"""

from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_root(request):
    """API root — lists all available endpoints."""
    return Response({
        'home': request.build_absolute_uri('home/'),
        'catalog': request.build_absolute_uri('catalog/'),
        'offers': request.build_absolute_uri('offers/'),
        'bookings': request.build_absolute_uri('bookings/'),
        'employers': request.build_absolute_uri('employers/'),
        'research': request.build_absolute_uri('research/'),
        'phleb': request.build_absolute_uri('phleb/'),
    })


urlpatterns = [
    path('api/', api_root, name='api-root'),
    path('api/home/', include('home.urls')),
    path('api/catalog/', include('catalog.urls')),
    path('api/offers/', include('offers.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/employers/', include('employers.urls')),
    path('api/research/', include('research.urls')),
    path('api/superadmin/', include('super_admin.urls')),
    path('api/phleb/', include('phlebotomy.urls')),
    path('api/patients/', include('patients.urls')),
]
