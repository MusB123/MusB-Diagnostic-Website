import json

class MockCollection:
    def __init__(self, items):
        self.items = items

    def find(self, query=None):
        if not query:
            return self.items
        
        filtered = self.items

        # Support $or operator at the top level
        if '$or' in query:
            or_queries = query['$or']
            or_results = []
            for item in filtered:
                is_or_match = False
                for sub_query in or_queries:
                    sub_match = True
                    for k, v in sub_query.items():
                        item_val = item.get(k)
                        if isinstance(v, dict):
                            if '$regex' in v:
                                if v['$regex'].lower() not in str(item_val or '').lower():
                                    sub_match = False
                            elif '$ne' in v:
                                if item_val == v['$ne']:
                                    sub_match = False
                        elif str(item_val) != str(v):
                            sub_match = False
                        
                        if not sub_match:
                            break
                    if sub_match:
                        is_or_match = True
                        break
                if is_or_match:
                    or_results.append(item)
            filtered = or_results

        for key, val in query.items():
            if key == '$or': continue

            if isinstance(val, dict):
                for op, op_val in val.items():
                    if op == '$ne':
                        filtered = [item for item in filtered if item.get(key) != op_val]
                    elif op == '$lte':
                        filtered = [item for item in filtered if float(item.get(key, 0) or 0) <= float(op_val)]
                    elif op == '$gte':
                        filtered = [item for item in filtered if float(item.get(key, 0) or 0) >= float(op_val)]
                    elif op == '$regex':
                        filtered = [item for item in filtered if op_val.lower() in str(item.get(key, '') or '').lower()]
                continue
            
            if val and val != 'All':
                filtered = [item for item in filtered if str(item.get(key)) == str(val)]
                
        return filtered

# Test data
items = [
    {'title': 'Thyroid Panel', 'description': 'Tests for thyroid function.', 'category_name': 'Hormones', 'price': 50},
    {'title': 'Vitamin D', 'description': 'Tests for Vitamin D levels.', 'category_name': 'Vitamins', 'price': 30},
]

coll = MockCollection(items)

query = {
    '$or': [
        {'title': {'$regex': 'thyroid', '$options': 'i'}},
        {'description': {'$regex': 'thyroid', '$options': 'i'}},
        {'category_name': {'$regex': 'thyroid', '$options': 'i'}}
    ],
    'is_active': {'$ne': False}
}

results = coll.find(query)
print(f"Results found: {len(results)}")
for r in results:
    print(f" - {r['title']}")
