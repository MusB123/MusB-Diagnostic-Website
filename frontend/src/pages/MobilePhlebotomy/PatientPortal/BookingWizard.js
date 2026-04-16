import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Upload, Camera, Shield,
  Calendar, CreditCard, CheckCircle, AlertTriangle
} from 'lucide-react';
import './PatientPortal.css';

const STEPS = [
  { id: 1, name: 'Location' },
  { id: 2, name: 'Order' },
  { id: 3, name: 'Insurance' },
  { id: 4, name: 'Schedule' },
  { id: 5, name: 'Payment' },
  { id: 6, name: 'Review' }
];

const generateDates = () => {
  const dates = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      day: days[d.getDay()],
      num: d.getDate(),
      month: months[d.getMonth()],
      full: d.toISOString().split('T')[0]
    });
  }
  return dates;
};

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM'
];

const BookingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [data, setData] = useState({
    address: '',
    zipCode: '',
    hasOrder: false,
    orderFile: null,
    insuranceProvider: '',
    memberId: '',
    insuranceFront: null,
    insuranceBack: null,
    hasSecondary: false,
    secondaryProvider: '',
    secondaryMemberId: '',
    secondaryFront: null,
    secondaryBack: null,
    selectedDate: '',
    selectedTime: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  const dates = generateDates();

  const updateField = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    switch (step) {
      case 1: return data.address.trim().length > 0;
      case 2: return true; // Optional step
      case 3: return true; // Optional
      case 4: return data.selectedDate && data.selectedTime;
      case 5: return data.cardNumber.length >= 4 && data.cardExpiry && data.cardCvc;
      case 6: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Submit
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setConfirmed(true);
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getProgressPercent = () => {
    return ((step - 1) / (STEPS.length - 1)) * 100;
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  if (confirmed) {
    return (
      <div className="pp-wrapper">
        <div className="pp-mesh-bg">
          <div className="pp-mesh-blob blob-1" />
          <div className="pp-mesh-blob blob-2" />
        </div>
        <div className="pp-content">
          <div className="pp-wizard-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ textAlign: 'center', maxWidth: 500 }}
            >
              <CheckCircle size={80} color="#10b981" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>
                Appointment Confirmed!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Your blood draw has been scheduled for {data.selectedDate} at {data.selectedTime}.
                A certified phlebotomist will arrive at your location.
              </p>
              <button
                className="pp-btn-primary"
                onClick={() => navigate('/portal/patient/dashboard')}
                style={{ maxWidth: 300, margin: '0 auto' }}
              >
                Go to Dashboard <ArrowRight size={18} />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Where should we come?</h2>
            <p className="pp-step-desc">Enter your home or office address where the phlebotomist will visit.</p>
            <div className="pp-auth-form">
              <div className="pp-form-group">
                <label>Service Address</label>
                <input
                  type="text"
                  placeholder="123 Main Street, Apt 4B"
                  value={data.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="pp-form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  placeholder="10001"
                  value={data.zipCode}
                  onChange={(e) => updateField('zipCode', e.target.value)}
                  maxLength={5}
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Doctor&apos;s Order</h2>
            <p className="pp-step-desc">Upload your doctor&apos;s lab requisition if you have one. This step is optional.</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                className={`pp-btn-secondary`}
                onClick={() => updateField('hasOrder', !data.hasOrder)}
                style={{
                  flex: 1,
                  background: data.hasOrder ? 'rgba(99, 102, 241, 0.15)' : undefined,
                  borderColor: data.hasOrder ? '#6366f1' : undefined,
                  color: data.hasOrder ? '#818cf8' : undefined
                }}
              >
                I have an order
              </button>
              <button
                className="pp-btn-secondary"
                onClick={() => { updateField('hasOrder', false); updateField('orderFile', null); }}
                style={{
                  flex: 1,
                  background: !data.hasOrder ? 'rgba(99, 102, 241, 0.15)' : undefined,
                  borderColor: !data.hasOrder ? '#6366f1' : undefined,
                  color: !data.hasOrder ? '#818cf8' : undefined
                }}
              >
                No order yet
              </button>
            </div>

            {data.hasOrder && (
              <div className="pp-upload-row">
                <label className={`pp-upload-zone ${data.orderFile ? 'has-file' : ''}`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => updateField('orderFile', e.target.files[0]?.name || null)}
                  />
                  <div className="pp-upload-icon"><Upload size={24} /></div>
                  <p>{data.orderFile || 'Upload File'}</p>
                  <span className="pp-upload-hint">PDF, JPG, PNG</span>
                </label>
                <label className="pp-upload-zone">
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />
                  <div className="pp-upload-icon"><Camera size={24} /></div>
                  <p>Camera Capture</p>
                  <span className="pp-upload-hint">Take a photo</span>
                </label>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Insurance Information</h2>
            <p className="pp-step-desc">Provide your insurance details for billing. This is optional for self-pay patients.</p>

            <div className="pp-insurance-card" style={{ marginBottom: '1.5rem' }}>
              <h4><Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Primary Insurance</h4>
              <div className="pp-auth-form" style={{ gap: '1rem' }}>
                <div className="pp-form-row">
                  <div className="pp-form-group">
                    <label>Insurance Provider</label>
                    <input
                      type="text"
                      placeholder="Blue Cross Blue Shield"
                      value={data.insuranceProvider}
                      onChange={(e) => updateField('insuranceProvider', e.target.value)}
                    />
                  </div>
                  <div className="pp-form-group">
                    <label>Member ID</label>
                    <input
                      type="text"
                      placeholder="ABC123456"
                      value={data.memberId}
                      onChange={(e) => updateField('memberId', e.target.value)}
                    />
                  </div>
                </div>

                <div className="pp-upload-row">
                  <label className={`pp-upload-zone ${data.insuranceFront ? 'has-file' : ''}`} style={{ padding: '1.5rem' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => updateField('insuranceFront', e.target.files[0]?.name || null)} />
                    <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                    <p style={{ fontSize: '0.8rem' }}>{data.insuranceFront || 'Front of Card'}</p>
                  </label>
                  <label className={`pp-upload-zone ${data.insuranceBack ? 'has-file' : ''}`} style={{ padding: '1.5rem' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => updateField('insuranceBack', e.target.files[0]?.name || null)} />
                    <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                    <p style={{ fontSize: '0.8rem' }}>{data.insuranceBack || 'Back of Card'}</p>
                  </label>
                </div>
              </div>
            </div>

            <button
              className="pp-btn-secondary"
              onClick={() => updateField('hasSecondary', !data.hasSecondary)}
              style={{ marginBottom: '1rem' }}
            >
              {data.hasSecondary ? '- Remove' : '+'} Secondary Insurance
            </button>

            {data.hasSecondary && (
              <div className="pp-insurance-card">
                <h4><Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Secondary Insurance</h4>
                <div className="pp-auth-form" style={{ gap: '1rem' }}>
                  <div className="pp-form-row">
                    <div className="pp-form-group">
                      <label>Insurance Provider</label>
                      <input type="text" placeholder="Aetna" value={data.secondaryProvider} onChange={(e) => updateField('secondaryProvider', e.target.value)} />
                    </div>
                    <div className="pp-form-group">
                      <label>Member ID</label>
                      <input type="text" placeholder="XYZ789" value={data.secondaryMemberId} onChange={(e) => updateField('secondaryMemberId', e.target.value)} />
                    </div>
                  </div>
                  <div className="pp-upload-row">
                    <label className={`pp-upload-zone ${data.secondaryFront ? 'has-file' : ''}`} style={{ padding: '1.5rem' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => updateField('secondaryFront', e.target.files[0]?.name || null)} />
                      <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                      <p style={{ fontSize: '0.8rem' }}>{data.secondaryFront || 'Front of Card'}</p>
                    </label>
                    <label className={`pp-upload-zone ${data.secondaryBack ? 'has-file' : ''}`} style={{ padding: '1.5rem' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => updateField('secondaryBack', e.target.files[0]?.name || null)} />
                      <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                      <p style={{ fontSize: '0.8rem' }}>{data.secondaryBack || 'Back of Card'}</p>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Choose Date & Time</h2>
            <p className="pp-step-desc">Select your preferred appointment slot. Phlebotomists are available 7 days a week.</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Select Date
              </label>
            </div>

            <div className="pp-date-scroll">
              {dates.map((d) => (
                <div
                  key={d.full}
                  className={`pp-date-item ${data.selectedDate === d.full ? 'selected' : ''}`}
                  onClick={() => updateField('selectedDate', d.full)}
                >
                  <span className="pp-date-day">{d.day}</span>
                  <span className="pp-date-num">{d.num}</span>
                  <span className="pp-date-month">{d.month}</span>
                </div>
              ))}
            </div>

            {data.selectedDate && (
              <>
                <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Available Time Slots
                  </label>
                </div>
                <div className="pp-time-grid">
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={slot}
                      className={`pp-time-slot ${data.selectedTime === slot ? 'selected' : ''}`}
                      onClick={() => updateField('selectedTime', slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Payment Method</h2>
            <p className="pp-step-desc">Add a payment method to secure your booking.</p>

            <div className="pp-card-preview">
              <div className="pp-card-chip" />
              <div className="pp-card-number">
                {data.cardNumber ? formatCardNumber(data.cardNumber) : '•••• •••• •••• ••••'}
              </div>
              <div className="pp-card-meta">
                <div className="pp-card-meta-item">
                  <span>Card Holder</span>
                  <strong>{data.cardName || 'YOUR NAME'}</strong>
                </div>
                <div className="pp-card-meta-item">
                  <span>Expires</span>
                  <strong>{data.cardExpiry || 'MM/YY'}</strong>
                </div>
              </div>
            </div>

            <div className="pp-auth-form">
              <div className="pp-form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={data.cardName}
                  onChange={(e) => updateField('cardName', e.target.value)}
                />
              </div>
              <div className="pp-form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={formatCardNumber(data.cardNumber)}
                  onChange={(e) => updateField('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
                />
              </div>
              <div className="pp-form-row">
                <div className="pp-form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={data.cardExpiry}
                    onChange={(e) => updateField('cardExpiry', e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="pp-form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={data.cardCvc}
                    onChange={(e) => updateField('cardCvc', e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="pp-payment-notice">
              <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
              <p>Your card will <strong>not</strong> be charged until the phlebotomist departs from your location.</p>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Review Your Booking</h2>
            <p className="pp-step-desc">Please confirm all details before submitting.</p>

            <div className="pp-review-section">
              <div className="pp-review-row">
                <span className="pp-review-label">Service Address</span>
                <span className="pp-review-value">{data.address || '—'}{data.zipCode ? `, ${data.zipCode}` : ''}</span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Doctor&apos;s Order</span>
                <span className="pp-review-value">{data.orderFile || 'Not provided'}</span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Insurance</span>
                <span className="pp-review-value">{data.insuranceProvider || 'Self-pay'}</span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Date</span>
                <span className="pp-review-value">{data.selectedDate || '—'}</span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Time</span>
                <span className="pp-review-value">{data.selectedTime || '—'}</span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Payment</span>
                <span className="pp-review-value">
                  <CreditCard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  •••• {data.cardNumber.slice(-4) || '••••'}
                </span>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pp-wrapper">
      <div className="pp-mesh-bg">
        <div className="pp-mesh-blob blob-1" />
        <div className="pp-mesh-blob blob-2" />
      </div>
      <div className="pp-content">
        <div className="pp-wizard-page">
          {/* Header */}
          <div className="pp-wizard-header">
            <button className="pp-wizard-back" onClick={step > 1 ? handleBack : () => navigate('/mobile-phlebotomy')}>
              <ArrowLeft size={18} />
              {step > 1 ? 'Back' : 'Exit'}
            </button>
            <span className="pp-wizard-step-label">Step {step} of {STEPS.length}</span>
          </div>

          {/* Progress Bar */}
          <div className="pp-progress-bar">
            <div className="pp-progress-line">
              <div className="pp-progress-line-fill" style={{ width: `${getProgressPercent()}%` }} />
            </div>
            {STEPS.map((s) => (
              <div key={s.id} className={`pp-progress-step ${s.id === step ? 'active' : ''} ${s.id < step ? 'completed' : ''}`}>
                <div className="pp-progress-dot">
                  {s.id < step ? <CheckCircle size={14} /> : s.id}
                </div>
                <span className="pp-progress-step-name">{s.name}</span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="pp-wizard-card">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            <div className="pp-wizard-actions">
              {step > 1 && (
                <button className="pp-btn-secondary" onClick={handleBack}>
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              <button
                className="pp-btn-primary"
                onClick={handleNext}
                disabled={!canNext() || submitting}
              >
                {submitting ? (
                  <div className="pp-spinner" />
                ) : step === 6 ? (
                  <><CheckCircle size={18} /> Confirm Appointment</>
                ) : (
                  <>Continue <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
