import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  Heart, Shield, DollarSign, Clock, CheckCircle, Search,
  ShoppingCart, Calendar, ArrowRight, CreditCard,
  ChevronDown, ChevronUp, Droplet, Loader2, MessageCircle,
  BadgePercent, Users, Sparkles, AlertCircle
} from 'lucide-react';
import { catalogAPI } from '../../services/api';
import './SelfPay.css';

const FAQ_DATA = [
  {
    q: 'Do I need insurance to order tests?',
    a: 'Absolutely not. MusB Diagnostics is built for self-pay patients. No insurance, no referral, no hidden fees — just transparent pricing you can see upfront before you book.'
  },
  {
    q: 'How do I get my results?',
    a: 'Results are delivered securely to your email and available in your patient portal within 24–48 hours for most tests. Some specialized panels may take up to 5 business days.'
  },
  {
    q: 'Can I use my HSA/FSA card?',
    a: 'Yes! We accept HSA and FSA debit cards for all lab tests. Diagnostic lab tests are qualified medical expenses under most HSA/FSA programs.'
  },
  {
    q: 'Is a doctor\'s order required?',
    a: 'No. You can order any test directly. Our CLIA-certified lab processes your order, and a licensed physician reviews your results before delivery.'
  },
  {
    q: 'What if I need help choosing the right test?',
    a: 'Our team is here to help. Use the chat button on any test card, or contact us directly. We can recommend the right panel based on your health goals.'
  },
  {
    q: 'Are there any hidden fees?',
    a: 'Never. The price you see is the price you pay. No facility fees, no surprise bills, no insurance markups. We believe in complete transparency.'
  },
];

