import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, Lock, X, CheckCircle, Loader2,
  Star, ChevronDown, Calendar, MapPin, Droplets, Building2, Users
} from 'lucide-react';
import './MobilePhlebotomy.css';
import PhlebotomistLogin from './Login.js';
import api from '../../api/api';

/* ── Static Data ──────────────────── */
const FEATURED_PHLEBS = [
  { id: 1, name: 'Jessica Rivera', initials: 'JR', rating: 4.9, draws: 1200, cert: 'ASCP Certified' },
  { id: 2, name: 'Marcus Thompson', initials: 'MT', rating: 4.8, draws: 860, cert: 'ASCP Certified' },
  { id: 3, name: 'Sarah Kim', initials: 'SK', rating: 5.0, draws: 540, cert: 'ASCP Certified' },
  { id: 4, name: 'David Chen', initials: 'DC', rating: 4.7, draws: 720, cert: 'NCA Certified' }
];

const TESTIMONIALS = [
  { id: 1, text: 'Clean, professional, and so much easier than visiting a clinic. The phlebotomist was at my door in 30 minutes!', author: 'Sarah J.', location: 'Manhattan, NY', stars: 5 },
  { id: 2, text: 'I was nervous about getting blood drawn at home, but the experience was outstanding. Will definitely use again.', author: 'Michael R.', location: 'Brooklyn, NY', stars: 5 },
  { id: 3, text: 'Having someone come to my elderly mother\'s home was a game-changer. Professional and caring service.', author: 'Linda P.', location: 'Queens, NY', stars: 5 }
];

const FAQ_DATA = [
  { q: 'What insurance do you accept?', a: 'We accept most major insurance plans including Blue Cross Blue Shield, Aetna, Cigna, UnitedHealthcare, and Medicare. Self-pay options are also available at competitive rates.' },
  { q: 'How should I prepare for a blood draw?', a: 'Preparation depends on the test ordered. For fasting tests, avoid food and drinks (except water) for 8-12 hours before your appointment. Stay hydrated. Your phlebotomist will confirm requirements upon arrival.' },
  { q: 'How long does it take to get results?', a: 'Most routine results are available within 24-48 hours through our secure patient portal. Specialty tests may take 3-7 business days. You will receive a notification when results are ready.' },
  { q: 'Can I choose my phlebotomist?', a: 'Yes! You can browse featured phlebotomists and select your preferred specialist during the booking process. All of our phlebotomists are nationally certified.' },
  { q: 'When will my card be charged?', a: 'Your card is only charged after the phlebotomist departs from your location and the service is completed. No upfront charges are applied at booking.' }
];
/* ── End Static Data ──────────────── */

