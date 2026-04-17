import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, ArrowRight, AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import './PatientPortal.css';

const PatientAuth = () => {
  const [mode, setMode] = useState('login'); // login | signup | otp | forgot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyMethod, setVerifyMethod] = useState('email'); 
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(59);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOtpChange = (idx, val) => {
    if (val.length > 1) return;
    const copy = [...otpValues];
    copy[idx] = val;
    setOtpValues(copy);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('patient_token', 'demo_token');
      localStorage.setItem('patient_user', JSON.stringify({ name: 'John Doe', email: form.email }));
      navigate('/portal/patient/dashboard');
    }, 1500);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    // Automatically trigger email OTP after signup
    handleMethodSelect('email');
  };

  const handleMethodSelect = async (method) => {
    setVerifyMethod(method);
    setLoading(true);
    setError('');

    try {
      if (method === 'email') {
        const response = await fetch('http://localhost:8000/api/patients/request-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send email code.');
        
        setMode('otp');
        startOtpTimer();
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const startOtpTimer = () => {
    setOtpTimer(59);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpVerify = async () => {
    const code = otpValues.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/patients/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          email: form.email,
          token: code,
          method: verifyMethod,
          name: form.name
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid verification code.');

      setLoading(false);
      localStorage.setItem('patient_token', data.token);
      localStorage.setItem('patient_user', JSON.stringify(data.user));
      navigate('/portal/patient/dashboard');
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = verifyMethod === 'email' ? { email: form.email } : { phone: form.phone };
      const response = await fetch('http://localhost:8000/api/patients/request-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend code.');
      }

      setLoading(false);
      startOtpTimer();
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!form.email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMode('login');
    }, 1500);
  };

  const renderContent = () => {
    switch (mode) {

      case 'otp':
        return (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="pp-auth-logo">
              <div className="pp-auth-logo-icon">
                <Droplets size={28} />
              </div>
              <h2>{verifyMethod === 'email' ? 'Verify Email' : 'Verify App Code'}</h2>
              <p>{verifyMethod === 'email' ? `We sent a code to ${form.email}` : 'Enter the 6-digit code from your app'}</p>
            </div>

            {error && (
              <div className="pp-auth-error">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="pp-otp-grid">
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  className="pp-otp-input"
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                />
              ))}
            </div>

            {verifyMethod === 'email' && (
              <div className="pp-otp-timer">
                {otpTimer > 0 ? (
                  <span>Resend code in 0:{otpTimer.toString().padStart(2, '0')}</span>
                ) : (
                  <button type="button" onClick={handleResendOtp} disabled={loading}>Resend Code</button>
                )}
              </div>
            )}

            <button
              className="pp-btn-primary"
              onClick={handleOtpVerify}
              disabled={loading}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? <div className="pp-spinner" /> : <><ArrowRight size={18} /> Verify & Continue</>}
            </button>

            <div className="pp-auth-footer">
              <p>
                Wrong email?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Go Back</button>
              </p>
            </div>
          </motion.div>
        );

      case 'forgot':
        return (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="pp-auth-logo">
              <div className="pp-auth-logo-icon">
                <Droplets size={28} />
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email to receive a reset link</p>
            </div>

            {error && (
              <div className="pp-auth-error">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="pp-auth-form">
              <div className="pp-form-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <button className="pp-btn-primary" type="submit" disabled={loading}>
                {loading ? <div className="pp-spinner" /> : <><ArrowRight size={18} /> Send Reset Link</>}
              </button>
            </form>

            <div className="pp-auth-footer">
              <p>
                Remember your password?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
              </p>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'signup' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signup' ? -30 : 30 }}
          >
            <div className="pp-auth-logo">
              <div className="pp-auth-logo-icon">
                <Droplets size={28} />
              </div>
              <h2>Patient Portal</h2>
              <p>{mode === 'login' ? 'Sign in to manage your appointments' : 'Create your account to get started'}</p>
            </div>

            <div className="pp-auth-tabs">
              <button
                className={`pp-auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`pp-auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); }}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="pp-auth-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form
              onSubmit={mode === 'login' ? handleLogin : handleSignup}
              className="pp-auth-form"
            >
              {mode === 'signup' && (
                <div className="pp-form-group">
                  <label>Full Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="pp-form-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {mode === 'signup' && (
                <div className="pp-form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="pp-form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    style={{
                      background: 'none', border: 'none', color: '#818cf8',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button className="pp-btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <div className="pp-spinner" />
                ) : (
                  <>
                    <ArrowRight size={18} />
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div className="pp-auth-footer">
              {mode === 'login' ? (
                <p>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
                </p>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="pp-wrapper">
      <div className="pp-mesh-bg">
        <div className="pp-mesh-blob blob-1" />
        <div className="pp-mesh-blob blob-2" />
      </div>
      <div className="pp-content">
        <div className="pp-auth-page" onClick={(e) => {
          if (e.target.className === 'pp-auth-page') navigate(-1);
        }}>
          <div className="pp-auth-card">
            <button
              className="pp-auth-close"
              onClick={() => navigate(-1)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAuth;
