import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)

print("Listing all databases in the cluster:")
try:
    dbs = client.list_database_names()
    for db_name in dbs:
        print(f" - {db_name}")
        db = client[db_name]
        cols = db.list_collection_names()
        print(f"   Collections: {cols}")
except Exception as e:
    print(f"Error listing databases: {e}")

client.close()
