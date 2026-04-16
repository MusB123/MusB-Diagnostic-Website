import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'musb_db')

print(f"Connecting to: {MONGO_URI}")
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

collections = ['lab_tests', 'test_categories', 'offers', 'popular_panels']

for coll_name in collections:
    coll = db[coll_name]
    count = coll.count_documents({})
    print(f"\nCollection: {coll_name}")
    print(f"Total Documents: {count}")
    
    if count > 0:
        print("Sample Document Structure:")
        sample = coll.find_one()
        for k, v in sample.items():
            print(f" - {k}: {type(v).__name__} = {v}")
        
        # Check if they have is_active field
        active_count = coll.count_documents({'is_active': {'$ne': False}})
        print(f"Documents where is_active != False: {active_count}")

client.close()
