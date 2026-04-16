import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api/api';
import {
  ArrowLeft, ArrowRight, Upload, Camera, CheckCircle,
  Clock, ShieldCheck, MapPin, X, Globe
} from 'lucide-react';
import './SpecialistPortal.css';

const STEPS = [
  { id: 1, name: 'Personal Info' },
  { id: 2, name: 'Driving License' },
  { id: 3, name: 'Certificate' },
  { id: 4, name: 'Insurance' },
  { id: 5, name: 'Service Area' },
  { id: 6, name: 'Review' }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    fullName: '', address: '', phone: '', email: '', website: '',
    dlFront: null, dlBack: null,
    certificate: null,
    insuranceDoc: null,
    zipCodes: []
  });
  const [zipInput, setZipInput] = useState('');

  const update = (f, v) => setData(prev => ({ ...prev, [f]: v }));

  const addZip = () => {
    const z = zipInput.trim();
    if (z && !data.zipCodes.includes(z)) {
      update('zipCodes', [...data.zipCodes, z]);
      setZipInput('');
    }
  };

  const removeZip = (z) => update('zipCodes', data.zipCodes.filter(x => x !== z));

  const handleZipKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addZip(); }
  };

  const canNext = () => {
    switch (step) {
      case 1: return data.fullName.trim() && data.email.trim() && data.phone.trim();
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return data.zipCodes.length > 0;
      default: return true;
    }
  };

  const handleNext = async () => { 
    if (step === 5) {
      await submitApplication();
    } else if (step < 6) {
      setStep(step + 1); 
    }
  };

  const submitApplication = async () => {
    try {
      await api.post('/api/phleb/apply/', data);
      setStep(6);
    } catch (err) {
      console.error("Application submission failed:", err);
      alert("Failed to submit application. Please check your network or try a different email.");
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>Personal Information</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>Tell us about yourself so we can set up your specialist account.</p>
            <div className="sp-form">
              <div className="sp-form-group">
                <label>Full Name *</label>
                <input type="text" placeholder="John A. Doe" value={data.fullName} onChange={e => update('fullName', e.target.value)} />
              </div>
              <div className="sp-form-group">
                <label>Street Address</label>
                <input type="text" placeholder="123 Main St, Apt 4B, New York, NY" value={data.address} onChange={e => update('address', e.target.value)} />
              </div>
              <div className="sp-form-row">
                <div className="sp-form-group">
                  <label>Phone Number *</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={data.phone} onChange={e => update('phone', e.target.value)} />
                </div>
                <div className="sp-form-group">
                  <label>Email Address *</label>
                  <input type="email" placeholder="name@specialist.com" value={data.email} onChange={e => update('email', e.target.value)} />
                </div>
              </div>
              <div className="sp-form-group">
                <label><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Website (Optional)</label>
                <input type="url" placeholder="https://yourportfolio.com" value={data.website} onChange={e => update('website', e.target.value)} />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>Driving License</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>Upload front and back of your valid driving license.</p>
            <div className="sp-upload-row">
              <label className={`sp-upload-zone ${data.dlFront ? 'has-file' : ''}`}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => update('dlFront', e.target.files[0]?.name || null)} />
                <div className="sp-upload-icon"><Upload size={22} /></div>
                <p>{data.dlFront || 'Front Side'}</p>
                <span>JPG, PNG or PDF</span>
              </label>
              <label className={`sp-upload-zone ${data.dlBack ? 'has-file' : ''}`}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => update('dlBack', e.target.files[0]?.name || null)} />
                <div className="sp-upload-icon"><Camera size={22} /></div>
                <p>{data.dlBack || 'Back Side'}</p>
                <span>Or use camera capture</span>
              </label>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>Phlebotomy Certificate</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>Upload your phlebotomist certification or state license document.</p>
            <div className="sp-upload-row" style={{ gridTemplateColumns: '1fr' }}>
              <label className={`sp-upload-zone ${data.certificate ? 'has-file' : ''}`} style={{ padding: '3rem' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => update('certificate', e.target.files[0]?.name || null)} />
                <div className="sp-upload-icon"><ShieldCheck size={24} /></div>
                <p>{data.certificate || 'Upload Certificate / License'}</p>
                <span>ASCP, NCA, or state-issued phlebotomy license</span>
              </label>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>Liability Insurance</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>Upload your professional liability or malpractice insurance document.</p>
            <div className="sp-upload-row" style={{ gridTemplateColumns: '1fr' }}>
              <label className={`sp-upload-zone ${data.insuranceDoc ? 'has-file' : ''}`} style={{ padding: '3rem' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => update('insuranceDoc', e.target.files[0]?.name || null)} />
                <div className="sp-upload-icon"><Upload size={24} /></div>
                <p>{data.insuranceDoc || 'Upload Insurance Document'}</p>
                <span>Professional liability / malpractice coverage proof</span>
              </label>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>Service Area</h2>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>Enter the ZIP codes you are willing to serve. Press Enter after each.</p>
            <div className="sp-form-group">
              <label><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />ZIP Codes Served</label>
              <div className="sp-zip-tags">
                {data.zipCodes.map(z => (
                  <span key={z} className="sp-zip-tag">
                    {z}
                    <button onClick={() => removeZip(z)}><X size={12} /></button>
                  </span>
                ))}
                <input
                  className="sp-zip-input"
                  type="text"
                  placeholder="Enter ZIP/Postal Code"
                  value={zipInput}
                  onChange={e => setZipInput(e.target.value)}
                  onKeyDown={handleZipKey}
                />
              </div>
            </div>
            {data.zipCodes.length > 0 && (
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '1rem' }}>
                {data.zipCodes.length} ZIP code{data.zipCodes.length !== 1 ? 's' : ''} added
              </p>
            )}
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="s6" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="sp-pending-screen">
              <div className="sp-pending-icon"><Clock size={44} /></div>
              <h2>Account Under Review</h2>
              <p>Your application has been submitted. Our team will verify your credentials within 24-48 hours.</p>
              <div className="sp-pending-steps">
                <div className="sp-pending-step">
                  <div className="sp-pending-step-icon done"><CheckCircle size={16} /></div>
                  <span>Personal information submitted</span>
                </div>
                <div className="sp-pending-step">
                  <div className="sp-pending-step-icon done"><CheckCircle size={16} /></div>
                  <span>Documents uploaded</span>
                </div>
                <div className="sp-pending-step">
                  <div className="sp-pending-step-icon waiting"><Clock size={16} /></div>
                  <span>Admin verification in progress</span>
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button className="sp-btn-secondary" onClick={() => navigate('/mobile-phlebotomy')}>
                  Return to Home
                </button>
              </div>
            </div>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className="sp-wrapper">
      <div className="sp-mesh-bg">
        <div className="sp-mesh-blob b1" />
        <div className="sp-mesh-blob b2" />
      </div>
      <div className="sp-content">
        <div className="sp-onboard-page">
          <div className="sp-onboard-card">
            <div className="sp-onboard-header">
              <h1>Specialist Onboarding</h1>
              <p>Join the MusB mobile phlebotomy network</p>
            </div>

            {step < 6 && (
              <>
                <div className="sp-progress">
                  {STEPS.slice(0, 5).map(s => (
                    <div
                      key={s.id}
                      className={`sp-progress-dot ${s.id === step ? 'active' : ''} ${s.id < step ? 'done' : ''}`}
                    />
                  ))}
                </div>
                <p style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem' }}>
                  Step {step} of 5 — {STEPS[step - 1].name}
                </p>
              </>
            )}

            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {step < 6 && (
              <div className="sp-btn-row">
                {step > 1 && (
                  <button className="sp-btn-secondary" onClick={handleBack}>
                    <ArrowLeft size={18} /> Back
                  </button>
                )}
                <button className="sp-btn-primary" onClick={handleNext} disabled={!canNext()}>
                  {step === 5 ? (<><CheckCircle size={18} /> Submit Application</>) : (<>Continue <ArrowRight size={18} /></>)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
