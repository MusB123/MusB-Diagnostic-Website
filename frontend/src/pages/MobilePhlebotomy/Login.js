import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, Loader2, ArrowLeft, ArrowRight, 
  Upload, Camera, CheckCircle, Clock, ShieldCheck, 
  MapPin, X, Globe 
} from 'lucide-react';
import api from '../../api/api';
import './Portal.css';
import './SpecialistPortal/SpecialistPortal.css';

const STEPS = [
  { id: 1, name: 'Personal Info' },
  { id: 2, name: 'Driving License' },
  { id: 3, name: 'Certificate' },
  { id: 4, name: 'Insurance' },
  { id: 5, name: 'Service Area' },
  { id: 6, name: 'Review' }
];

const PhlebotomistLogin = ({ isOpen, onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [zipInput, setZipInput] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', address: '', phone: '', email: '', website: '',
    password: '',
    dlFront: null, dlBack: null,
    certificate: null,
    insuranceDoc: null,
    zipCodes: []
  });
  const navigate = useNavigate();
  
  const update = (f, v) => setFormData(prev => ({ ...prev, [f]: v }));

  const addZip = () => {
    const z = zipInput.trim();
    if (z && !formData.zipCodes.includes(z)) {
      update('zipCodes', [...formData.zipCodes, z]);
      setZipInput('');
    }
  };

  const removeZip = (z) => update('zipCodes', formData.zipCodes.filter(x => x !== z));

  const handleZipKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addZip(); }
  };

  const canNext = () => {
    switch (step) {
      case 1: return formData.fullName.trim() && formData.email.trim() && formData.phone.trim() && formData.password.trim();
      case 2:
      case 3:
      case 4: return true;
      case 5: return formData.zipCodes.length > 0 || zipInput.trim().length > 0;
      default: return true;
    }
  };

  const handleNext = async () => { 
    if (step === 5) {
      setLoading(true);
      
      // Auto-commit any pending ZIP input before final submission
      const currentZip = zipInput.trim();
      let finalData = formData;
      if (currentZip && !formData.zipCodes.includes(currentZip)) {
        finalData = { ...formData, zipCodes: [...formData.zipCodes, currentZip] };
      }

      try {
        await api.post('/api/phleb/apply/', finalData);
        setStep(6);
      } catch (err) {
        console.error("Application submission failed:", err);
        setError("Failed to submit application. Please check your network or try a different email.");
      }
      setLoading(false);
    } else if (step < 6) {
      setStep(step + 1); 
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure clean login state and trimmed credentials
    localStorage.removeItem('phleb_token');
    const emailStr = formData.email.trim();
    const passwordStr = formData.password.trim();

    console.log(`🚀 [Mobile Phleb] Attempting login for: ${emailStr}...`);

    const endpoint = isSignup ? '/api/phleb/signup/' : '/api/phleb/login/';
    
    try {
      const response = await api.post(endpoint, {
        ...formData,
        email: emailStr,
        password: passwordStr
      });
      const data = response.data;

      if (response.status === 200 || response.status === 201) {
        localStorage.setItem('phleb_token', data.token);
        localStorage.setItem('phleb_user', JSON.stringify(data.user));
        onClose();
        navigate('/portal/phlebotomist/dashboard');
      } else {
        setError(data.error || 'Invalid phlebotomist credentials');
      }
    } catch (err) {
      console.error('Login Error:', err);
      // Priority: Backend explicit error message > Axios generic message > Network error
      const errorMsg = err.response?.data?.error || err.message || 'Connection error. Please check your internet.';
      setError(errorMsg);
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
            onClick={() => { setIsSignup(true); setError(''); setStep(1); }}
          >
            Sign Up
          </button>
        </div>

        <div className="text-center">
          {isSignup && step < 6 && (
            <div className="sp-progress !mb-4">
              {STEPS.slice(0, 5).map(s => (
                <div
                  key={s.id}
                  className={`sp-progress-dot ${s.id === step ? 'active' : ''} ${s.id < step ? 'done' : ''}`}
                />
              ))}
            </div>
          )}
          <h2 className="phleb-title text-white">
            {isSignup ? (step < 6 ? `Step ${step}: ${STEPS[step-1].name}` : 'Application Received') : 'Phlebotomist Login'}
          </h2>
          <p className="phleb-subtitle text-slate-300">
            {isSignup ? (step < 6 ? 'Complete your specialist profile' : 'Verification process started') : 'Access your field operations dashboard'}
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

        <div className="phleb-form-container" style={{ minHeight: isSignup ? '380px' : 'auto' }}>
          {!isSignup ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="phleb-form-group">
                <label className="phleb-label text-slate-100">Email Address</label>
                <input 
                  name="email" type="email" className="phleb-input !text-white" 
                  placeholder="name@agency.com" value={formData.email} onChange={handleChange} required 
                />
              </div>
              <div className="phleb-form-group">
                <label className="phleb-label text-slate-100">Password</label>
                <input 
                  name="password" type="password" className="phleb-input !text-white" 
                  placeholder="••••••••" value={formData.password} onChange={handleChange} required 
                />
              </div>
              <button type="submit" className="btn-primary !w-full !p-5 !rounded-2xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login Now'}
              </button>
              <div className="mt-8">
                <div className="phleb-divider mb-8">OR</div>
                <button type="button" className="btn-tactical !w-full !p-5 !rounded-2xl">
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="18" />
                  Auth via Google Workspace
                </button>
              </div>
            </form>
          ) : (
            <div className="onboarding-step-content">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="phleb-form-grid">
                      <div className="phleb-form-group">
                        <label className="phleb-label">Full Name *</label>
                        <input type="text" className="phleb-input" placeholder="John A. Doe" value={formData.fullName} onChange={e => update('fullName', e.target.value)} />
                      </div>
                      <div className="phleb-form-group">
                        <label className="phleb-label">Email Address *</label>
                        <input type="email" className="phleb-input" placeholder="name@specialist.com" value={formData.email} onChange={e => update('email', e.target.value)} />
                      </div>
                      <div className="phleb-form-group">
                        <label className="phleb-label">Phone Number *</label>
                        <input type="tel" className="phleb-input" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => update('phone', e.target.value)} />
                      </div>
                      <div className="phleb-form-group">
                        <label className="phleb-label">Secure Password *</label>
                        <input type="password" className="phleb-input" placeholder="••••••••" value={formData.password} onChange={e => update('password', e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-sm text-slate-300">Upload your valid driving license (front & back).</p>
                    <div className="sp-upload-row">
                      <label className={`sp-upload-zone ${formData.dlFront ? 'has-file' : ''}`}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => update('dlFront', e.target.files[0]?.name || null)} />
                        <Upload size={20} />
                        <span>{formData.dlFront || 'Front Side'}</span>
                      </label>
                      <label className={`sp-upload-zone ${formData.dlBack ? 'has-file' : ''}`}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => update('dlBack', e.target.files[0]?.name || null)} />
                        <Camera size={20} />
                        <span>{formData.dlBack || 'Back Side'}</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-sm text-slate-300">Upload your phlebotomy certificate or state license.</p>
                    <label className={`sp-upload-zone ${formData.certificate ? 'has-file' : ''}`} style={{ height: '140px' }}>
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => update('certificate', e.target.files[0]?.name || null)} />
                      <ShieldCheck size={24} />
                      <span>{formData.certificate || 'Upload Certification'}</span>
                    </label>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <p className="text-sm text-slate-300">Upload professional liability insurance proof.</p>
                    <label className={`sp-upload-zone ${formData.insuranceDoc ? 'has-file' : ''}`} style={{ height: '140px' }}>
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => update('insuranceDoc', e.target.files[0]?.name || null)} />
                      <Upload size={24} />
                      <span>{formData.insuranceDoc || 'Upload Insurance Doc'}</span>
                    </label>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="phleb-form-group">
                      <label className="phleb-label">ZIP Codes Served (Press Enter)</label>
                      <div className="sp-zip-tags">
                        {formData.zipCodes.map(z => (
                          <span key={z} className="sp-zip-tag">
                            {z} <button onClick={() => removeZip(z)}><X size={12} /></button>
                          </span>
                        ))}
                        <input 
                          className="sp-zip-input" type="text" placeholder="ZIP Code" 
                          value={zipInput} onChange={e => setZipInput(e.target.value)} onKeyDown={handleZipKey} 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="sp-pending-screen">
                    <div className="sp-pending-icon !bg-emerald-500/20 !text-emerald-500"><CheckCircle size={44} /></div>
                    <h3 className="text-white font-bold text-xl mb-2">Application Submitted!</h3>
                    <p className="text-slate-400 text-sm mb-6">Your credentials are being verified by our medical board.</p>
                    <button className="btn-primary !w-full" onClick={onClose}>Finish</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {step < 6 && (
                <div className="flex gap-4 mt-10">
                  {step > 1 && (
                    <button className="sp-btn-secondary !flex-1" onClick={handleBack} disabled={loading}>
                      <ArrowLeft size={18} /> Back
                    </button>
                  )}
                  <button className="sp-btn-primary !flex-1" onClick={handleNext} disabled={!canNext() || loading}>
                    {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : (
                      step === 5 ? <><CheckCircle size={18} /> Submit</> : <>Continue <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhlebotomistLogin;
