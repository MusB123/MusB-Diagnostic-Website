import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ArrowRight, User, Briefcase, Stethoscope, Home as HomeIcon, 
  Truck, HeartHandshake, Microscope, Dna, ShieldCheck, 
  Award, CheckCircle, Activity, Droplets, Heart, 
  AlertCircle, Zap, Star, Users, Quote, Mail, Clock, Share2, Loader2
} from 'lucide-react';
import { homeAPI } from '../../services/api';
import { motion } from 'framer-motion';
import './Home.css';
import './DynamicOffers.css';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [heroData, setHeroData] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [popularPanels, setPopularPanels] = useState([]);
  const [offersData, setOffersData] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ loading: false, message: '', error: false });
  const [loading, setLoading] = useState(true);
  const [flippedIdx, setFlippedIdx] = useState(null);

  // Slideshow indices for each offer type
  const [seasonalIdx, setSeasonalIdx] = useState(0);
  const [monthlyIdx, setMonthlyIdx] = useState(0);
  const [weeklyIdx, setWeeklyIdx] = useState(0);



  const fetchData = React.useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [heroRes, servicesRes, testimonialsRes, panelsRes, offersRes] = await Promise.all([
        homeAPI.getHero(),
        homeAPI.getServices(),
        homeAPI.getTestimonials(),
        homeAPI.getPopularPanels(),
        homeAPI.getOffers()
      ]);

      if (heroRes.ok) setHeroData(heroRes.data[0]);
      if (servicesRes.ok) setServices(servicesRes.data);
      if (testimonialsRes.ok) setTestimonials(testimonialsRes.data);
      if (panelsRes.ok) setPopularPanels(panelsRes.data);
      if (offersRes.ok) setOffersData(offersRes.data);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tests?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus({ loading: true, message: '', error: false });
    const res = await homeAPI.subscribeNewsletter(newsletterEmail);
    if (res.ok) {
      setNewsletterStatus({ loading: false, message: res.data.message, error: false });
      setNewsletterEmail('');
    } else {
      setNewsletterStatus({ loading: false, message: 'Subscription failed. Please try again.', error: true });
    }
  };

  const getIcon = (iconName) => {
    const icons = { User, Briefcase, Stethoscope, Home: HomeIcon, Truck, HeartHandshake, Microscope, Dna, Activity, Droplets, AlertCircle, Heart, Zap };
    const IconComp = icons[iconName] || Activity;
    return <IconComp />;
  };

  // Group offers by type for the slideshow
  const seasonalOffers = useMemo(() => offersData.filter(o => o.offer_type === 'Seasonal'), [offersData]);
  const monthlyOffers = useMemo(() => offersData.filter(o => o.offer_type === 'Monthly'), [offersData]);
  const weeklyOffers = useMemo(() => offersData.filter(o => o.offer_type === 'Weekly'), [offersData]);

  // Auto-rotate slideshows
  useEffect(() => {
    if (seasonalOffers.length <= 1) return;
    const timer = setInterval(() => {
      setSeasonalIdx(prev => (prev + 1) % seasonalOffers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [seasonalOffers.length]);

  useEffect(() => {
    if (monthlyOffers.length <= 1) return;
    const timer = setInterval(() => {
      setMonthlyIdx(prev => (prev + 1) % monthlyOffers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [monthlyOffers.length]);

  useEffect(() => {
    if (weeklyOffers.length <= 1) return;
    const timer = setInterval(() => {
      setWeeklyIdx(prev => (prev + 1) % weeklyOffers.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [weeklyOffers.length]);

  const SLIDE_CONFIG = {
    Seasonal: {
      gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 50%, #34d399 100%)',
      icon: <ShieldCheck size={18} />,
      subtitle: 'Specialized panels designed for current health needs.',
      cta: 'Explore Seasonal Offers',
      emoji: '🌿',
    },
    Monthly: {
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #e11d48 50%, #fb7185 100%)',
      icon: <CheckCircle size={18} />,
      subtitle: 'Best value for routine checkups.',
      cta: 'View Bundle',
      emoji: '🔥',
    },
    Weekly: {
      gradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #60a5fa 100%)',
      icon: <Zap size={18} fill="currentColor" />,
      subtitle: 'Up to 30% off top diagnostic tests.',
      cta: 'Claim Deal',
      emoji: '⚡',
    },
  };

  // Render a single slideshow card
  const renderSlideCard = (offersList, currentIdx, setIdx, type, className) => {
    const config = SLIDE_CONFIG[type];
    const offer = offersList[currentIdx];

    return (
      <div className={`offer-card-new ${className}`}>
        {/* Gradient background instead of images */}
        <div className="offer-card-bg" style={{ background: config.gradient }}>
          <div className="offer-card-bg-pattern"></div>
          {/* Decorative shapes */}
          <div className="offer-deco offer-deco-1"></div>
          <div className="offer-deco offer-deco-2"></div>
          <div className="offer-deco offer-deco-3"></div>
        </div>

        <div className="offer-overlay">
          <div className="offer-overlay-top">
            <span className="offer-badge-new">{config.emoji} {type} {type === 'Monthly' ? 'Bundle' : type === 'Seasonal' ? 'Special' : 'Offer'}</span>
            {offersList.length > 1 && (
              <div className="offer-slide-counter">
                {currentIdx + 1}/{offersList.length}
              </div>
            )}
          </div>

          <div className="offer-details-bottom">
            {/* Slideshow content with fade transition */}
            <div className="offer-slide-content" key={offer?.id || currentIdx}>
              <h3 className="offer-title-new">
                {offer?.title || `${type} Health Deal`}
              </h3>
              {offer && (
                <div className="offer-slide-price">
                  <span className="offer-slide-discounted">${offer.discounted_price}</span>
                  <span className="offer-slide-original">${offer.original_price}</span>
                  <span className="offer-slide-save">
                    Save ${(parseFloat(offer.original_price || 0) - parseFloat(offer.discounted_price || 0)).toFixed(0)}
                  </span>
                </div>
              )}
              <p className="offer-subtitle-new">
                {config.icon} {offer?.category ? `${offer.category} — ` : ''}{config.subtitle}
              </p>
            </div>

            <div className="offer-slide-bottom">
              <Link to="/offers" className="offer-link-new" onClick={(e) => e.stopPropagation()}>
                {config.cta} <div className="offer-arrow"><ArrowRight size={18}/></div>
              </Link>

              {/* Navigation dots */}
              {offersList.length > 1 && (
                <div className="offer-dots">
                  {offersList.map((_, i) => (
                    <button
                      key={i}
                      className={`offer-dot ${i === currentIdx ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page fade-in">
      {loading && (
        <div className="loading-overlay">
          <Loader2 className="animate-spin text-primary" size={48}/>
        </div>
      )}

      {/* Dynamic Offers Slideshow Section */}
      <section className="dynamic-offers-container">
        <div className="dynamic-offers-grid">
          {/* Seasonal Slot (Bigger) */}
          {renderSlideCard(
            seasonalOffers.length > 0 ? seasonalOffers : [{ title: 'Seasonal Health Deals', offer_type: 'Seasonal' }],
            seasonalOffers.length > 0 ? seasonalIdx % seasonalOffers.length : 0,
            setSeasonalIdx,
            'Seasonal',
            'seasonal'
          )}

          {/* Monthly Slot */}
          {renderSlideCard(
            monthlyOffers.length > 0 ? monthlyOffers : [{ title: 'Monthly Health Bundles', offer_type: 'Monthly' }],
            monthlyOffers.length > 0 ? monthlyIdx % monthlyOffers.length : 0,
            setMonthlyIdx,
            'Monthly',
            'monthly'
          )}

          {/* Weekly Slot */}
          {renderSlideCard(
            weeklyOffers.length > 0 ? weeklyOffers : [{ title: 'Weekly Essentials', offer_type: 'Weekly' }],
            weeklyOffers.length > 0 ? weeklyIdx % weeklyOffers.length : 0,
            setWeeklyIdx,
            'Weekly',
            'weekly'
          )}
        </div>
      </section>

      {/* Section A: Hero + Quick Actions */}
      <section className="home-hero">
        <div className="hero-background"></div>
        <div className="home-hero-container">
          <div className="home-hero-main">
            <div className="hero-badge-modern">
              <span className="live-dot"></span> Next-Gen Diagnostics
            </div>
            <h1 className="home-hero-title">
              Affordable Lab Testing + Mobile Collections <br />
              <span className="text-highlight">+ Research-Grade Quality</span>
            </h1>
            <p className="home-hero-subtitle">
              {heroData?.subtitle || 'Self-pay, employer plans, physicians, facilities, research & biomarker validation.'}
            </p>
            
            <div className="home-hero-actions">
              <Link to="/tests" className="btn btn-primary btn-lg">
                Browse Tests <ArrowRight size={20} />
              </Link>
              <Link to="/book" className="btn btn-secondary btn-lg">
                Book Appointment
              </Link>
              <Link to="/offers" className="btn btn-outline btn-lg">
                View Offers
              </Link>
            </div>

            <div className="hero-search-widget glass">
              <form onSubmit={handleSearch}>
                <Search className="search-icon" size={24} />
                <input 
                  type="text" 
                  placeholder="Type to search for tests (e.g., Thyroid, Vitamin D)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Search</button>
              </form>
            </div>
          </div>


        </div>
      </section>


      {/* Section C: Live Offers Carousel */}
      <section className="section offers-section">
        <div className="offers-header">
          <h2 className="section-title">Live Health Offers</h2>
          <p className="section-subtitle">Exclusive weekly, monthly, and seasonal bundles.</p>
        </div>

        <div className="offers-carousel-wrap">
          <button
            className="offers-carousel-arrow left"
            onClick={() => {
              const track = document.getElementById('offers-carousel-track');
              if (track) track.scrollBy({ left: -380, behavior: 'smooth' });
            }}
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div className="offers-carousel-track" id="offers-carousel-track">
            {offersData.map((offer, idx) => (
              <div key={idx} className={`offer-tile deal-${(offer.offer_type ||'weekly').toLowerCase()}`}>
                <div className="offer-tag">{offer.offer_type} Deal</div>
                <h3>{offer.title}</h3>
                
                <div className="offer-price">
                  {offer.original_price && <span className="price-strike">${offer.original_price}</span>}
                  <span className="price-new">${offer.discounted_price}</span>
                  {offer.original_price && (
                    <span className="save-badge">
                      Save ${(parseFloat(offer.original_price) - parseFloat(offer.discounted_price)).toFixed(0)}
                    </span>
                  )}
                </div>

                <ul className="offer-includes">
                  {(offer.includes || []).map((item, i) => (
                     <li key={i}><CheckCircle size={16} className="check-icon"/> {item}</li>
                  ))}
                </ul>

                <div className="offer-timer">
                  <span className="live-pulse"></span>
                  <Clock size={14} /> 
                  <span>Ends in: <strong>{offer.time_left || 'Limited Time'}</strong></span>
                </div>

                <div className="offer-actions">
                  <Link to="/book" className="btn btn-white btn-sm">Book Deal</Link>
                  <button className="btn-icon" title="Share Offer"><Share2 size={18}/></button>
                </div>
              </div>
            ))}
            {offersData.length === 0 && <p className="full-width text-center">Loading live offers...</p>}
          </div>

          <button
            className="offers-carousel-arrow right"
            onClick={() => {
              const track = document.getElementById('offers-carousel-track');
              if (track) track.scrollBy({ left: 380, behavior: 'smooth' });
            }}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>

        <div className="offers-view-all">
          <Link to="/offers" className="btn btn-outline">
            View All Offers <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      <section className="section bg-light-alt how-it-works">
        <h2 className="section-title">Seamless Testing Experience</h2>
        <div className="steps-container">
          {services.map((service, idx) => (
            <React.Fragment key={idx}>
              <div 
                className={`step-card-flip ${flippedIdx === idx ? 'is-flipped' : ''}`}
                onClick={() => setFlippedIdx(flippedIdx === idx ? null : idx)}
              >
                <div className="step-card-inner">
                  {/* Front Side */}
                  <div className="step-card-front">
                    <div className="step-number">{idx + 1}</div>
                    <div className="step-icon">{getIcon(service.icon_name)}</div>
                    <h3>{service.title}</h3>
                    <div className="flip-hint">Click to learn more</div>
                  </div>
                  
                  {/* Back Side */}
                  <div className="step-card-back">
                    <div className="step-number-back">{idx + 1}</div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <Link to={service.link || '/tests'} className="btn-link-white" onClick={(e) => e.stopPropagation()}>
                      View Service <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
          {services.length === 0 && <p>Loading services...</p>}
        </div>
      </section>

      {/* Section E: Trust & Compliance */}
      <section className="trust-section">
        <div className="trust-content">
          <div className="trust-text">
            <h2>Uncompromising Quality & Compliance</h2>
            <p>Your health data is secure, and our results are research-grade accurate.</p>
            <ul className="trust-list">
              <li><CheckCircle className="text-primary"/> <strong>HIPAA Compliant</strong> - Total privacy and data security.</li>
              <li><CheckCircle className="text-primary"/> <strong>Fast Turnaround</strong> - 24-48 hours for standard panels.</li>
              <li><CheckCircle className="text-primary"/> <strong>Precision Assured</strong> - State-of-the-art analyzers.</li>
            </ul>
          </div>
          <div className="trust-badges">
            <div className="badge-item glass">
              <ShieldCheck size={40} className="text-primary" />
              <span>CLIA Certified</span>
            </div>
            <div className="badge-item glass">
              <Award size={40} className="text-primary" />
              <span>COLA Accredited</span>
            </div>
            <div className="badge-item glass">
              <Activity size={40} className="text-primary" />
              <span>CAP Proficiency</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: Popular Panels */}
      <section className="section panels-section bg-light-alt">
        <div className="section-header text-center" style={{ marginBottom: '3rem' }}>
          <h2 className="section-title">Popular Test Panels</h2>
          <p className="section-subtitle">Comprehensive health checks trusted by thousands.</p>
        </div>
        <div className="panels-grid">
          {popularPanels.map((panel, i) => (
            <div key={i} className="panel-card">
              <div className="panel-card-icon-wrap">
                <div className="panel-card-icon">{getIcon(panel.icon_name)}</div>
                <h4>{panel.name || panel.title || 'Diagnostic Panel'}</h4>
              </div>
              <p className="panel-desc">
                {panel.description || 'Comprehensive diagnostic testing for early detection and absolute peace of mind.'}
              </p>
              <div className="panel-bot">
                <span className="panel-price">${parseFloat(panel.price).toFixed(2)}</span>
                <Link to={panel.link || '/tests'} className="btn-link">View Details <ArrowRight size={16}/></Link>
              </div>
            </div>
          ))}
        </div>
        <div className="center-btn-wrap" style={{ marginTop: '3rem' }}>
          <Link to="/tests" className="btn btn-outline btn-lg">Explore All Panels <ArrowRight size={20} /></Link>
        </div>
      </section>

      {/* Section G: Social proof + community */}
      <section className="section community-section">
        <div className="community-blob blob-1"></div>
        <div className="community-blob blob-2"></div>

        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Trusted by the Community
        </motion.h2>

        <div className="community-grid">
          <motion.div 
            className="testimonials"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Quote className="quote-icon" size={40} />
            {testimonials.length > 0 ? (
              <>
                <p className="testimonial-text">"{testimonials[0].content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar"><User size={28}/></div>
                  <div className="testimonial-info">
                    <strong>{testimonials[0].author_name}</strong>
                    <div className="stars">
                      {[...Array(testimonials[0].rating)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p>No testimonials available.</p>
            )}
          </motion.div>

          <motion.div 
            className="community-heroes"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="heroes-icon"><Users size={32} /></div>
            <h3>Community Heroes</h3>
            <p>
              Supporting non-profits and study participants across the nation. Over <strong>10,000+</strong> subsidized tests provided for underserved communities and clinical research trials.
            </p>
            <Link to="/contact" className="btn btn-primary">Join Our Mission</Link>
          </motion.div>
        </div>
      </section>

      {/* Section H: Newsletter + Blog preview */}
      <section className="newsletter-section">
        <div className="newsletter-card glass">
          <div className="ns-icon"><Mail size={48} /></div>
          <h2>Monthly Health Offers & Tips</h2>
          <p>Subscribe to stay updated with our newest test panels, seasonal discounts, and wellness advice.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              disabled={newsletterStatus.loading}
            />
            <button type="submit" className="btn btn-secondary" disabled={newsletterStatus.loading}>
              {newsletterStatus.loading ? <Loader2 className="animate-spin" size={20}/> : 'Subscribe Now'}
            </button>
            {newsletterStatus.message && (
              <p className={`newsletter-msg ${newsletterStatus.error ? 'error' : 'success'}`}>
                {newsletterStatus.message}
              </p>
            )}
          </form>
        </div>
      </section>

    </div>
  );
};

export default Home;