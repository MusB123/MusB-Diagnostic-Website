import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, Microscope, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { researchAPI } from '../../services/api';
import './DiagnosticPortal.css';

const DiagnosticLogin = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [credentials, setCredentials] = useState({
        email: '', password: '', name: '', partner_org: '', contact: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isSignup ? '/api/research/portal/signup/' : '/api/research/portal/login/';
        
        try {
            const payload = { ...credentials };
            if (isSignup) payload.lab_name = credentials.partner_org;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('diag_token', data.token);
                localStorage.setItem('diag_user', JSON.stringify(data.user));
                navigate('/portal/diagnostic/dashboard');
            } else {
                setError(data.error || 'Authentication failed.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="diag-portal-wrapper">
             <div className="diag-bg-elements">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <div className="diag-auth-container">
                <motion.div 
                    className="diag-auth-card glass shadow-2xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <button className="diag-back-btn" onClick={() => navigate('/early-diagnostics')}>
                        <ArrowLeft size={16} /> Back to Site
                    </button>

                    <div className="diag-auth-header">
                        <div className="diag-logo-wrap mb-6">
                            <ShieldCheck size={48} className="text-secondary animate-pulse-slow" />
                        </div>
                        <h2 className="text-3xl font-black mb-2">DIAGNOSTIC GATEWAY</h2>
                        <p className="text-sm opacity-60">
                            {isSignup ? 'Register your lab for technology validation' : 'Authenticating clinical research partners'}
                        </p>
                    </div>

                    {error && (
                        <div className="diag-error-box bg-red-500/10 border border-red-500/30 p-3 rounded-xl mb-6 flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="diag-auth-form space-y-4">
                        {isSignup && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="diag-form-group">
                                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-1 block">Full Name</label>
                                    <input name="name" type="text" className="diag-input" placeholder="Dr. Jane Smith" value={credentials.name} onChange={handleChange} required />
                                </div>
                                <div className="diag-form-group">
                                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-1 block">Organization</label>
                                    <input name="partner_org" type="text" className="diag-input" placeholder="BioTech Lab" value={credentials.partner_org} onChange={handleChange} required />
                                </div>
                            </div>
                        )}
                        <div className="diag-form-group">
                            <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-1 block">Email Address</label>
                            <input name="email" type="email" className="diag-input" placeholder="jane@biotech.com" value={credentials.email} onChange={handleChange} required />
                        </div>
                        <div className="diag-form-group">
                            <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-1 block">Laboratory Access Key</label>
                            <input name="password" type="password" className="diag-input" placeholder="••••••••" value={credentials.password} onChange={handleChange} required />
                        </div>

                        <button type="submit" className="diag-btn-hero w-100" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isSignup ? 'Request Access' : 'Authenticate & Enter')}
                        </button>
                    </form>

                    <div className="diag-auth-footer mt-8 pt-6 border-t border-white/5 text-center">
                        {isSignup ? (
                            <p className="text-sm opacity-60">Already registered? <button className="text-secondary font-bold" onClick={() => setIsSignup(false)}>Sign In</button></p>
                        ) : (
                            <p className="text-sm opacity-60">New partner? <button className="text-secondary font-bold" onClick={() => setIsSignup(true)}>Register Lab</button></p>
                        )}
                    </div>

                    <div className="diag-testing-summary mt-8 space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-40 flex items-center gap-2">
                           <Microscope size={12} /> Diagnostic Panel Access
                        </p>
                        <div className="grid grid-cols-1 gap-2 text-[12px]">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                                <span className="opacity-50">Admin: admin@musb.com</span>
                                <span className="text-secondary font-mono">MusBAdmin2026</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-50">Client: developer@biotech.com</span>
                                <span className="text-secondary font-mono">BioTech2026</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .diag-portal-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: #0f172a;
                }
                .diag-bg-elements {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.15;
                }
                .orb-1 {
                    width: 500px;
                    height: 500px;
                    background: var(--diag-stellar-primary);
                    top: -100px;
                    left: -100px;
                }
                .orb-2 {
                    width: 400px;
                    height: 400px;
                    background: var(--diag-stellar-secondary);
                    bottom: -50px;
                    right: -50px;
                }
                .diag-auth-container {
                    width: 100%;
                    max-width: 480px;
                    padding: 20px;
                    z-index: 10;
                }
                .diag-auth-card {
                    padding: 40px;
                    border-radius: 32px;
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .diag-back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: white;
                    opacity: 0.5;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    margin-bottom: 30px;
                    transition: all 0.2s;
                }
                .diag-back-btn:hover { opacity: 1; }
                .diag-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    outline: none;
                    transition: border-color 0.3s;
                }
                .diag-input:focus { border-color: var(--secondary); }
                .diag-btn-hero {
                    background: linear-gradient(135deg, var(--diag-stellar-primary) 0%, var(--diag-stellar-secondary) 100%);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .diag-btn-hero:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(var(--secondary-rgb), 0.3);
                }
            `}</style>
        </div>
    );
};

export default DiagnosticLogin;
