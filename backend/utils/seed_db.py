import os
import sys
import django
from pathlib import Path

# Setup Django path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from musb_backend.mongodb import get_db

# Mock Data Definitions
MOCK_OFFERS = [
    {'id': 1, 'title': 'Essential Vitamin Profile', 'offer_type': 'Weekly', 'category': 'Vitamins', 'original_price': '120.00', 'discounted_price': '69.00', 'includes': ['Vitamin D total', 'Vitamin B12', 'Iron Panel'], 'time_left': '3d 14h 22m'},
    {'id': 2, 'title': "Complete Men's/Women's Health", 'offer_type': 'Monthly', 'category': 'Metabolic', 'original_price': '250.00', 'discounted_price': '149.00', 'includes': ['Full Hormone Panel', 'Comprehensive Metabolic', 'CBC & Lipid Profile'], 'time_left': 'Ends on Mar 31'},
    {'id': 3, 'title': 'Allergy & Immunity Panel', 'offer_type': 'Seasonal', 'category': 'Vitamins', 'original_price': '180.00', 'discounted_price': '99.00', 'includes': ['Environmental Allergens', 'IgG / IgE markers', 'CRP Inflammation'], 'time_left': 'Limited Time'},
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

HERO_CONTENT = [
    {'id': 1, 'badge_text': 'Next-Gen Diagnostics', 'title': 'Affordable Lab Testing + Mobile Collections + Research-Grade Quality', 'subtitle': 'Self-pay, employer plans, physicians, facilities, research & biomarker validation.'},
]

SERVICES_LIST = [
    {'id': 1, 'title': 'Self-Pay Patients', 'description': 'Direct access to lab testing with transparent pricing.', 'icon_name': 'User', 'link': '/self-pay-lab-tests', 'features': ['Test Catalog & Panels', 'Annual Health Checkups', "Women's & Metabolic Health", 'Thyroid & STD Testing']},
    {'id': 2, 'title': 'Employers & HR', 'description': 'Corporate wellness and pre-employment screening.', 'icon_name': 'Briefcase', 'link': '/employer-health-program', 'features': ['4-Tier Plan Comparison', 'Onsite Collections (5+ rule)', 'Executive & Family Credits', 'Retention Benefits']},
    {'id': 3, 'title': 'Physicians', 'description': 'Partner with us for reliable patient diagnostics.', 'icon_name': 'Stethoscope', 'link': '/physicians', 'features': ['How to Order & Custom Panels', 'Automated Results Delivery', 'LIS Integration', 'Physician Portal Login']},
    {'id': 4, 'title': 'Assisted Living', 'description': 'On-site laboratory services for your facilities.', 'icon_name': 'Home', 'link': '/assisted-living-testing', 'features': ['Recurring Rounds Scheduling', 'Roster Management', 'Mobile Collection Workflow', 'LIS Routing & Portal']},
    {'id': 5, 'title': 'Mobile Phlebotomy', 'description': 'We bring the lab to your home or office.', 'icon_name': 'Truck', 'link': '/mobile-phlebotomy', 'features': ['Service Area Map', 'Pricing & Travel Fees', 'What to Expect', 'Book Home Draw']},
    {'id': 6, 'title': 'Non-Profits', 'description': 'Special programs and discounts for community orgs.', 'icon_name': 'HeartHandshake', 'link': '/community-programs', 'features': ['Sponsored Screening Events', 'Partnership Application', 'Affiliate Fundraising Tie-ins']},
    {'id': 7, 'title': 'Diagnostics Validation', 'description': 'Early biomarker validation and testing.', 'icon_name': 'Microscope', 'link': '/early-diagnostics', 'features': ['Feasibility & Analytical Testing', 'Pilot Clinical Testing Pathway', 'Submit NDA & Technology', 'Project Tracker Portal']},
    {'id': 8, 'title': 'Research Central Lab', 'description': 'Comprehensive clinical trial lab services.', 'icon_name': 'Dna', 'link': '/research-central-lab', 'features': ['Collection & Shipping Support', 'Biorepository Tracking', 'Academic Collaboration', 'Request Quote Portal']},
]

TESTIMONIALS_LIST = [
    {'id': 1, 'author_name': 'Sarah Jenkins', 'content': 'The mobile phlebotomy service is a game changer! The nurse arrived on time, was extremely professional, and I got my results the next morning without ever leaving my house.', 'rating': 5, 'is_featured': True},
]

POPULAR_PANELS_LIST = [
    {'id': 1, 'name': 'Annual Health Check', 'icon_name': 'Activity', 'price': '150.00', 'link': '/tests'},
    {'id': 2, 'name': 'Comprehensive Metabolic', 'icon_name': 'Droplets', 'price': '45.00', 'link': '/tests'},
    {'id': 3, 'name': 'Advanced Thyroid Panel', 'icon_name': 'AlertCircle', 'price': '85.00', 'link': '/tests'},
    {'id': 4, 'name': "Women's Health Profile", 'icon_name': 'Heart', 'price': '199.00', 'link': '/tests'},
    {'id': 5, 'name': 'Complete STD Screening', 'icon_name': 'ShieldCheck', 'price': '130.00', 'link': '/tests'},
    {'id': 6, 'name': 'Nutrients & Vitamins', 'icon_name': 'Zap', 'price': '110.00', 'link': '/tests'},
]

RESEARCH_SERVICES = [
    {'id': 1, 'title': 'Sample Collection & Processing', 'description': 'Multi-site specimen collection with standardized processing protocols.', 'icon_name': 'FlaskConical'},
    {'id': 2, 'title': 'Cold Chain Logistics', 'description': 'Temperature-controlled shipping and chain-of-custody documentation.', 'icon_name': 'Truck'},
    {'id': 3, 'title': 'Data Management', 'description': 'Secure data capture, EDC integration, and regulatory-compliant reporting.', 'icon_name': 'Database'},
    {'id': 4, 'title': 'Regulatory Compliance', 'description': 'GCP, GLP, and CLIA-compliant testing workflows for clinical trials.', 'icon_name': 'ShieldCheck'},
]

BIOREPOSITORY_STATS = [
    {'id': 1, 'stat_label': 'Uptime & Reliability', 'stat_value': '99.99%', 'description': 'Redundant power and monitoring systems.'},
    {'id': 2, 'stat_label': 'Sample Capacity', 'stat_value': '500K+', 'description': 'Ultra-low temperature storage for biospecimens.'},
    {'id': 3, 'stat_label': 'Active Studies', 'stat_value': '120+', 'description': 'Concurrent clinical trial support.'},
    {'id': 4, 'stat_label': 'Turnaround', 'stat_value': '< 24h', 'description': 'Expedited processing for priority studies.'},
]

RESEARCH_COLLABORATIONS = [
    {'id': 1, 'title': 'University Partnerships', 'description': 'Joint research programs with leading academic institutions.', 'icon_name': 'GraduationCap'},
    {'id': 2, 'title': 'Publication Support', 'description': 'Assistance with manuscript preparation and peer review submissions.', 'icon_name': 'BookOpen'},
    {'id': 3, 'title': 'Grant Collaboration', 'description': 'Sub-award capable laboratory partner for NIH and NSF funded projects.', 'icon_name': 'Award'},
]

# --- Research Portal Core Data ---
RESEARCH_USERS = [
    {
        'email': 'research@musb.com',
        'password': 'research2026',
        'name': 'Dr. Aris Thorne',
        'role': 'admin',
        'institution': 'MusB Central Research'
    },
    {
        'email': 'lab-pi@musb.com',
        'password': 'research2026',
        'name': 'Prof. Elena Vance',
        'role': 'client',
        'institution': 'Black Mesa Diagnostics'
    }
]

MOCK_STUDIES = [
    {
        'study_id': 'STUDY-ALPHA-9',
        'title': 'Viral Load Longitudinal Analysis',
        'sponsor': 'NIH / NIAID',
        'status': 'Active',
        'pi': 'Dr. Aris Thorne',
        'created_at': '2026-01-15'
    },
    {
        'study_id': 'STUDY-OMEGA-4',
        'title': 'Biomarker Validation for Pan-Cancer',
        'sponsor': 'Black Mesa Diagnostics',
        'status': 'Pending Review',
        'pi': 'Prof. Elena Vance',
        'created_at': '2026-03-10'
    }
]

MOCK_SAMPLES = [
    {'barcode': 'MUSB-999-TR', 'type': 'Whole Blood', 'study_id': 'STUDY-ALPHA-9', 'status': 'Received', 'location': 'Freezer-B2'},
    {'barcode': 'MUSB-121-PL', 'type': 'Plasma', 'study_id': 'STUDY-ALPHA-9', 'status': 'Processing', 'location': 'Centrifuge-01'},
    {'barcode': 'MUSB-443-SR', 'type': 'Serum', 'study_id': 'STUDY-OMEGA-4', 'status': 'Stored', 'location': 'Freezer-A1'},
]

def seed():
    db = get_db()
    
    # Mapping data to the new unified collection names
    collections_data = {
        'offers': MOCK_OFFERS,
        'test_categories': MOCK_CATEGORIES,
        'lab_tests': MOCK_TESTS,
        'hero_content': HERO_CONTENT,
        'services': SERVICES_LIST,
        'testimonials': TESTIMONIALS_LIST,
        'popular_panels': POPULAR_PANELS_LIST,
        'phlebotomists': [
            {'id': 'PHLEB-01', 'name': 'Sarah J.', 'email': 'sarah@musb.com', 'password': 'MusB@Phleb#2026', 'status': 'Active', 'zone': 'Manhattan'},
            {'id': 'PHLEB-02', 'name': 'Mike R.', 'email': 'mike@musb.com', 'password': 'MusB@Phleb#2026', 'status': 'On Break', 'zone': 'Brooklyn'},
            {'id': 'PHLEB-03', 'name': 'Eli W.', 'email': 'eli@musb.com', 'password': 'MusB@Phleb#2026', 'status': 'Offline', 'zone': 'Queens'}
        ],
        'appointments': [
            {
                'id': 'APP-901',
                'patient_id': 'PAT-001',
                'patient': 'A. Smith',
                'initials': 'AS',
                'age': 45,
                'gender': 'M',
                'time': '09:30 AM',
                'address': '123 Park Ave, New York, NY',
                'addr': '123 Park Ave, NY',
                'status': 'Pending',
                'associated_facility': 'Manhattan Health',
                'doctor': 'Dr. Aris Thorne',
                'instructions': 'Fasting required for 12 hours. Use butterfly needle.',
                'specimens': ['CBC', 'Metabolic Panel', 'Vitamin D'],
                'payment_status': 'Paid'
            },
            {
                'id': 'APP-902',
                'patient_id': 'PAT-002',
                'patient': 'B. Jones',
                'initials': 'BJ',
                'age': 32,
                'gender': 'F',
                'time': '11:00 AM',
                'address': '456 Broadway, New York, NY',
                'addr': '456 Broadway, NY',
                'status': 'Pending',
                'associated_facility': 'Broadway Clinic',
                'doctor': 'Dr. Elena Vance',
                'instructions': 'Patient has restricted mobility.',
                'specimens': ['Lipid Profile', 'Thyroid Panel'],
                'payment_status': 'Pending'
            }
        ], 
        'newsletter_subscribers': [],
        'research_services': RESEARCH_SERVICES,
        'biorepository_info': BIOREPOSITORY_STATS,
        'research_collaborations': RESEARCH_COLLABORATIONS,
        'research_quotes': [],
        'research_subscriptions': [],
        'research_users': RESEARCH_USERS,
        'research_studies': MOCK_STUDIES,
        'research_samples': MOCK_SAMPLES
    }
    
    print("🌱 [MONGODB] Seeding project metadata...")
    for collection_name, data in collections_data.items():
        collection = db[collection_name]
        # Clear existing data to avoid duplicates
        collection.delete_many({})
        if data:
            collection.insert_many(data)
            print(f"✅ [MONGO] Seeded {len(data)} items into '{collection_name}'")
        else:
            print(f"📁 [MONGO] Collection '{collection_name}' initialized (empty)")
    
    print("✨ Unified MongoDB Seeding complete!")

if __name__ == "__main__":
    seed()