const BENEFITS = [
  { icon: <DollarSign size={28}/>, title: 'Transparent Pricing', desc: 'No hidden fees. The price you see is the price you pay.' },
  { icon: <Shield size={28}/>, title: 'No Insurance Needed', desc: 'Skip the referrals and pre-approvals. Order directly.' },
  { icon: <Clock size={28}/>, title: '24–48h Results', desc: 'Fast, accurate results delivered to your inbox.' },
  { icon: <CreditCard size={28}/>, title: 'HSA/FSA Accepted', desc: 'Use your health savings or flexible spending cards.' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Choose Your Tests', desc: 'Browse our catalog and add tests to your cart.' },
  { step: 2, title: 'Book & Pay Online', desc: 'Schedule a collection time that works for you.' },
  { step: 3, title: 'Get Tested', desc: 'Visit a collection site or request mobile phlebotomy.' },
  { step: 4, title: 'Receive Results', desc: 'Secure results in 24–48 hours via your portal.' },
];

const SelfPayPatients = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { addToCart } = useCart();

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const params = { search: searchQuery };
    const res = await catalogAPI.getTests(params);
    if (res.ok) {
      setTests(res.data);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTests(), 300);
    
    // Expert fix: Revalidate data when window gains focus (tabs switch)
    window.addEventListener('focus', fetchTests);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', fetchTests);
    };
  }, [fetchTests]);

  const handleAddToCart = (test) => {
    addToCart({
      id: test.id,
      title: test.title,
      category: test.category_name,
      price: parseFloat(test.price),
      sampleType: test.sample_type,
      turnaround: test.turnaround,
    });
    setAddedId(test.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const displayTests = showAll ? tests : tests.slice(0, 6);

  return (
    <div className="sp-page fade-in">

      {/* ====== HERO ====== */}
      <section className="sp-hero">
        <div className="sp-hero-shapes">
          <div className="sp-shape sp-shape-1"></div>
          <div className="sp-shape sp-shape-2"></div>
          <div className="sp-shape sp-shape-3"></div>
        </div>
        <div className="sp-hero-content">
          <div className="sp-hero-badge">
            <Heart size={16} fill="currentColor"/> Self-Pay Patients
          </div>
          <h1 className="sp-hero-title">
            Affordable Lab Testing.<br/>
            <span className="sp-hero-accent">No Insurance Required.</span>
          </h1>
          <p className="sp-hero-subtitle">
            Take control of your health with direct-access lab testing. Transparent pricing, 
            no referrals, no surprise bills — just quality diagnostics at fair prices.
          </p>
          <div className="sp-hero-actions">
            <a href="#sp-tests" className="btn btn-primary btn-lg">
              Browse Tests <ArrowRight size={18}/>
            </a>
            <Link to="/book" className="btn btn-outline-white btn-lg">
              Book Appointment
            </Link>
          </div>
          <div className="sp-hero-trust">
            <div className="sp-trust-item"><CheckCircle size={16}/> CLIA Certified</div>
            <div className="sp-trust-item"><CheckCircle size={16}/> HIPAA Compliant</div>
            <div className="sp-trust-item"><CheckCircle size={16}/> Physician Reviewed</div>
          </div>
        </div>
      </section>

      {/* ====== BENEFITS STRIP ====== */}
      <section className="sp-benefits">
        <div className="sp-benefits-inner">
          {BENEFITS.map((b, i) => (
            <div key={i} className="sp-benefit-card">
              <div className="sp-benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="sp-how-section">
        <h2 className="sp-section-title">How Self-Pay Testing Works</h2>
        <p className="sp-section-subtitle">Four simple steps to take charge of your health — no insurance paperwork involved.</p>
        <div className="sp-how-grid">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={i} className="sp-how-card">
              <div className="sp-how-number">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && <div className="sp-how-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* ====== PRICING PROMISE ====== */}
      <section className="sp-promise">
        <div className="sp-promise-inner">
          <div className="sp-promise-icon"><BadgePercent size={48}/></div>
          <div className="sp-promise-text">
            <h2>Our Self-Pay Pricing Promise</h2>
            <p>
              We believe healthcare costs should never be a mystery. Every test on MusB Diagnostics shows 
              the <strong>exact price you'll pay</strong> — no facility fees, no processing charges, no insurance markups. 
              Our prices are typically <strong>60–80% lower</strong> than hospital pricing.
            </p>
          </div>
          <Link to="/offers" className="sp-promise-cta btn btn-primary btn-lg">
            <Sparkles size={18}/> View Current Deals
          </Link>
        </div>
      </section>

      {/* ====== TESTS CATALOG ====== */}
      <section className="sp-tests-section" id="sp-tests">
        <h2 className="sp-section-title">Popular Self-Pay Tests</h2>
        <p className="sp-section-subtitle">Most-ordered tests by self-pay patients. All prices are final — no surprises.</p>

        {/* Search */}
        <div className="sp-search-wrap">
          <Search size={20} className="sp-search-icon"/>
          <input
            type="text"
            className="sp-search-input"
            placeholder="Search tests by name or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Test Grid */}
        <div className="sp-tests-grid">
          {loading ? (
            <div className="sp-loading">
              <Loader2 className="sp-spin" size={48}/>
              <p>Loading tests...</p>
            </div>
          ) : displayTests.length > 0 ? displayTests.map(test => (
            <div key={test.id} className="sp-test-card">
              <div className="sp-test-top">
                <span className="sp-test-category">{test.category_name}</span>
                <div className="sp-test-price">
                  <span className="sp-price-dollar">$</span>
                  <span className="sp-price-amount">{parseFloat(test.price).toFixed(0)}</span>
                </div>
              </div>
              <h3 className="sp-test-title">{test.title}</h3>
              <p className="sp-test-desc">{test.description}</p>
              <div className="sp-test-meta">
                <span><Droplet size={14}/> {test.sample_type}</span>
                {test.preparation && <span><AlertCircle size={14}/> {test.preparation}</span>}
                <span><Clock size={14}/> {test.turnaround}</span>
              </div>
              <div className="sp-test-actions">
                <button
                  className={`sp-cart-btn ${addedId === test.id ? 'added' : ''}`}
                  onClick={() => handleAddToCart(test)}
                >
                  <ShoppingCart size={16}/> {addedId === test.id ? 'Added!' : 'Add to Cart'}
                </button>
                <Link to={`/book?test=${test.id}`} className="sp-book-btn">
                  <Calendar size={16}/> Book Now
                </Link>
                <button className="sp-chat-btn" title="Ask a question">
                  <MessageCircle size={16}/>
                </button>
              </div>
            </div>
          )) : (
            <div className="sp-empty">
              <Search size={40}/>
              <h3>No tests found</h3>
              <p>Try a different search term.</p>
            </div>
          )}
        </div>

        {/* View More / View All */}
        {!loading && tests.length > 6 && (
          <div className="sp-view-toggle">
            {!showAll ? (
              <button className="btn btn-outline sp-view-btn" onClick={() => setShowAll(true)}>
                View All {tests.length} Tests <ArrowRight size={18}/>
              </button>
            ) : (
              <button className="btn btn-outline sp-view-btn" onClick={() => setShowAll(false)}>
                Show Less
              </button>
            )}
          </div>
        )}

        <div className="sp-catalog-link">
          <p>Want advanced filtering? Visit our full <Link to="/test-catalog">Test Catalog</Link> with category, sample type, and price filters.</p>
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="sp-faq-section">
        <h2 className="sp-section-title">Frequently Asked Questions</h2>
        <p className="sp-section-subtitle">Everything self-pay patients need to know.</p>
        <div className="sp-faq-list">
          {FAQ_DATA.map((faq, i) => (
            <div key={i} className={`sp-faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="sp-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {openFaq === i && (
                <div className="sp-faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ====== CTA BANNER ====== */}
      <section className="sp-cta-banner">
        <div className="sp-cta-inner">
          <Users size={40}/>
          <h2>Ready to Take Control of Your Health?</h2>
          <p>Join thousands of self-pay patients who trust MusB Diagnostics for affordable, quality lab testing.</p>
          <div className="sp-cta-actions">
            <Link to="/book" className="btn btn-primary btn-lg">Book Your Test Today</Link>
            <Link to="/offers" className="btn btn-outline-white btn-lg">View Offers</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SelfPayPatients;
