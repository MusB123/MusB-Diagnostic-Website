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
    {'id': 7, 'title': 'Mobile Phlebotomy (Home/Office)', 'category': 1, 'category_name': 'General Wellness', 'description': 'On-site blood collection service at your preferred location.', 'price': '100.00', 'preparation': 'As per specific tests', 'sample_type': 'Service', 'turnaround': 'Varies', 'icon_name': 'Truck'},
]

def seed_production_if_empty():
    """
    Ensures the database has essential catalog, config, and administration accounts.
    Only seeds if a collection is completely empty. Non-destructive.
    """
    db = get_db()
    if db is None:
        logger.warning("[SEEDER] Database unreachable. Skipping auto-seed.")
        return

    # Master Data & Core Accounts
    MOCK_ADMINS = [
        {
            'email': 'info@musbdiagnostics.com', 
            'password': 'LandOLakes9186$', 
            'role': 'SUPER_ADMIN', 
            'name': 'MusB Super Admin'
        }
    ]
    MOCK_EMPLOYERS = [
        {'email': 'employer@musb.com', 'password': 'MusB123', 'name': 'Demo Employer', 'company_name': 'MusB Health Corp (Demo)', 'plan_name': 'Match Program', 'plan_status': 'Active'}
    ]
    MOCK_HUBS = [
        {'id': 'HUB-EAST-001', 'name': 'Atlantic Phlebotomy Fleet', 'email': 'east@musb.fleet', 'address': '450 Park Avenue, NY', 'status': 'active', 'created_at': '2026-01-15T09:00:00'},
        {'id': 'HUB-DEMO-001', 'name': 'MusB Demo Hub', 'email': 'hub@musb.com', 'password': 'Hub2026', 'status': 'active', 'fleet_size': 5}
    ]

    MOCK_PLANS = [
        {'id': 1, 'name': 'Annual Coverage', 'price_display': '$108 - $178', 'price_suffix': '/ employee', 'description': 'Annual allotment per employee for covered diagnostic testing.', 'is_featured': False, 'tag_label': '', 'icon_name': 'Shield', 'features': [{'id': 1, 'text': 'Annual allotment per employee'}, {'id': 2, 'text': 'Onsite or in-clinic collections'}, {'id': 3, 'text': 'Pre-employment & DOT testing'}, {'id': 4, 'text': 'Basic health screenings'}]},
        {'id': 2, 'name': 'Match Program', 'price_display': 'Co-Pay', 'price_suffix': 'Ledger tracked', 'description': 'Employer matches a portion of employee lab test costs.', 'is_featured': True, 'tag_label': 'Most Popular', 'icon_name': 'Handshake', 'features': [{'id': 5, 'text': 'Employer-employee cost sharing'}, {'id': 6, 'text': 'Flexible match ratios'}, {'id': 7, 'text': 'Executive health credits'}, {'id': 8, 'text': 'Family member add-ons'}]},
        {'id': 3, 'name': 'Free Membership', 'price_display': '$0', 'price_suffix': '/ employee', 'description': 'Employees get self-pay pricing with no employer cost.', 'is_featured': False, 'tag_label': '', 'icon_name': 'Gift', 'features': [{'id': 9, 'text': 'Zero employer cost'}, {'id': 10, 'text': 'Self-pay discounted pricing'}, {'id': 11, 'text': 'Mobile phlebotomy access'}, {'id': 12, 'text': 'Online results portal'}]},
        {'id': 4, 'name': 'Medical Advice', 'price_display': 'Custom', 'price_suffix': '', 'description': 'White-glove concierge medical advisory for executives.', 'is_featured': False, 'tag_label': '', 'icon_name': 'Stethoscope', 'features': [{'id': 13, 'text': 'Dedicated medical advisor'}, {'id': 14, 'text': 'Personalized health plans'}, {'id': 15, 'text': 'Priority scheduling'}, {'id': 16, 'text': '24/7 telemedicine access'}]}
    ]

    MOCK_COMPARISON = [
        {'id': 1, 'feature_name': 'Annual Health Screening', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 2, 'feature_name': 'Onsite Collections (5+ employees)', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 3, 'feature_name': 'Pre-Employment & DOT Testing', 'annual_coverage': True, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 4, 'feature_name': 'Executive Health Credits', 'annual_coverage': False, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 5, 'feature_name': 'Family Member Add-ons', 'annual_coverage': False, 'match_program': True, 'free_membership': False, 'medical_advice': True},
        {'id': 6, 'feature_name': 'Dedicated Medical Advisor', 'annual_coverage': False, 'match_program': False, 'free_membership': False, 'medical_advice': True},
        {'id': 7, 'feature_name': 'Mobile Phlebotomy Access', 'annual_coverage': True, 'match_program': True, 'free_membership': True, 'medical_advice': True},
        {'id': 8, 'feature_name': 'Online Results Portal', 'annual_coverage': True, 'match_program': True, 'free_membership': True, 'medical_advice': True}
    ]

    try:
        collections_data = {
            'offers': MOCK_OFFERS,
            'test_categories': MOCK_CATEGORIES,
            'lab_tests': MOCK_TESTS,
            'phlebotomy_hubs': MOCK_HUBS,
            'admin_users': MOCK_ADMINS,
            'employers': MOCK_EMPLOYERS,
            'corporate_plans': MOCK_PLANS,
            'comparison_matrix': MOCK_COMPARISON,
            'hero_content': [
                {'id': 1, 'badge_text': 'Next-Gen Diagnostics', 'title': 'Affordable Lab Testing + Mobile Collections + Research-Grade Quality', 'subtitle': 'Self-pay, employer plans, physicians, facilities, research & biomarker validation.'}
            ],
            'system_config': [
                {'id': 'global', 'maintenance_mode': False, 'allow_signups': True}
            ]
        }

        for coll_name, data in collections_data.items():
            if db[coll_name].count_documents({}) == 0:
                db[coll_name].insert_many(data)
                logger.info(f"🌱 [SEEDER] Seeded {len(data)} items into empty collection '{coll_name}'")
            
    except Exception as e:
        logger.error(f"❌ [SEEDER] Auto-seed failed: {str(e)}")
