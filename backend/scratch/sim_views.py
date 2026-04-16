import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import (
    get_lab_tests_collection, get_popular_panels_collection, transform_doc
)

def test_catalog():
    print("\n--- Testing Catalog (Fuzzy Search & Numeric Filter) ---")
    coll = get_lab_tests_collection()
    
    # Test 1: Fuzzy search "blood count"
    search = "blood count"
    keywords = search.strip().split()
    word_queries = []
    for word in keywords:
        word_queries.append({
            '$or': [
                {'title': {'$regex': word, '$options': 'i'}},
                {'description': {'$regex': word, '$options': 'i'}}
            ]
        })
    query = {'$and': word_queries, '$expr': {'$lte': [{'$toDouble': '$price'}, 150.0]}}
    
    docs = list(coll.find(query))
    print(f"Search: '{search}', Max Price: 150.0")
    print(f"Found {len(docs)} documents.")
    for d in docs:
        print(f" -> {d.get('title')} (Price: {d.get('price')})")

def test_popular_panels():
    print("\n--- Testing Popular Panels ---")
    coll = get_popular_panels_collection()
    docs = list(coll.find())
    print(f"Found {len(docs)} documents in 'popular_panels'")
    if docs:
        print(f"First panel name: {docs[0].get('name') or docs[0].get('title')}")

if __name__ == "__main__":
    test_catalog()
    test_popular_panels()
