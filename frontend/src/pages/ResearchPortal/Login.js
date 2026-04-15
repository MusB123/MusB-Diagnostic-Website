import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Microscope, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/api';
import './ResearchPortal.css';

const ResearchLoginModal = ({ isOpen, onClose, customTitle, customSubtitle }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '', password: '', name: '', lab_name: '', lab_location: '', lab_contact: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Check query params for branding if standalone
    const query = new URLSearchParams(location.search);
    const type = query.get('type');
    
    const displayTitle = customTitle || (type === 'diagnostic' ? 'Diagnostic Portal Login' : (isSignup ? 'Partner Registration' : 'Researcher Login'));
    const displaySubtitle = customSubtitle || (type === 'diagnostic' ? 'Access your diagnostic validation projects' : (isSignup ? 'Join the MusB corporate wellness network' : 'Access laboratory & health systems'));

    const isStandalone = isOpen === undefined;
    if (!isOpen && !isStandalone) return null;

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isSignup ? '/api/research/portal/signup/' : '/api/research/portal/login/';
        
        try {
            const response = await api.post(endpoint, credentials);
            const data = response.data;

            if (response.status === 200 || response.status === 201) {
                localStorage.setItem('res_token', data.token);
                localStorage.setItem('res_user', JSON.stringify(data.user));
                navigate('/portal/research/dashboard');
            } else {
                setError(data.error || 'Authentication failed. Please check your data.');
            }
        } catch (err) {
            console.error('Research Login Error:', err);
            setError(err.response?.data?.error || 'Server connection error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const loginContent = (
        <motion.div 
            className="res-light-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={isStandalone ? { margin: 'auto', maxWidth: isSignup ? '680px' : '520px', position: 'relative' } : { position: 'relative' }}
        >
            {!isStandalone && <button className="res-modal-close" onClick={onClose} style={{ color: '#94a3b8' }}>&times;</button>}
            
            <div className="res-auth-toggle">
                <button 
                    type="button"
                    className={`res-toggle-btn ${!isSignup ? 'active' : ''}`}
                    onClick={() => { setIsSignup(false); setError(''); }}
                >
                    Sign In
                </button>
                <button 
                    type="button"
                    className={`res-toggle-btn ${isSignup ? 'active' : ''}`}
                    onClick={() => { setIsSignup(true); setError(''); }}
                >
                    Sign Up
                </button>
            </div>

            <div className="text-center mb-4">
                <h2 className="res-modal-title">{displayTitle}</h2>
                <p className="res-modal-subtitle">{displaySubtitle}</p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className={isSignup ? 'res-form-grid' : 'space-y-6'}>
                {isSignup && (
                    <>
                        <div className="res-form-group">
                            <label className="res-light-label">Principal Investigator Name</label>
                            <input name="name" type="text" className="res-light-input" placeholder="John Doe" value={credentials.name} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group">
                            <label className="res-light-label">Company / Lab Name</label>
                            <input name="lab_name" type="text" className="res-light-input" placeholder="MusB Health Corp" value={credentials.lab_name} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group">
                            <label className="res-light-label">Email Address</label>
                            <input name="email" type="email" className="res-light-input" placeholder="hr@company.com" value={credentials.email} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group">
                            <label className="res-light-label">Office Contact Number</label>
                            <input name="lab_contact" type="text" className="res-light-input" placeholder="+1 (555) 000-0000" value={credentials.lab_contact} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group res-col-span-2">
                            <label className="res-light-label">Office Location</label>
                            <input name="lab_location" type="text" className="res-light-input" placeholder="123 Corporate Blvd, New York, NY" value={credentials.lab_location} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group res-col-span-2">
                            <label className="res-light-label">Create Password</label>
                            <input name="password" type="password" className="res-light-input" placeholder="••••••••" value={credentials.password} onChange={handleChange} required />
                        </div>
                    </>
                )}

                {!isSignup && (
                    <>
                        <div className="res-form-group">
                            <label className="res-light-label">Email Address</label>
                            <input name="email" type="email" className="res-light-input" placeholder="name@company.com" value={credentials.email} onChange={handleChange} required />
                        </div>
                        <div className="res-form-group">
                            <label className="res-light-label">Password</label>
                            <input name="password" type="password" className="res-light-input" placeholder="••••••••" value={credentials.password} onChange={handleChange} required />
                        </div>

                        <div className="res-testing-box">
                            <h5><Microscope size={12} /> Laboratory Testing Credentials:</h5>
                            <div className="res-testing-data">Email: <span>research@musb.com</span></div>
                            <div className="res-testing-data">Pass: <span>research2026</span></div>
                        </div>
                    </>
                )}

                <div className={isSignup ? 'res-col-span-2' : ''}>
                    <button type="submit" className="res-btn-primary-alt w-full shadow-lg shadow-blue-900/20" disabled={loading} style={{ border: 'none', cursor: 'pointer' }}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignup ? 'Initialize Laboratory Account' : 'Authenticate & Access')}
                    </button>
                </div>
                
                {!isSignup && (
                    <div className="res-col-span-2">
                        <div className="res-divider !my-8"><span className="bg-white px-4 text-slate-400 font-bold text-[10px] tracking-widest">SECURE GATEWAY</span></div>
                        <button type="button" className="res-btn-google hover:shadow-md transition-all">
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="18" />
                            Sign in with Institutional Google Account
                        </button>
                    </div>
                )}
            </form>
        </motion.div>
    );

    if (isStandalone) {
        return (
            <div className="res-page-wrapper" style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
                padding: '2rem'
            }}>
                {/* Subtle light leak for aesthetic glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                {loginContent}
            </div>
        );
    }

    return (
        <div className="res-modal-overlay" onClick={onClose}>
            {loginContent}
        </div>
    );
};

export default ResearchLoginModal;
