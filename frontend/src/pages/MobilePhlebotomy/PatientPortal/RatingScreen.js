import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';
import './PatientPortal.css';

const RatingScreen = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="pp-wrapper">
        <div className="pp-mesh-bg">
          <div className="pp-mesh-blob blob-1" />
          <div className="pp-mesh-blob blob-2" />
        </div>
        <div className="pp-content">
          <div className="pp-rating-page">
            <motion.div
              className="pp-rating-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="pp-rating-success">
                <CheckCircle size={64} color="#10b981" />
                <h2>Thank You!</h2>
                <p>Your feedback helps us maintain gold-standard care and improves the experience for all patients.</p>
                <button
                  className="pp-btn-primary"
                  onClick={() => navigate('/portal/patient/dashboard')}
                  style={{ marginTop: '2rem', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}
                >
                  Back to Dashboard <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-wrapper">
      <div className="pp-mesh-bg">
        <div className="pp-mesh-blob blob-1" />
        <div className="pp-mesh-blob blob-2" />
      </div>
      <div className="pp-content">
        <div className="pp-rating-page">
          <motion.div
            className="pp-rating-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Rate Your Experience</h2>
            <p className="pp-rating-subtitle">How was your blood draw appointment?</p>

            {/* Phlebotomist Info */}
            <div className="pp-rating-phleb-info">
              <div className="pp-rating-phleb-avatar">JR</div>
              <div className="pp-rating-phleb-name">
                <h4>Jessica Rivera</h4>
                <p>Certified Phlebotomist</p>
              </div>
            </div>

            {/* Star Widget */}
            <div className="pp-star-widget">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`pp-star-btn ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                >
                  <Star
                    size={36}
                    fill={star <= (hoveredStar || rating) ? '#fbbf24' : 'none'}
                    strokeWidth={star <= (hoveredStar || rating) ? 0 : 2}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {rating === 5 ? 'Outstanding!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
              </p>
            )}

            {/* Review Text */}
            <textarea
              className="pp-rating-textarea"
              placeholder="Share your experience... (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            {/* Submit */}
            <button
              className="pp-btn-primary"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? <div className="pp-spinner" /> : <><CheckCircle size={18} /> Submit Rating</>}
            </button>

            <div className="pp-auth-footer" style={{ marginTop: '1rem' }}>
              <button type="button" onClick={() => navigate('/portal/patient/dashboard')}>
                Skip for Now
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RatingScreen;
