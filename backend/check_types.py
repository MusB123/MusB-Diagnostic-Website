import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()
from musb_backend.mongodb import get_lab_tests_collection
coll = get_lab_tests_collection()
for t in coll.find():
    p = t.get('price')
    print(f"Title: {t.get('title')}, Active: {t.get('is_active')}, Price: {p} ({type(p)})")
