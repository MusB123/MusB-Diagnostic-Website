import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import api from '../../api/api';
import './HubPortal.css';

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', registration_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/phleb/hubs/login/' : '/api/phleb/hubs/register/';
      const res = await api.post(endpoint, formData);
      localStorage.setItem('hub_token', res.data.token);
      localStorage.setItem('hub_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="hub-login-wrapper"
      onClick={(e) => {
        if (e.target.className === 'hub-login-wrapper') navigate(-1);
      }}
      style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hub-glass-panel" 
        style={{ width: '100%', maxWidth: '450px', padding: '3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', position: 'relative' }}
      >
        <button
          className="hub-login-close"
          onClick={() => navigate(-1)}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: '#6366f1', padding: '1rem', borderRadius: '16px', display: 'inline-flex', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}>
            <Building2 color="white" size={32} />
          </div>
          <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Hub Command</h1>
          <p style={{ color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px' }}>Enterprise Fleet Entry</p>
        </div>

        {error && <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Company Name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.2rem', borderRadius: '14px', color: '#fff', fontWeight: 600 }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={20} />
            <input 
              type="email" 
              placeholder="Admin Email" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '14px', color: '#fff', fontWeight: 600 }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={20} />
            <input 
              type="password" 
              placeholder="Access Key" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '14px', color: '#fff', fontWeight: 600 }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'linear-gradient(90deg, #6366f1, #a855f7)', color: '#fff', height: '54px', borderRadius: '14px', 
              fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)', marginTop: '0.5rem'
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>{isLogin ? 'INITIATE SESSION' : 'REGISTER HUB'} <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {isLogin ? "DON'T HAVE A HUB ACCOUNT? REGISTER" : "ALREADY REGISTERED? LOG IN"}
          </button>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>
          <ShieldCheck size={16} /> END-TO-END ENCRYPTED HUB ACCESS
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
