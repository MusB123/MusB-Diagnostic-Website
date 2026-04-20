import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  Beaker, 
  MapPin, 
  Calendar, 
  Clock,
  Droplets,
  Tag,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Home,
  Building2,
  AlertCircle,
  Stethoscope,
  Heart,
  Hotel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingsAPI, catalogAPI } from '../../services/api';
import './Booking.css';

const Booking = () => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    testId: '',
    date: '',
    timeSlot: '',
    visitType: 'home',
    address: '',
    zipCode: '',
    cityState: '',
    streetAddress: ''
  });

  useEffect(() => {
    const fetchTests = async () => {
      const res = await catalogAPI.getTests();
      if (res.ok) setTests(res.data);
    };
    fetchTests();
    
    const urlParams = new URLSearchParams(window.location.search);
    const testIdFromUrl = urlParams.get('test');
    if (testIdFromUrl) {
      setFormData(prev => ({ ...prev, testId: testIdFromUrl }));
      setStep(2); // Jump to step 2 if test is already selected
    }
  }, []);

  const selectedTestData = useMemo(() => {
    return tests.find(t => String(t.id) === String(formData.testId));
  }, [tests, formData.testId]);

  // Sync logic for service types
  useEffect(() => {
    if (formData.visitType !== 'lab' && tests.length > 0) {
      // Find the mobile phlebotomy service
      const phlebTest = tests.find(t => 
        t.title.toLowerCase().includes('mobile phlebotomy')
      );
      
      // Auto-select if nothing is selected or if we just switched to a home-based type
      if (phlebTest && (!formData.testId || formData.testId === '')) {
        setFormData(prev => ({ ...prev, testId: String(phlebTest.id) }));
      }
    }
  }, [formData.visitType, tests, formData.testId]);
  
  const handleZipLookup = async (zip) => {
    if (zip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (response.ok) {
          const data = await response.json();
          const place = data.places[0];
          const combined = `${place['place name']}, ${place['state abbreviation']}`;
          setFormData(prev => ({ ...prev, cityState: combined }));
        }
      } catch (err) {
        console.error("Zip lookup failed", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // Combine split address fields for submission
    const finalAddress = formData.visitType === 'home' 
      ? `${formData.streetAddress}, ${formData.cityState} ${formData.zipCode}`
      : formData.address;

    const res = await bookingsAPI.createBooking({
      ...formData,
      address: finalAddress
    });
    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      alert("Failed to confirm booking. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill trigger for zip code
    if (name === 'zipCode' && value.length === 5) {
      handleZipLookup(value);
    }
  };

  const handleServiceTypeChange = (type) => {
    setFormData(prev => ({ ...prev, visitType: type }));
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const validateStep = () => {
    if (step === 1) {
      return formData.fullName && formData.phone && formData.email;
    }
    if (step === 2) {
      const isAddressValid = formData.visitType === 'lab' || 
        (formData.zipCode && formData.cityState && formData.streetAddress);
      return formData.testId && isAddressValid;
    }
    return true;
  };

  const steps = [
    { id: 1, label: 'Profile' },
    { id: 2, label: 'Service' },
    { id: 3, label: 'Schedule' }
  ];

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  if (submitted) {
    return (
      <div className="section fade-in">
        <div className="booking-container">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass booking-form-glass text-center" 
            style={{ padding: '4rem' }}
          >
            <div className="success-check">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="section-title" style={{ marginBottom: '1rem', background: 'none', WebkitTextFillColor: 'var(--primary)' }}>Booking Confirmed!</h1>
            <p className="mb-4">Thank you for choosing MusB Diagnostics, <strong>{formData.fullName}</strong>.</p>
            <div className="glass mt-4 p-4 text-left" style={{ background: 'rgba(11, 48, 81, 0.02)' }}>
              <p className="text-sm"><strong>Appointment ID:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p className="text-sm"><strong>Date:</strong> {formData.date} ({formData.timeSlot})</p>
              <p className="text-sm"><strong>Service:</strong> {selectedTestData?.title}</p>
            </div>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary mt-5">Return to Home</button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="section fade-in">
      <div className="catalog-header text-center mb-5">
        <h1 className="section-title">Schedule Your Visit</h1>
        <p className="section-subtitle">Premium diagnostic services delivered with expert care.</p>
      </div>

      <div className="booking-container">
        {/* Stepper */}
        <div className="booking-stepper">
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={`step-box ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
            >
              {step > s.id ? <CheckCircle2 size={20} /> : s.id}
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Global Summary Bar (Steps 2 and 3) */}
        {step > 1 && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="booking-summary-bar"
          >
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="text-sm font-bold">{formData.fullName}</span>
            </div>
            {selectedTestData && (
              <div className="flex items-center gap-2">
                <Beaker size={16} />
                <span className="text-sm font-bold">{selectedTestData.title}</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="booking-form-wrapper">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="glass booking-form-glass"
            >
              {/* STEP 1: PERSONAL INFO */}
              {step === 1 && (
                <div className="form-step">
                  <h3 className="mb-4 flex items-center gap-2">
                    <User className="text-primary" /> Patient Details
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <div className="input-with-icon">
                        <User className="input-icon" size={18} />
                        <input 
                          type="text" 
                          name="fullName"
                          placeholder="Your full legal name" 
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <div className="input-with-icon">
                        <Phone className="input-icon" size={18} />
                        <input 
                          type="tel" 
                          name="phone"
                          placeholder="Contact number" 
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-with-icon">
                      <Mail className="input-icon" size={18} />
                      <input 
                        type="email" 
                        name="email"
                        placeholder="For appointment updates" 
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SERVICE SELECTION */}
              {step === 2 && (
                <div className="form-step">
                  <h3 className="mb-4 flex items-center gap-2">
                    <Beaker className="text-primary" /> Choose Service
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Visit Type</label>
                    <div className="service-cards">
                      <div 
                        className={`service-card ${formData.visitType === 'home' ? 'active' : ''}`}
                        onClick={() => handleServiceTypeChange('home')}
                      >
                        <Home size={24} className={formData.visitType === 'home' ? 'text-primary' : 'text-muted'} />
                        <div>
                          <h4>Mobile Phlebotomy</h4>
                          <p>Comfort at your home</p>
                        </div>
                      </div>
                      <div 
                        className={`service-card ${formData.visitType === 'lab' ? 'active' : ''}`}
                        onClick={() => handleServiceTypeChange('lab')}
                      >
                        <Building2 size={24} className={formData.visitType === 'lab' ? 'text-primary' : 'text-muted'} />
                        <div>
                          <h4>Lab Visit</h4>
                          <p>At our facility</p>
                        </div>
                      </div>
                      <div 
                        className={`service-card ${formData.visitType === 'assisted_living' ? 'active' : ''}`}
                        onClick={() => handleServiceTypeChange('assisted_living')}
                      >
                        <Hotel size={24} className={formData.visitType === 'assisted_living' ? 'text-primary' : 'text-muted'} />
                        <div>
                          <h4>Assisted Living</h4>
                          <p>Care facility visit</p>
                        </div>
                      </div>
                      <div 
                        className={`service-card ${formData.visitType === 'physician' ? 'active' : ''}`}
                        onClick={() => handleServiceTypeChange('physician')}
                      >
                        <Stethoscope size={24} className={formData.visitType === 'physician' ? 'text-primary' : 'text-muted'} />
                        <div>
                          <h4>Physician</h4>
                          <p>Doctors clinic/office</p>
                        </div>
                      </div>
                      <div 
                        className={`service-card ${formData.visitType === 'non_profit' ? 'active' : ''}`}
                        onClick={() => handleServiceTypeChange('non_profit')}
                      >
                        <Heart size={24} className={formData.visitType === 'non_profit' ? 'text-primary' : 'text-muted'} />
                        <div>
                          <h4>Non-Profit</h4>
                          <p>Community outreach</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.visitType !== 'lab' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="form-group mt-3"
                    >
                      <label className="form-label">Service Location</label>
                      <div className="address-split-grid">
                        <div className="input-with-icon">
                          <MapPin className="input-icon" size={18} />
                          <input 
                            type="text" 
                            name="zipCode"
                            placeholder="Zip Code" 
                            value={formData.zipCode}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="input-with-icon">
                          <MapPin className="input-icon" size={18} style={{ opacity: 0.5 }} />
                          <input 
                            type="text" 
                            name="cityState"
                            placeholder="City, State" 
                            value={formData.cityState}
                            readOnly
                            style={{ background: 'rgba(0,0,0,0.02)' }}
                          />
                        </div>
                      </div>
                      <div className="input-with-icon mt-2">
                        <MapPin className="input-icon" size={18} />
                        <input 
                          type="text" 
                          name="streetAddress"
                          placeholder="Street Address and House Number" 
                          value={formData.streetAddress}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="form-group mt-4">
                    <label className="form-label">Select Test or Package</label>
                    <div className="input-with-icon">
                      <Beaker className="input-icon" size={18} />
                      <select name="testId" value={formData.testId} onChange={handleChange} required>
                        <option value="">-- Search for a test --</option>
                        {tests
                          .filter(test => !test.title.toLowerCase().includes('mobile phlebotomy'))
                          .map(test => (
                            <option key={test.id} value={test.id}>{test.title}</option>
                          ))}
                      </select>
                    </div>

                    {selectedTestData && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="test-detail-card"
                      >
                        <div className="test-detail-header">
                          <h4 className="test-detail-title">{selectedTestData.title}</h4>
                          <span className="price-badge-premium">${selectedTestData.price}</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <div className="detail-label">
                              <Droplets size={14} className="detail-icon" />
                              <span>Sample</span>
                            </div>
                            <span className="detail-value">{selectedTestData.sample_type || 'Blood'}</span>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">
                              <Clock size={14} className="detail-icon" />
                              <span>TAT</span>
                            </div>
                            <span className="detail-value">{selectedTestData.turnaround || '24 hrs'}</span>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">
                              <Tag size={14} className="detail-icon" />
                              <span>Category</span>
                            </div>
                            <span className="detail-value">{selectedTestData.category_name}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULING */}
              {step === 3 && (
                <div className="form-step">
                  <h3 className="mb-4 flex items-center gap-2">
                    <Calendar className="text-primary" /> Schedule
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Preferred Date</label>
                      <div className="input-with-icon">
                        <Calendar className="input-icon" size={18} />
                        <input 
                          type="date" 
                          name="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Window</label>
                      <div className="input-with-icon">
                        <Clock className="input-icon" size={18} />
                        <select name="timeSlot" value={formData.timeSlot} onChange={handleChange} required>
                          <option value="">-- Select Window --</option>
                          <option value="8:00 AM - 10:00 AM">Early Morning (8-10 AM)</option>
                          <option value="10:00 AM - 12:00 PM">Morning (10-12 PM)</option>
                          <option value="12:00 PM - 2:00 PM">Mid day (12-2 PM)</option>
                          <option value="2:00 PM - 4:00 PM">Afternoon (2-4 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-4 mt-2" style={{ background: 'rgba(211, 32, 41, 0.05)', border: '1px dashed var(--secondary)' }}>
                    <div className="flex gap-3">
                      <AlertCircle className="text-secondary" />
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--secondary)' }}>Terms & Confirmation</p>
                        <p className="text-xs">By confirming, you agree to our service terms. Our phlebotomist will contact you 15 minutes before arrival.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="booking-nav">
                {step > 1 ? (
                  <button type="button" onClick={prevStep} className="btn btn-outline">
                    <ChevronLeft size={18} /> Back
                  </button>
                ) : <div />}
                
                {step < 3 ? (
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Next Step <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} className="btn btn-secondary" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Booking'}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Booking;