const MobilePhlebotomy = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('idle');
  const [openFaq, setOpenFaq] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    alt_phone: '',
    address: ''
  });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/api/superadmin/catalog/tests/');
        setTests(res.data.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch tests", err);
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTests();
  }, []);

  const handleBookClick = (test) => {
    setSelectedTest(test);
    setIsBookingOpen(true);
    setBookingStatus('idle');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingStatus('submitting');
    try {
      await api.post('/api/bookings/', {
        ...formData,
        test_id: selectedTest.id,
        visit_type: 'home'
      });
      setBookingStatus('success');
      setTimeout(() => {
        setIsBookingOpen(false);
        setFormData({ fullName: '', phone: '', alt_phone: '', address: '' });
      }, 3000);
    } catch (err) {
      alert("Booking failed. Please ensure all fields are filled.");
      setBookingStatus('idle');
    }
  };

  return (
    <div className="phlebotomy-page fade-in">
      {/* ── Hero Section ── */}
      <section className="phleb-hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />
        </div>
        <motion.div
          className="phleb-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-badge-phleb">Mobile Blood Collection Service</div>
          <h1 className="phleb-hero-title">
            Book a Blood Draw <br />
            <span>at Home.</span>
          </h1>
          <p className="phleb-hero-subtitle">
            Skip the clinic. A certified phlebotomist arrives at your door with
            professional-grade equipment. Safe, convenient, and insurance-accepted.
          </p>
          <div className="hero-actions">
            <Link to="/portal/patient/book" className="btn btn-primary btn-lg">
              <Calendar size={20} /> Book Now
            </Link>
            <Link to="/portal/patient/login" className="btn btn-outline-white btn-lg">
              <Users size={20} /> Patient Portal
            </Link>
            <button
              className="btn btn-outline-white btn-lg"
              onClick={() => setIsLoginOpen(true)}
            >
              <Lock size={20} /> Staff Login
            </button>
            <Link to="/portal/phlebotomy-hub" className="btn btn-outline-white btn-lg">
              <Building2 size={20} /> Company Hub
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Service Stats ── */}
      <section className="phleb-stats glass">
        <div className="stats-container">
          <div className="stat-item">
            <h3>45+</h3>
            <p>Certified Phlebotomists</p>
          </div>
          <div className="stat-item">
            <h3>2k+</h3>
            <p>Monthly Mobile Phlebotomy</p>
          </div>
          <div className="stat-item">
            <h3>99.8%</h3>
            <p>Sample Integrity Rate</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Logistics Monitoring</p>
          </div>
        </div>
      </section>

      {/* ── How It Works (3 Steps) ── */}
      <section className="pp-hiw-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to lab-quality blood work at your location.</p>
        </motion.div>
        
        <motion.div 
          className="pp-hiw-grid"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            { num: 1, title: 'Schedule', desc: 'Choose your test, time, and location through our secure online booking system.', color: '#eef2ff', iconColor: '#6366f1', icon: <Calendar size={32} /> },
            { num: 2, title: 'Connect', desc: 'A certified phlebotomist is dispatched to your door with professional equipment.', color: '#ecfdf5', iconColor: '#10b981', icon: <MapPin size={32} /> },
            { num: 3, title: 'Results', desc: 'Access your research-grade results digitally within 24-48 hours.', color: '#fffbeb', iconColor: '#f59e0b', icon: <Droplets size={32} /> }
          ].map((s) => (
            <motion.div
              key={s.num}
              className="pp-hiw-card"
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              <div className="pp-hiw-step-num">{s.num}</div>
              <div className="pp-hiw-icon" style={{ background: s.color, color: s.iconColor }}>
                {s.icon}
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Test Selection ── */}
      <section id="test-selection" className="tests-grid-section">
        <div className="section-header">
          <h2 className="section-title">Select Your Test</h2>
          <p className="section-subtitle">Choose from our most popular mobile collection panels.</p>
        </div>

        {loadingTests ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <Loader2 className="animate-spin" size={48} color="#6366f1" />
          </div>
        ) : (
          <div className="test-phleb-grid">
            {tests.map((test) => (
              <motion.div
                key={test.id}
                className="test-phleb-card glass"
                whileHover={{ y: -5 }}
              >
                <h3>{test.title}</h3>
                <p className="text-sm" style={{ color: '#64748b', marginBottom: '1rem' }}>
                  {test.description || 'Comprehensive clinical analysis.'}
                </p>
                <div className="test-phleb-price">${parseFloat(test.price).toFixed(2)}</div>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => handleBookClick(test)}
                >
                  Book Now
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Phlebotomists ── */}
      <section className="pp-featured-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Featured Phlebotomists</h2>
          <p className="section-subtitle">Top-rated specialists ready to come to you.</p>
        </motion.div>
        <motion.div 
          className="pp-featured-grid"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {FEATURED_PHLEBS.map((p) => (
            <motion.div
              key={p.id}
              className="pp-featured-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="pp-featured-avatar">{p.initials}</div>
              <h4>{p.name}</h4>
              <div className="pp-featured-cert">
                <ShieldCheck size={12} /> {p.cert}
              </div>
              <div className="pp-featured-rating">
                <Star size={16} fill="#fbbf24" stroke="none" /> {p.rating}
              </div>
              <p className="pp-featured-draws">{p.draws.toLocaleString()} draws completed</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="pp-testimonials-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">What Our Patients Say</h2>
          <p className="section-subtitle">Real reviews from real patients.</p>
        </motion.div>
        <motion.div 
          className="pp-testimonials-grid"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.id}
              className="pp-testimonial-card"
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
            >
              <div className="pp-testimonial-stars">
                {Array.from({ length: t.stars }, (_, i) => (
                  <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" stroke="none" />
                ))}
              </div>
              <p className="pp-testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="pp-testimonial-author">
                <div className="pp-testimonial-author-avatar">
                  {t.author.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="pp-testimonial-author-info">
                  <h5>{t.author}</h5>
                  <p>{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="pp-faq-section">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about mobile phlebotomy.</p>
        </div>
        <div className="pp-faq-list">
          {FAQ_DATA.map((faq, idx) => (
            <div key={idx} className={`pp-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button className="pp-faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                {faq.q}
                <ChevronDown size={20} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p className="pp-faq-answer">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="phleb-cta">
        <div className="cta-wrapper glass">
          <h2>Bring the Lab to You Today</h2>
          <p>Professional, convenient, and reliable collections at your location.</p>
          <Link to="/portal/patient/book" className="btn btn-primary btn-lg mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Book Appointment <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Booking Modal ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isBookingOpen && (
            <motion.div
              key="booking-modal-overlay"
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsBookingOpen(false);
              }}
              style={{ zIndex: 999999 }}
            >
              <motion.div
                key="booking-modal-card"
                className="booking-modal-content"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="modal-close" onClick={() => setIsBookingOpen(false)}>
                  <X size={20} />
                </button>

                {bookingStatus === 'success' ? (
                  <div className="booking-success-anim">
                    <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                    <h2>Booking Received!</h2>
                    <p style={{ color: '#64748b' }}>Our team will review your request and assign a specialist shortly.</p>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Book Field Collection</h2>
                    <p style={{ color: '#64748b', fontWeight: 700, marginBottom: '1.5rem' }}>Test: {selectedTest?.title}</p>

                    <form onSubmit={handleSubmit} className="booking-form-grid">
                      <div className="form-field">
                        <label>Full Patient Name <span>*</span></label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          placeholder="e.g. John Doe"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-field">
                        <label>Primary Phone Number <span>*</span></label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          placeholder="e.g. +1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-field">
                        <label>Alternative Phone Number <span>*</span></label>
                        <input
                          type="tel"
                          name="alt_phone"
                          required
                          placeholder="Emergency / Alternate contact"
                          value={formData.alt_phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-field">
                        <label>Collection Address <span>*</span></label>
                        <textarea
                          name="address"
                          required
                          rows="3"
                          placeholder="Street, Suite, City, State, ZIP"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full mt-4"
                        disabled={bookingStatus === 'submitting'}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        {bookingStatus === 'submitting' ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <><ArrowRight size={20} /> Confirm Booking</>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Phlebotomist Login Modal ── */}
      <AnimatePresence>
        {isLoginOpen && (
          <PhlebotomistLogin
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobilePhlebotomy;
