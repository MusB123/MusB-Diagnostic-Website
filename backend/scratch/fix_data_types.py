import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('MONGO_DB_NAME', 'musb_db')

def sanitize_data():
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    print(f"--- DATA SANITIZATION START: {DB_NAME} ---")

    collections_to_fix = ['lab_tests', 'popular_panels', 'offers']
    
    for coll_name in collections_to_fix:
        coll = db[coll_name]
        docs = list(coll.find())
        print(f"\nProcessing {coll_name} ({len(docs)} documents)...")
        
        updated_count = 0
        for doc in docs:
            price = doc.get('price') or doc.get('discounted_price')
            price_field = 'price' if 'price' in doc else 'discounted_price'
            
            if isinstance(price, str):
                try:
                    # Clean the string (remove $ or commas if any)
                    clean_price = price.replace('$', '').replace(',', '').strip()
                    numeric_price = float(clean_price)
                    
                    coll.update_one(
                        {'_id': doc['_id']},
                        {'$set': {price_field: numeric_price}}
                    )
                    updated_count += 1
                except (ValueError, TypeError):
                    print(f"  Skipping doc {doc.get('id')} - invalid price string: '{price}'")
        
        print(f"  Done. Updated {updated_count} documents to numeric prices.")

    print("\n--- SANITIZATION COMPLETE ---")

if __name__ == "__main__":
    sanitize_data()
