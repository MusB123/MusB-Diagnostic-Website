import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, Clock, Share2, ShoppingCart, Calendar, 
  Copy, Download, Check, CheckCircle,
  Activity, Loader2, Sparkles, Tag, TrendingDown, Zap, Star
} from 'lucide-react';
import { offersAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import './OffersHub.css';

const CATEGORIES = ['All', 'Heart', 'Thyroid', "Women's", 'Metabolic', 'STD', 'Vitamins'];

const TYPE_CONFIG = {
  Weekly: { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', icon: '⚡', accent: '#3b82f6' },
  Monthly: { gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)', icon: '🔥', accent: '#e11d48' },
  Seasonal: { gradient: 'linear-gradient(135deg, #10b981, #14b8a6)', icon: '🌿', accent: '#10b981' },
};

const OffersHub = () => {
  const location = useLocation();
  const [activeType, setActiveType] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const { addToCart } = useCart();

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const params = {
      type: activeType,
      category: activeCategory,
      search: searchQuery
    };
    const res = await offersAPI.getOffers(params);
    if (res.ok) {
      setOffers(res.data);
    }
    setLoading(false);
  }, [activeType, activeCategory, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const handleAddToCart = (offer, uniqueId) => {
    addToCart({
      id: uniqueId,
      title: offer.title,
      category: offer.offer_type + ' Deal',
      price: parseFloat(offer.discounted_price),
      sampleType: 'Package',
      turnaround: 'Multiple',
    });
    setAddedId(uniqueId);
    setTimeout(() => setAddedId(null), 1500);
  };

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const filteredOffers = offers;

  const calcSavings = (orig, disc) => {
    const o = parseFloat(orig);
    const d = parseFloat(disc);
    if (!o || !d) return 0;
    return Math.round(((o - d) / o) * 100);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText("Take charge of your health this week with MusB Diagnostics! Get huge discounts on complete health panels. 🩺✨ #Health #Wellness #MusBDiagnostics");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="oh-page fade-in">
      {/* ====== HERO BANNER ====== */}
      <section className="oh-hero">
        <div className="oh-hero-bg-shapes">
          <div className="oh-shape oh-shape-1"></div>
          <div className="oh-shape oh-shape-2"></div>
          <div className="oh-shape oh-shape-3"></div>
        </div>
        <div className="oh-hero-content">
          <div className="oh-hero-badge">
            <Sparkles size={16} /> Limited-Time Offers
          </div>
          <h1 className="oh-hero-title">Exclusive Health Deals</h1>
          <p className="oh-hero-subtitle">
            Premium diagnostic packages tailored for your well-being — at prices that make preventive care accessible to everyone.
          </p>
          <div className="oh-hero-stats">
            <div className="oh-hero-stat">
              <span className="oh-stat-value">Up to 45%</span>
              <span className="oh-stat-label">Savings</span>
            </div>
            <div className="oh-hero-stat-divider"></div>
            <div className="oh-hero-stat">
              <span className="oh-stat-value">{offers.length}+</span>
              <span className="oh-stat-label">Active Deals</span>
            </div>
            <div className="oh-hero-stat-divider"></div>
            <div className="oh-hero-stat">
              <span className="oh-stat-value">24-48h</span>
              <span className="oh-stat-label">Fast Results</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FILTERS BAR ====== */}
      <section className="oh-filters-wrap">
        <div className="oh-filters">
          <div className="oh-filter-group">
            <label className="oh-filter-label"><Tag size={14}/> Type</label>
            <div className="oh-pill-group">
              {['All', 'Weekly', 'Monthly', 'Seasonal'].map(type => (
                <button 
                  key={type} 
                  className={`oh-pill ${activeType === type ? 'active' : ''}`}
                  onClick={() => setActiveType(type)}
                  style={activeType === type && type !== 'All' ? { background: TYPE_CONFIG[type]?.accent, color: '#fff' } : {}}
                >
                  {type !== 'All' && <span className="oh-pill-icon">{TYPE_CONFIG[type]?.icon}</span>}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="oh-filter-group">
            <label className="oh-filter-label"><Activity size={14}/> Category</label>
            <select 
              className="oh-select"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="oh-filter-group oh-filter-search">
            <label className="oh-filter-label"><Zap size={14}/> Search</label>
            <div className="oh-location-wrap">
              <input 
                type="text" 
                placeholder="Search deals..." 
                className="oh-location-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====== OFFERS GRID ====== */}
      <section className="oh-grid-section">
        {loading ? (
          <div className="oh-loading">
            <Loader2 className="oh-spin" size={48}/>
            <p>Discovering best deals for you...</p>
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="oh-grid">
            {filteredOffers.map((offer, idx) => {
              const uniqueId = `offer-${offer.id || idx}`;
              const type = offer.offer_type || 'Weekly';
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.Weekly;
              const savings = calcSavings(offer.original_price, offer.discounted_price);
              const isHovered = hoveredCard === uniqueId;

              return (
                <div 
                  key={uniqueId} 
                  className={`oh-card ${isHovered ? 'oh-card-hovered' : ''}`}
                  onMouseEnter={() => setHoveredCard(uniqueId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ '--card-accent': config.accent }}
                >
                  {/* Gradient Top Strip */}
                  <div className="oh-card-stripe" style={{ background: config.gradient }}></div>

                  {/* Savings Badge */}
                  {savings > 0 && (
                    <div className="oh-savings-badge" style={{ background: config.gradient }}>
                      <TrendingDown size={14}/> Save {savings}%
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="oh-card-header">
                    <span className="oh-type-tag" style={{ color: config.accent, background: `${config.accent}12` }}>
                      {config.icon} {type} Deal
                    </span>
                    <h3 className="oh-card-title">{offer.title}</h3>
                  </div>

                  {/* Price Block */}
                  <div className="oh-price-block">
                    <div className="oh-price-main">
                      <span className="oh-price-currency">$</span>
                      <span className="oh-price-amount">{offer.discounted_price}</span>
                    </div>
                    <div className="oh-price-original">
                      <span className="oh-price-was">was ${offer.original_price}</span>
                      {savings > 0 && (
                        <span className="oh-price-you-save">You save ${(parseFloat(offer.original_price) - parseFloat(offer.discounted_price)).toFixed(0)}</span>
                      )}
                    </div>
                  </div>

                  {/* Includes */}
                  <ul className="oh-includes">
                    {(offer.includes || []).map((item, i) => (
                      <li key={i}>
                        <CheckCircle size={16} style={{ color: config.accent, flexShrink: 0 }}/>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Timer */}
                  <div className="oh-timer">
                    <Clock size={15}/>
                    <span>Ends in: <strong>{offer.time_left || 'Limited Time'}</strong></span>
                    <div className="oh-timer-pulse"></div>
                  </div>

                  {/* Actions */}
                  <div className="oh-card-actions">
                    <Link to="/book" className="oh-btn oh-btn-book" style={{ background: config.gradient }}>
                      <Calendar size={16}/> Book Now
                    </Link>
                    <button 
                      className={`oh-btn oh-btn-cart ${addedId === uniqueId ? 'oh-btn-added' : ''}`}
                      onClick={() => handleAddToCart(offer, uniqueId)}
                    >
                      {addedId === uniqueId ? (
                        <><Check size={16}/> Added!</>
                      ) : (
                        <><ShoppingCart size={16}/> Add to Cart</>
                      )}
                    </button>
                    <button className="oh-btn oh-btn-share" title="Share Offer">
                      <Share2 size={16}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="oh-empty">
            <Zap size={48} className="oh-empty-icon"/>
            <h3>No offers found</h3>
            <p>Try adjusting your filters to discover more deals.</p>
            <button className="btn btn-primary" onClick={() => { setActiveType('All'); setActiveCategory('All'); }}>
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* ====== WHY CHOOSE US STRIP ====== */}
      <section className="oh-trust-strip">
        <div className="oh-trust-inner">
          {[
            { icon: <Star size={22}/>, label: 'CLIA Certified Lab' },
            { icon: <CheckCircle size={22}/>, label: 'HIPAA Compliant' },
            { icon: <Zap size={22}/>, label: '24–48h Results' },
            { icon: <MapPin size={22}/>, label: 'Mobile Collections' },
          ].map((item, i) => (
            <div key={i} className="oh-trust-item">
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====== SHARE KIT ====== */}
      <section className="oh-share-section">
        <div className="oh-share-container">
          <div className="oh-share-header">
            <Share2 size={28} className="oh-share-icon"/>
            <h2>Share & Save Together</h2>
            <p>Help your friends and family access affordable health testing. Share our latest deals!</p>
          </div>
          
          <div className="oh-share-body">
            <div className="oh-share-preview">
              <div className="oh-share-image-box">
                <Sparkles size={40}/>
                <span>Weekly Promo</span>
                <span className="oh-share-img-sub">Share-ready image</span>
              </div>
              <button className="oh-download-btn"><Download size={16}/> Download Image</button>
            </div>
            
            <div className="oh-share-text">
              <label>Promo Caption</label>
              <div className="oh-caption-box">
                <p>Take charge of your health this week with MusB Diagnostics! Get huge discounts on complete health panels. 🩺✨ #Health #Wellness #MusBDiagnostics</p>
              </div>
              <div className="oh-share-actions">
                <button 
                  className={`oh-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyCaption}
                >
                  {copied ? <><Check size={16}/> Copied!</> : <><Copy size={16}/> Copy Caption</>}
                </button>
                <div className="oh-social-row">
                  <span className="oh-social-label">Share on:</span>
                  <button className="oh-social-btn oh-fb">f</button>
                  <button className="oh-social-btn oh-x">𝕏</button>
                  <button className="oh-social-btn oh-li">in</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OffersHub;