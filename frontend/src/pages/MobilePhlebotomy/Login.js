import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import './Portal.css';

const PhlebotomistLogin = ({ isOpen, onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    location: '',
    password: ''
  });
  const navigate = useNavigate();



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isSignup ? '/api/phleb/signup/' : '/api/phleb/login/';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('phleb_token', data.token);
        localStorage.setItem('phleb_user', JSON.stringify(data.user));
        onClose();
        navigate('/portal/phlebotomist/dashboard');
      } else {
        setError(data.error || 'Invalid phlebotomist credentials');
      }
    } catch (err) {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="phleb-portal-overlay" onClick={onClose}>
      <motion.div 
        className={`phleb-auth-card ${isSignup ? 'signup-mode' : ''}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="phleb-modal-close" onClick={onClose}>&times;</button>

        <div className="phleb-auth-toggle">
          <button 
            className={`phleb-toggle-btn ${!isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(false); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`phleb-toggle-btn ${isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(true); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="text-center">
          <h2 className="phleb-title">{isSignup ? 'Phlebotomist Registration' : 'Phlebotomist Login'}</h2>
          <p className="phleb-subtitle">
            {isSignup ? 'Join the MusB mobile collections network' : 'Access your field operations dashboard'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={isSignup ? 'phleb-form-grid' : 'space-y-4'}>
          {isSignup ? (
            <>
              <div className="phleb-form-group">
                <label className="phleb-label">Full Name</label>
                <input 
                  name="name" type="text" className="phleb-input" 
                  placeholder="John Doe" value={formData.name} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group">
                <label className="phleb-label">Certification / License ID</label>
                <input 
                  name="company_name" type="text" className="phleb-input" 
                  placeholder="CERT-12345-NX" value={formData.company_name} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group">
                <label className="phleb-label">Professional Email</label>
                <input 
                  name="email" type="email" className="phleb-input" 
                  placeholder="name@specialist.com" value={formData.email} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group">
                <label className="phleb-label">Contact Number</label>
                <input 
                  name="phone" type="text" className="phleb-input" 
                  placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group full-width">
                <label className="phleb-label">Preferred Operating Zone</label>
                <input 
                  name="location" type="text" className="phleb-input" 
                  placeholder="e.g., Manhattan, Brooklyn, Queens" value={formData.location} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group full-width">
                <label className="phleb-label">Secure Password</label>
                <input 
                  name="password" type="password" className="phleb-input" 
                  placeholder="••••••••" value={formData.password} onChange={handleChange} required 
                />
              </div>
            </>
          ) : (
            <>
              <div className="phleb-form-group">
                <label className="phleb-label">Email Address</label>
                <input 
                  name="email" type="email" className="phleb-input" 
                  placeholder="name@agency.com" value={formData.email} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group">
                <label className="phleb-label">Password</label>
                <input 
                  name="password" type="password" className="phleb-input" 
                  placeholder="••••••••" value={formData.password} onChange={handleChange} required 
                />
              </div>
            </>
          )}

          <div className={isSignup ? 'phleb-form-group full-width' : ''}>
            <button type="submit" className="phleb-submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (isSignup ? 'Complete Registration' : 'Login Now')}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-6">
              <div className="phleb-divider">OR</div>
              <button type="button" className="phleb-google-btn">
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="20" />
                Login with Google
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhlebotomistLogin;
