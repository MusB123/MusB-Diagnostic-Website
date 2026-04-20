import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Upload, Camera, Shield,
  Calendar, CreditCard, CheckCircle, AlertTriangle,
  Wallet, DollarSign, Loader2, Droplets, Search, ChevronDown
} from 'lucide-react';
import api from '../../../api/api';
import './PatientPortal.css';

const STEPS = [
  { id: 1, name: 'Location' },
  { id: 2, name: 'Select Test' },
  { id: 3, name: 'Order' },
  { id: 4, name: 'Insurance' },
  { id: 5, name: 'Schedule' },
  { id: 6, name: 'Payment' },
  { id: 7, name: 'Review' }
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

const TIME_SLOTS = []; // Deprecated - Using Dial Picker now

const WheelColumn = ({ values, selectedValue, onChange, label }) => {
  const containerRef = React.useRef(null);
  const itemHeight = 60; 

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newVal = values[index];
    if (newVal !== undefined && newVal !== selectedValue) {
      onChange(newVal);
    }
  };

  React.useEffect(() => {
    if (containerRef.current) {
      const index = values.indexOf(selectedValue);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  return (
    <div className="pp-dial-column-wrapper">
      <span className="pp-dial-label">{label}</span>
      <div className="pp-dial-wheel" ref={containerRef} onScroll={handleScroll}>
        <div style={{ height: '60px' }} /> 
        {values.map(val => (
          <div key={val} className={`pp-dial-item ${selectedValue === val ? 'active' : ''}`}>
            {val}
          </div>
        ))}
        <div style={{ height: '60px' }} /> 
      </div>
    </div>
  );
};

const BookingWizard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    if (!token) {
      navigate('/portal/patient/login', { replace: true });
    }
    fetchCatalog();
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 24h Dial State
  const [dialHour, setDialHour] = useState('09');
  const [dialMinute, setDialMinute] = useState('00');

  // Auto-sync dial to data.selectedTime on step 5 entry
  useEffect(() => {
    if (step === 5 && !data.selectedTime) {
      updateField('selectedTime', `${dialHour}:${dialMinute}`);
    }
  }, [step, data.selectedTime, dialHour, dialMinute]);

  const [data, setData] = useState({
    address: '',        // Street Address
    houseNumber: '',    // NEW
    landmark: '',       // NEW
    city: '',           // NEW
    state: '',          // NEW
    zipCode: '',
    selectedTest: null, // { id, title, price }
    hasOrder: false,
    orderFile: null,
    hasInsurance: false, // NEW
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
    paymentMethod: 'Credit Card', // 'Credit Card', 'PayPal', 'Cash'
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  // ZIP Lookup Logic (Deterministic Database Fetch)
  useEffect(() => {
    const lookupZip = async (zip) => {
      if (zip.length !== 5) return;
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (res.ok) {
          const info = await res.json();
          const place = info.places[0];
          setData(prev => ({
            ...prev,
            city: place['place name'],
            state: place['state abbreviation']
          }));
        }
      } catch (err) {
        console.warn("ZIP lookup unavailable", err);
      }
    };
    lookupZip(data.zipCode);
  }, [data.zipCode]);

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/api/superadmin/catalog/tests/');
      setCatalog(res.data);
    } catch (err) {
      console.error("Failed to fetch test catalog", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const dates = generateDates();

  const updateField = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    switch (step) {
      case 1: return data.zipCode.length === 5 && data.address.trim().length > 0 && data.houseNumber.trim().length > 0;
      case 2: return data.selectedTest !== null;
      case 3: 
        if (data.hasOrder) return data.orderFile !== null;
        return true; 
      case 4: 
        if (data.hasInsurance) {
          return !!(data.insuranceProvider && data.memberId && data.insuranceFront && data.insuranceBack);
        }
        return true; 
      case 5: return data.selectedDate && data.selectedTime;
      case 6: 
        if (data.paymentMethod === 'Credit Card') {
          return data.cardNumber.length >= 4 && data.cardExpiry && data.cardCvc;
        }
        return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};

        // Format professional address string for Admin
        const fullAddress = `${data.houseNumber}, ${data.address}${data.landmark ? ` (Landmark: ${data.landmark})` : ''}, ${data.city}, ${data.state} ${data.zipCode}`;

        const payload = {
          address: fullAddress,
          zipCode: data.zipCode,
          test_id: data.selectedTest?.id,
          test_name: data.selectedTest?.title,
          test_price: data.selectedTest?.price,
          has_order: data.hasOrder,
          visit_type: 'home', 
          preferred_date: data.selectedDate,
          preferred_time: data.selectedTime,
          payment_method: data.paymentMethod,
          full_name: data.cardName || user.name || 'Patient',
          email: '',
          phone: '',
        };

        if (data.paymentMethod === 'Credit Card') {
          payload.payment_info = {
            card_holder: data.cardName,
            last4: data.cardNumber.slice(-4)
          };
        }

        await api.post('/api/patients/book-appointment/', payload);
        
        setSubmitting(false);
        setConfirmed(true);
      } catch (err) {
        console.error("Booking Error:", err);
        setSubmitting(false);
        alert(err.response?.data?.error || "Failed to submit booking. Please try again.");
      }
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
                onClick={() => navigate('/portal/patient/dashboard', { replace: true })}
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
            <p className="pp-step-desc">Enter your location details. We'll automatically find your city and state based on the ZIP code.</p>
            <div className="pp-auth-form">
              <div className="pp-form-row">
                <div className="pp-form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    placeholder="10001"
                    value={data.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                  />
                </div>
                <div className="pp-form-group">
                  <label>City & State</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-detected"
                    value={data.city ? `${data.city}, ${data.state}` : ''}
                    style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="pp-form-row">
                <div className="pp-form-group" style={{ flex: '0 0 120px' }}>
                  <label>House/Apt #</label>
                  <input
                    type="text"
                    placeholder="4B"
                    value={data.houseNumber}
                    onChange={(e) => updateField('houseNumber', e.target.value)}
                  />
                </div>
                <div className="pp-form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    value={data.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
              </div>

              <div className="pp-form-group">
                <label>Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="Near the blue fire hydrant"
                  value={data.landmark}
                  onChange={(e) => updateField('landmark', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        const filteredTests = catalog.filter(t => 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Select Your Test</h2>
            <p className="pp-step-desc">Choose from our clinical catalog. Search by name to quickly find your specific disease panel.</p>
            
            {loadingCatalog ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 0' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading catalog...</p>
              </div>
            ) : (
              <div style={{ minHeight: '300px' }}>
                <div className="pp-test-select-container">
                  <div 
                    className={`pp-test-select-trigger ${dropdownOpen ? 'active' : ''}`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Search size={18} color="#6366f1" />
                      <span style={{ color: data.selectedTest ? 'white' : '#64748b', fontWeight: 600 }}>
                        {data.selectedTest ? data.selectedTest.title : 'Select a clinical test...'}
                      </span>
                    </div>
                    <ChevronDown size={20} color="#94a3b8" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        className="pp-test-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="pp-test-search-box" onClick={(e) => e.stopPropagation()}>
                          <input 
                            autoFocus
                            placeholder="Type to filter tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        {filteredTests.length > 0 ? filteredTests.map((test) => (
                          <div
                            key={test.id}
                            className={`pp-test-option ${data.selectedTest?.id === test.id ? 'selected' : ''}`}
                            onClick={() => {
                              setData(prev => ({ ...prev, selectedTest: test }));
                              setDropdownOpen(false);
                            }}
                          >
                            <div className="pp-test-option-info">
                              <span className="pp-test-option-title">{test.title}</span>
                              {data.selectedTest?.id === test.id && (
                                <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 800 }}>✓ CURRENTLY SELECTED</span>
                              )}
                            </div>
                            <span className="pp-test-option-price">${parseFloat(test.price).toFixed(2)}</span>
                          </div>
                        )) : (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                            No tests found matching "{searchQuery}"
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {data.selectedTest && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pp-selected-test-card"
                  >
                    <div className="pp-selected-test-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#6366f1', color: 'white', padding: '6px', borderRadius: '8px' }}>
                          <Droplets size={20} />
                        </div>
                        <h3 style={{ margin: 0 }}>{data.selectedTest.title}</h3>
                      </div>
                      <p>{data.selectedTest.description || 'Full clinical analysis panel for diagnostic insights.'}</p>
                      <div className="pp-selected-test-meta">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Shield size={16} color="#34d399" />
                          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>CLINICALLY CERTIFIED</span>
                        </div>
                        <div className="pp-price-tag">
                          ${parseFloat(data.selectedTest.price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Doctor&apos;s Order</h2>
            <p className="pp-step-desc">
              {data.hasOrder 
                ? "Please upload your clinical document to continue." 
                : "Upload your doctor's lab requisition if you have one. This step is optional."}
            </p>

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
                <div className="pp-form-group">
                  <label>Upload File {data.hasOrder && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <div 
                    className={`pp-upload-zone ${data.orderFile ? 'has-file' : ''}`}
                    onClick={() => document.getElementById('orderFile').click()}
                  >
                    <div className="pp-upload-icon">
                      <Upload size={24} />
                    </div>
                    <p>{data.orderFile ? data.orderFile.name : 'Upload File'}</p>
                    <span className="pp-upload-hint">PDF, JPG, PNG</span>
                    <input
                      type="file"
                      id="orderFile"
                      hidden
                      onChange={(e) => updateField('orderFile', e.target.files[0])}
                    />
                  </div>
                </div>
                <div className="pp-form-group">
                  <label>Camera Capture {data.hasOrder && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <div className="pp-upload-zone">
                    <div className="pp-upload-icon">
                      <Camera size={24} />
                    </div>
                    <p>Camera Capture</p>
                    <span className="pp-upload-hint">Take a photo</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Insurance Information</h2>
            <p className="pp-step-desc">
              {data.hasInsurance 
                ? "Please provide your primary clinical insurance details." 
                : "Phlebotomy services can be billed through insurance or self-pay."}
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
                Do you have any Insurance?
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="pp-btn-secondary"
                  onClick={() => updateField('hasInsurance', true)}
                  style={{
                    flex: 1,
                    background: data.hasInsurance ? 'rgba(99, 102, 241, 0.15)' : undefined,
                    borderColor: data.hasInsurance ? '#6366f1' : undefined,
                    color: data.hasInsurance ? '#818cf8' : undefined
                  }}
                >
                  Yes, I have insurance
                </button>
                <button
                  className="pp-btn-secondary"
                  onClick={() => {
                    setData(prev => ({ 
                      ...prev, 
                      hasInsurance: false,
                      insuranceProvider: '',
                      memberId: '',
                      insuranceFront: null,
                      insuranceBack: null,
                      hasSecondary: false
                    }));
                  }}
                  style={{
                    flex: 1,
                    background: !data.hasInsurance ? 'rgba(99, 102, 241, 0.15)' : undefined,
                    borderColor: !data.hasInsurance ? '#6366f1' : undefined,
                    color: !data.hasInsurance ? '#818cf8' : undefined
                  }}
                >
                  No, I will self-pay
                </button>
              </div>
            </div>

            {data.hasInsurance && (
              <>
                <div className="pp-insurance-card" style={{ marginBottom: '1.5rem' }}>
                  <h4><Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Primary Insurance</h4>
                  <div className="pp-auth-form" style={{ gap: '1rem' }}>
                    <div className="pp-form-row">
                      <div className="pp-form-group">
                        <label>Insurance Provider <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="text"
                          placeholder="Blue Cross Blue Shield"
                          value={data.insuranceProvider}
                          onChange={(e) => updateField('insuranceProvider', e.target.value)}
                        />
                      </div>
                      <div className="pp-form-group">
                        <label>Member ID <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="text"
                          placeholder="ABC123456"
                          value={data.memberId}
                          onChange={(e) => updateField('memberId', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pp-upload-row">
                      <div className="pp-form-group">
                        <label>Front of Card <span style={{ color: '#ef4444' }}>*</span></label>
                        <div 
                          className={`pp-upload-zone ${data.insuranceFront ? 'has-file' : ''}`} 
                          style={{ padding: '1.5rem' }}
                          onClick={() => document.getElementById('insFront').click()}
                        >
                          <input 
                            type="file" 
                            id="insFront"
                            accept="image/*" 
                            hidden 
                            onChange={(e) => updateField('insuranceFront', e.target.files[0]?.name || null)} 
                          />
                          <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                          <p style={{ fontSize: '0.8rem' }}>{data.insuranceFront || 'Front of Card'}</p>
                        </div>
                      </div>
                      <div className="pp-form-group">
                        <label>Back of Card <span style={{ color: '#ef4444' }}>*</span></label>
                        <div 
                          className={`pp-upload-zone ${data.insuranceBack ? 'has-file' : ''}`} 
                          style={{ padding: '1.5rem' }}
                          onClick={() => document.getElementById('insBack').click()}
                        >
                          <input 
                            type="file" 
                            id="insBack"
                            accept="image/*" 
                            hidden 
                            onChange={(e) => updateField('insuranceBack', e.target.files[0]?.name || null)} 
                          />
                          <div className="pp-upload-icon" style={{ width: 40, height: 40, borderRadius: 10 }}><Camera size={18} /></div>
                          <p style={{ fontSize: '0.8rem' }}>{data.insuranceBack || 'Back of Card'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="pp-btn-secondary"
                  onClick={() => updateField('hasSecondary', !data.hasSecondary)}
                  style={{ marginBottom: '1rem', width: 'auto', padding: '0.75rem 1.25rem' }}
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
              </>
            )}
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
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
                <div style={{ marginTop: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Select Time Slot (24h)
                  </label>
                </div>
                
                <div className="pp-time-dial-container">
                  <div className="pp-dial-highlight" />
                  
                  <WheelColumn 
                    label="Hours"
                    values={Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'))}
                    selectedValue={dialHour}
                    onChange={(val) => {
                      setDialHour(val);
                      updateField('selectedTime', `${val}:${dialMinute}`);
                    }}
                  />

                  <div className="pp-dial-separator">:</div>

                  <WheelColumn 
                    label="Minutes"
                    values={['00', '30']}
                    selectedValue={dialMinute}
                    onChange={(val) => {
                      setDialMinute(val);
                      updateField('selectedTime', `${dialHour}:${val}`);
                    }}
                  />
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem' }}>
                    Selected Appointment Time: {data.selectedTime || `${dialHour}:${dialMinute}`}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Payment Method</h2>
            <p className="pp-step-desc">Choose how you&apos;d like to pay for your service.</p>

            <div className="pp-payment-methods" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                { id: 'Credit Card', icon: <CreditCard size={18} />, label: 'Card' },
                { id: 'PayPal', icon: <Wallet size={18} />, label: 'PayPal' },
                { id: 'Cash', icon: <DollarSign size={18} />, label: 'Cash' }
              ].map(m => (
                <button
                  key={m.id}
                  className={`pp-btn-secondary ${data.paymentMethod === m.id ? 'active' : ''}`}
                  onClick={() => updateField('paymentMethod', m.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0.5rem',
                    background: data.paymentMethod === m.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: data.paymentMethod === m.id ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    color: data.paymentMethod === m.id ? 'white' : '#94a3b8'
                  }}
                >
                  {m.icon}
                  <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{m.label}</span>
                </button>
              ))}
            </div>

            {data.paymentMethod === 'Credit Card' && (
              <>
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
              </>
            )}

            {data.paymentMethod === 'PayPal' && (
              <div style={{ padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <Wallet size={48} color="#818cf8" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>PayPal Checkout</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  You will be redirected to PayPal to securely authorize your payment after confirmation.
                </p>
              </div>
            )}

            {data.paymentMethod === 'Cash' && (
              <div style={{ padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <DollarSign size={48} color="#10b981" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Cash Pay</h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Please have the exact amount ready at the time of your appointment. Our phlebotomists do not carry change.
                </p>
              </div>
            )}

            <div className="pp-payment-notice">
              <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
              <p>Your payment information is secured and sent for Admin Approval. No charge will be made until service is rendered.</p>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="step7" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h2>Review Your Booking</h2>
            <p className="pp-step-desc">Please confirm all details before submitting.</p>

            <div className="pp-review-section">
              <div className="pp-review-row">
                <span className="pp-review-label">Selected Test</span>
                <span className="pp-review-value" style={{ color: '#818cf8', fontWeight: 800 }}>
                  {data.selectedTest?.title || '—'} (${parseFloat(data.selectedTest?.price || 0).toFixed(2)})
                </span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Service Address</span>
                <span className="pp-review-value">
                  {data.houseNumber}, {data.address}
                  {data.landmark && <><br /><small style={{ opacity: 0.7 }}>Landmark: {data.landmark}</small></>}
                  <br />{data.city}, {data.state} {data.zipCode}
                </span>
              </div>
              <div className="pp-review-row">
                <span className="pp-review-label">Doctor&apos;s Order</span>
                <span className="pp-review-label">{data.orderFile || 'Not provided'}</span>
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
                  {data.paymentMethod === 'Credit Card' ? (
                    <>
                      <CreditCard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      •••• {data.cardNumber.slice(-4) || '••••'}
                    </>
                  ) : (
                    data.paymentMethod
                  )}
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
          <div className="pp-wizard-header">
            <button className="pp-wizard-back" onClick={step > 1 ? handleBack : () => navigate('/portal/patient/dashboard', { replace: true })}>
              <ArrowLeft size={18} />
              {step > 1 ? 'Back' : 'Exit'}
            </button>
            <span className="pp-wizard-step-label">Step {step} of {STEPS.length}</span>
          </div>

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
                ) : step === 7 ? (
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
