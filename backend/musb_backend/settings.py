"""
Django settings for musb_backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-musb-dev-key-fallback')

DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = [h for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h] or ['*']

INSTALLED_APPS = [
    'home.apps.HomeConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Local apps
    'catalog.apps.CatalogConfig',
    'offers.apps.OffersConfig',
    'bookings.apps.BookingsConfig',
    'employers.apps.EmployersConfig',
    'research.apps.ResearchConfig',
    'super_admin.apps.SuperAdminConfig',
    'phlebotomy.apps.PhlebotomyConfig',
    'patients.apps.PatientsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'musb_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'musb_backend.wsgi.application'

# Database Configuration
# We use a minimal SQLite backend to satisfy Django's internal requirements, 
# but all project data is handled via MongoDB (pymongo) in musb_backend/mongodb.py.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MongoDB Configuration (used by musb_backend/mongodb.py)
# Default: real MongoDB on localhost. Set MONGO_URI / MONGO_DB_NAME for Atlas or remote.
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'musb_db')
# Only if true: use backend/mock_db.json instead of MongoDB (offline tests / demos).
MONGO_USE_MOCK = os.getenv('MONGO_USE_MOCK', '').lower() in ('1', 'true', 'yes')
# If true: when MongoDB is unreachable, fall back to mock_db.json (default on so local UI works without mongod).
# Set MONGO_FALLBACK_MOCK=false when your MongoDB server is running and you want hard failures only.
MONGO_FALLBACK_MOCK = os.getenv('MONGO_FALLBACK_MOCK', 'true').lower() in ('1', 'true', 'yes')



LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration — Universal Accessibility for Frontends
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
# Explicitly trust the specific Netlify origin for CSRF if needed
CSRF_TRUSTED_ORIGINS = [
    "https://musblabs.com",
    "https://www.musblabs.com",
    "https://musb-diagnostic-website.vercel.app",
    "https://enchanting-treacle-c65bf1.netlify.app",
    "http://localhost:3000"
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# DRF Settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Custom exception handler to ensure JSON responses on production crashes
    'EXCEPTION_HANDLER': 'musb_backend.exceptions.custom_exception_handler',
}

# Email Configuration (Gmail SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'info@musbdiagnostics.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD') # User must provide Gmail App Password
DEFAULT_FROM_EMAIL = f"MusB Diagnostics <{EMAIL_HOST_USER}>"

# Frontend URL for Link Construction (Crucial for Production)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

# High-Stakes Presentation & SMTP Hardening
EMAIL_TIMEOUT = 10 
# FORCED TRUE FOR ZERO-FAILURE PRESENTATION STABILITY
PRESENTATION_SAFE_MODE = os.getenv('PRESENTATION_SAFE_MODE', 'true').lower() != 'false'

# Fallback to Console Backend in Debug if no password is set
if not EMAIL_HOST_PASSWORD and DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    print("[MUSB] EMAIL_HOST_PASSWORD not found. Emails will be logged to the console.")
