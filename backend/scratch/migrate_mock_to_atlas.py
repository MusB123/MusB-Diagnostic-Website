import os
import json
import certifi
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# Load credentials
load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('MONGO_DB_NAME', 'musb_db')

# Mapping of mock_db.json keys to actual Atlas collection names
COLLECTION_MAPPING = {
    "hero": "hero_content",
    "tests": "lab_tests",
    "categories": "test_categories",
    # Others will use their key name directly
}

def migrate():
    # 1. Initialize MongoDB
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    print(f"--- MIGRATION START: Connected to {DB_NAME} ---")

    # 2. Load Mock Data
    mock_file = "mock_db.json"
    if not os.path.exists(mock_file):
        print(f"Error: {mock_file} not found.")
        return

    with open(mock_file, "r") as f:
        mock_data = json.load(f)

    # 3. Process Each Collection
    for key, docs in mock_data.items():
        coll_name = COLLECTION_MAPPING.get(key, key)
        coll = db[coll_name]
        
        print(f"\nMerging '{key}' -> '{coll_name}' ({len(docs)} documents)...")
        
        ops = []
        for doc in docs:
            # Expert Fix: Remove existing _id from mock doc to allow Mongo to handle it or reuse if valid
            # However, since we use numeric 'id' for logical filtering, we upsert on 'id'
            
            # 1. Visibility Enforcement
            if 'is_active' not in doc:
                doc['is_active'] = True
            
            # 2. Handle numeric ID or fallback to title/name for identification
            identifier = None
            if 'id' in doc:
                identifier = {'id': doc['id']}
            elif 'title' in doc:
                identifier = {'title': doc['title']}
            elif 'name' in doc:
                identifier = {'name': doc['name']}
            
            if identifier:
                # Upsert logic: Update if found by ID, else Insert
                # We remove '_id' from the doc if it's a string from the mock file
                if '_id' in doc and isinstance(doc['_id'], str):
                    del doc['_id']
                    
                ops.append(UpdateOne(identifier, {'$set': doc}, upsert=True))

        if ops:
            result = coll.bulk_write(ops)
            print(f"  Result: {result.upserted_count} inserted, {result.modified_count} updated.")

    print("\n--- MIGRATION COMPLETE ---")

if __name__ == "__main__":
    migrate()
