import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, ShieldCheck, Clock, Award
} from 'lucide-react';
import './PatientPortal.css';

const PROFILE = {
  name: 'Jessica Rivera',
  initials: 'JR',
  title: 'Certified Phlebotomist',
  yearsExp: 8,
  totalDraws: 1200,
  rating: 4.9,
  totalReviews: 248,
  certifications: ['ASCP Certified', 'OSHA Compliant', 'BLS Certified']
};

const REVIEWS = [
  { id: 1, stars: 5, text: 'Absolutely wonderful experience. Jessica was professional, gentle, and made the whole process stress-free. Highly recommend!', author: 'Sarah M.', date: 'Apr 10, 2026', verified: true },
  { id: 2, stars: 5, text: 'Best phlebotomist I\'ve ever had. She arrived on time, was incredibly gentle, and explained everything clearly. Will definitely book again.', author: 'David K.', date: 'Apr 3, 2026', verified: true },
  { id: 3, stars: 4, text: 'Very professional and courteous. The only minor note is she arrived a few minutes late, but the service itself was excellent.', author: 'Maria L.', date: 'Mar 28, 2026', verified: true },
  { id: 4, stars: 5, text: 'I have a severe needle phobia and Jessica handled it with so much patience. She talked me through everything. Amazing bedside manner.', author: 'Tom R.', date: 'Mar 15, 2026', verified: true },
  { id: 5, stars: 5, text: 'Quick, clean, and professional. Results came back perfectly. Couldn\'t ask for a better mobile phlebotomy experience.', author: 'Jana P.', date: 'Mar 2, 2026', verified: false }
];

const PhlebotomistProfile = () => {
  const navigate = useNavigate();

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} fill={i < count ? '#fbbf24' : 'none'} color={i < count ? '#fbbf24' : '#334155'} />
    ));
  };

  return (
    <div className="pp-wrapper">
      <div className="pp-mesh-bg">
        <div className="pp-mesh-blob blob-1" />
        <div className="pp-mesh-blob blob-2" />
      </div>
      <div className="pp-content">
        <div className="pp-profile-page">
          <button className="pp-profile-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>

          {/* Profile Header */}
          <motion.div
            className="pp-profile-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="pp-profile-avatar">{PROFILE.initials}</div>
            <div className="pp-profile-info">
              <h1>{PROFILE.name}</h1>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{PROFILE.title}</p>

              <div className="pp-profile-badges">
                {PROFILE.certifications.map((cert) => (
                  <span key={cert} className="pp-profile-badge cert">
                    <ShieldCheck size={12} /> {cert}
                  </span>
                ))}
                <span className="pp-profile-badge exp">
                  <Clock size={12} /> {PROFILE.yearsExp}+ Years Experience
                </span>
              </div>

              <div className="pp-profile-stats">
                <div className="pp-profile-stat">
                  <h3 style={{ color: '#fbbf24' }}>{PROFILE.rating}</h3>
                  <p>Rating</p>
                </div>
                <div className="pp-profile-stat">
                  <h3 style={{ color: '#818cf8' }}>{PROFILE.totalDraws.toLocaleString()}</h3>
                  <p>Total Draws</p>
                </div>
                <div className="pp-profile-stat">
                  <h3 style={{ color: '#34d399' }}>{PROFILE.totalReviews}</h3>
                  <p>Reviews</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Book Button */}
          <div style={{ maxWidth: 900, margin: '0 auto 2rem', display: 'flex', gap: '1rem' }}>
            <button
              className="pp-btn-primary"
              style={{ flex: 1 }}
              onClick={() => navigate('/portal/patient/book')}
            >
              <Award size={18} /> Book This Phlebotomist
            </button>
          </div>

          {/* Reviews */}
          <div className="pp-reviews-section">
            <h2>Patient Reviews ({PROFILE.totalReviews})</h2>
            {REVIEWS.map((review) => (
              <motion.div
                key={review.id}
                className="pp-review-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: review.id * 0.1 }}
              >
                <div className="pp-review-item-header">
                  <div className="pp-review-stars">{renderStars(review.stars)}</div>
                  <span className="pp-review-date">
                    {review.verified && (
                      <span style={{ color: '#10b981', marginRight: 8, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        ✓ Verified
                      </span>
                    )}
                    {review.date}
                  </span>
                </div>
                <p className="pp-review-text">{review.text}</p>
                <p className="pp-review-author">— {review.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhlebotomistProfile;
