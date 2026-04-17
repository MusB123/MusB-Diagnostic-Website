import logging
from musb_backend.mongodb import get_db

logger = logging.getLogger(__name__)

# Professional-grade mock data required for client presentation
MOCK_OFFERS = [
    {'id': 1, 'title': 'Essential Vitamin Profile', 'offer_type': 'Weekly', 'category': 'Vitamins', 'original_price': '120.00', 'discounted_price': '69.00', 'includes': ['Vitamin D total', 'Vitamin B12', 'Iron Panel'], 'time_left': '3d 14h 22m', 'is_active': True},
    {'id': 2, 'title': "Complete Men's/Women's Health", 'offer_type': 'Monthly', 'category': 'Metabolic', 'original_price': '250.00', 'discounted_price': '149.00', 'includes': ['Full Hormone Panel', 'Comprehensive Metabolic', 'CBC & Lipid Profile'], 'time_left': 'Ends on Mar 31', 'is_active': True},
    {'id': 3, 'title': 'Allergy & Immunity Panel', 'offer_type': 'Seasonal', 'category': 'Vitamins', 'original_price': '180.00', 'discounted_price': '99.00', 'includes': ['Environmental Allergens', 'IgG / IgE markers', 'CRP Inflammation'], 'time_left': 'Limited Time', 'is_active': True},
]

MOCK_CATEGORIES = [
    {'id': 1, 'name': 'General Wellness', 'slug': 'general-wellness'},
    {'id': 2, 'name': 'Heart Health', 'slug': 'heart-health'},
    {'id': 3, 'name': 'Vitamins & Minerals', 'slug': 'vitamins-minerals'},
    {'id': 4, 'name': 'Kidney Health', 'slug': 'kidney-health'},
    {'id': 5, 'name': 'Infectious Disease', 'slug': 'infectious-disease'},
]

MOCK_TESTS = [
    {'id': 1, 'title': 'Complete Blood Count (CBC)', 'category': 1, 'category_name': 'General Wellness', 'description': 'Measures different parts of your blood, including RBC, WBC, and platelets.', 'price': '29.00', 'preparation': 'No fasting required', 'sample_type': 'Blood', 'turnaround': '24h', 'icon_name': 'Droplet'},
    {'id': 2, 'title': 'Advanced Lipid Panel', 'category': 2, 'category_name': 'Heart Health', 'description': 'Checks cholesterol and triglycerides to assess cardiovascular risk.', 'price': '49.00', 'preparation': 'Fasting: 10-12 hrs', 'sample_type': 'Blood', 'turnaround': '24h', 'icon_name': 'HeartPulse'},
    {'id': 3, 'title': 'Comprehensive Metabolic Panel', 'category': 1, 'category_name': 'General Wellness', 'description': "Provides information about your body's chemical balance and metabolism.", 'price': '59.00', 'preparation': 'Fasting: 8-10 hrs', 'sample_type': 'Blood', 'turnaround': '24h', 'icon_name': 'Activity'},
    {'id': 4, 'title': 'Vitamin D Profile', 'category': 3, 'category_name': 'Vitamins & Minerals', 'description': 'Important for bone health, immune function, and overall wellness.', 'price': '39.00', 'preparation': 'No fasting required', 'sample_type': 'Blood', 'turnaround': '48h', 'icon_name': 'Bone'},
    {'id': 5, 'title': 'Urinalysis Complete', 'category': 4, 'category_name': 'Kidney Health', 'description': 'Evaluates physical, chemical, and microscopic properties of urine.', 'price': '35.00', 'preparation': 'Morning sample preferred', 'sample_type': 'Urine', 'turnaround': '24h', 'icon_name': 'Activity'},
    {'id': 6, 'title': 'Throat Culture Swab', 'category': 5, 'category_name': 'Infectious Disease', 'description': 'Detects the presence of bacterial or fungal infections in the throat.', 'price': '45.00', 'preparation': 'No food 1 hr prior', 'sample_type': 'Swab', 'turnaround': '48h', 'icon_name': 'FileWarning'},
]

def seed_production_if_empty():
    """
    Expert-level auto-seeder to ensure the database is never empty on production.
    Checks for the 'lab_tests' collection count and seeds if zero.
    """
    db = get_db()
    if db is None:
        logger.warning("[SEEDER] Database unreachable. Skipping auto-seed.")
        return

    MOCK_HUBS = [
        {'id': 'HUB-EAST-001', 'name': 'Atlantic Phlebotomy Fleet', 'email': 'east@musb.fleet', 'address': '450 Park Avenue, NY', 'status': 'active', 'created_at': '2026-01-15T09:00:00'},
        {'id': 'HUB-WEST-002', 'name': 'Pacific Mobile Diagnostics', 'email': 'west@musb.fleet', 'address': '85 Broad St, NY', 'status': 'active', 'created_at': '2026-02-10T11:00:00'},
    ]

    try:
        # Check if tests are missing
        if db['lab_tests'].count_documents({}) == 0:
            logger.info("🌱 [SEEDER] Production database empty. Commencing auto-healing...")
            
            # Map collections
            collections_data = {
                'offers': MOCK_OFFERS,
                'test_categories': MOCK_CATEGORIES,
                'lab_tests': MOCK_TESTS,
                'phlebotomy_hubs': MOCK_HUBS,
                'hero_content': [
                    {'id': 1, 'badge_text': 'Next-Gen Diagnostics', 'title': 'Affordable Lab Testing + Mobile Collections + Research-Grade Quality', 'subtitle': 'Self-pay, employer plans, physicians, facilities, research & biomarker validation.'}
                ],
                'popular_panels': [
                    {'id': 1, 'name': 'Annual Health Check', 'icon_name': 'Activity', 'price': '150.00', 'link': '/tests'},
                    {'id': 2, 'name': 'Comprehensive Metabolic', 'icon_name': 'Droplets', 'price': '45.00', 'link': '/tests'},
                    {'id': 3, 'name': 'Advanced Thyroid Panel', 'icon_name': 'AlertCircle', 'price': '85.00', 'link': '/tests'},
                ]
            }

            for coll_name, data in collections_data.items():
                db[coll_name].delete_many({})
                db[coll_name].insert_many(data)
                logger.info(f"✅ [SEEDER] Seeded {len(data)} items into '{coll_name}'")
            
            logger.info("✨ [SEEDER] Auto-healing complete. Production database ready.")
        else:
            logger.info("[SEEDER] Production data verified. No action needed.")
            
    except Exception as e:
        logger.error(f"❌ [SEEDER] Auto-seed failed: {str(e)}")
