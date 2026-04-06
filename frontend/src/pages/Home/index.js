import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ArrowRight, User, Briefcase, Stethoscope, Home as HomeIcon, 
  Truck, HeartHandshake, Microscope, Dna, ShieldCheck, 
  Award, CheckCircle, Activity, Droplets, Heart, 
  AlertCircle, Zap, Star, Users, Quote, Mail, Clock, Share2, Loader2
} from 'lucide-react';
import { homeAPI } from '../../services/api';
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


  const heroOffersList = offersData.length > 0 
    ? offersData.map(o => `${o.offer_type} Deal: ${o.title} - $${o.discounted_price}!`)
    : [
        "Weekly Deal: Essential Vitamin Profile - $69!",
        "Monthly Bundle: Complete Men's/Women's Health - $149!",
        "Seasonal Special: Allergy & Immunity Panel - $99!",
        "Limited Time: 45% Off All Wellness Packages!"
      ];



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [heroRes, servicesRes, testimonialsRes, panelsRes, offersRes] = await Promise.all([
          homeAPI.getHero(),
          homeAPI.getServices(),
          homeAPI.getTestimonials(),
          homeAPI.getPopularPanels(),
          homeAPI.getOffers() // This should be added to homeAPI or fetched from offersAPI
        ]);

        if (heroRes.ok) setHeroData(heroRes.data[0]);
        if (servicesRes.ok) setServices(servicesRes.data);
        if (testimonialsRes.ok) setTestimonials(testimonialsRes.data);
        if (panelsRes.ok) setPopularPanels(panelsRes.data);
        if (offersRes.ok) setOffersData(offersRes.data);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="home-page fade-in">
      {loading && (
        <div className="loading-overlay">
          <Loader2 className="animate-spin text-primary" size={48}/>
        </div>
      )}

      {/* Dynamic Offers Grid Section */}
      <section className="dynamic-offers-container">
        <div className="dynamic-offers-grid">
          {/* Seasonal Offer (Bigger) */}
          <Link to="/offers" className="offer-card-new seasonal">
            <img src="/images/seasonal_offer.webp" alt="Seasonal Offer" />
            <div className="offer-overlay">
              <span className="offer-badge-new">Seasonal Special</span>
              <div className="offer-details-bottom">
                <h3 className="offer-title-new">
                  {offersData.find(o => o.offer_type === 'Seasonal')?.title || 'Allergy & Immunity Season'}
                </h3>
                <p className="offer-subtitle-new">
                  <ShieldCheck size={18} /> Specialized panels designed for current health needs.
                </p>
                <div className="offer-link-new">
                  Explore Seasonal Offers <div className="offer-arrow"><ArrowRight size={18}/></div>
                </div>
              </div>
            </div>
          </Link>

          {/* Monthly Offer (Small) */}
          <Link to="/offers" className="offer-card-new monthly">
            <img src="/images/monthly_offer.webp" alt="Monthly Offer" />
            <div className="offer-overlay">
              <span className="offer-badge-new">Monthly Bundle</span>
              <div className="offer-details-bottom">
                <h3 className="offer-title-new">
                  {offersData.find(o => o.offer_type === 'Monthly')?.title || 'Comprehensive Health Bundle'}
                </h3>
                <p className="offer-subtitle-new">
                  <CheckCircle size={18} /> Best value for routine checkups.
                </p>
                <div className="offer-link-new">
                  View Bundle <div className="offer-arrow"><ArrowRight size={18}/></div>
                </div>
              </div>
            </div>
          </Link>

          {/* Weekly Offer (Small) */}
          <Link to="/offers" className="offer-card-new weekly">
            <img src="/images/weekly_offer.webp" alt="Weekly Offer" />
            <div className="offer-overlay">
              <span className="offer-badge-new">Weekly Offer</span>
              <div className="offer-details-bottom">
                <h3 className="offer-title-new">
                  {offersData.find(o => o.offer_type === 'Weekly')?.title || 'New Weekly Essentials'}
                </h3>
                <p className="offer-subtitle-new">
                  <Zap size={18} fill="currentColor" /> Up to 30% off top diagnostic tests.
                </p>
                <div className="offer-link-new">
                  Claim Deal <div className="offer-arrow"><ArrowRight size={18}/></div>
                </div>
              </div>
            </div>
          </Link>
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


      {/* Section C: Live Offers Strip */}
      <section className="section offers-section">
        <div className="offers-header">
          <h2 className="section-title">Live Health Offers</h2>
          <p className="section-subtitle">Exclusive weekly, monthly, and seasonal bundles.</p>
        </div>
        <div className="offers-grid">
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
      <section className="section panels-section">
        <h2 className="section-title">Popular Test Panels</h2>
        <div className="panels-grid">
          {popularPanels.map((panel, i) => (
            <div key={i} className="panel-card">
              <div className="panel-card-icon">{getIcon(panel.icon_name)}</div>
              <h4>{panel.name}</h4>
              <div className="panel-bot">
                <span className="panel-price">${panel.price}</span>
                <Link to={panel.link} className="btn-link">View Details <ArrowRight size={16}/></Link>
              </div>
            </div>
          ))}
        </div>
        <div className="center-btn-wrap">
          <Link to="/tests" className="btn btn-outline">Explore All Panels <ArrowRight size={20} /></Link>
        </div>
      </section>

      {/* Section G: Social proof + community */}
      <section className="section bg-light-alt community-section">
        <h2 className="section-title">Trusted by the Community</h2>
        <div className="community-grid">
          <div className="testimonials glass">
            <Quote className="quote-icon" size={40} />
            {testimonials.length > 0 ? (
              <>
                <p className="testimonial-text">"{testimonials[0].content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar"><User size={24}/></div>
                  <div>
                    <strong>{testimonials[0].author_name}</strong>
                    <div className="stars">
                      {[...Array(testimonials[0].rating)].map((_, i) => <Star key={i} size={14}/>)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p>No testimonials available.</p>
            )}
          </div>
          <div className="community-heroes glass">
            <Users className="heroes-icon" size={40} />
            <h3>Community Heroes</h3>
            <p>
              Supporting non-profits and study participants across the nation. Over <strong>10,000+</strong> subsidized tests provided for underserved communities and clinical research trials.
            </p>
            <Link to="/contact" className="btn btn-primary btn-sm">Join Our Mission</Link>
          </div>
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