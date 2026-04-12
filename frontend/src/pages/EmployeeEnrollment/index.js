import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import './EmployeeEnrollment.css';

const EmployeeEnrollment = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('verifying'); // verifying, active, invalid
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        // Mock verification logic for now
        // In a real app, this would call GET /api/enroll/verify/:token
        const verifyToken = async () => {
            setLoading(true);
            setTimeout(() => {
                // Simulate successful verification for any token in this demo
                setEmployeeData({
                    full_name: "New Employee",
                    company_name: "MusB Corporate Partner",
                    program_type: "Annual Health Coverage"
                });
                setStatus('active');
                setLoading(false);
            }, 1500);
        };
        verifyToken();
    }, [token]);

    if (loading) {
        return (
            <div className="enrollment-loading-container">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="enrollment-spinner"
                />
                <p>Verifying secure invitation...</p>
            </div>
        );
    }

    return (
        <div className="enrollment-page">
            <div className="enrollment-card-wrapper">
                <AnimatePresence mode="wait">
                    {status === 'active' ? (
                        <motion.div 
                            key="active"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="enrollment-card glass"
                        >
                            <div className="enrollment-header">
                                <div className="brand-badge">
                                    <ShieldCheck size={18} /> Secure Enrollment
                                </div>
                                <h1>Welcome to MusB Diagnostics</h1>
                                <p className="subtitle">You've been invited by <strong>{employeeData.company_name}</strong> to join their corporate health program.</p>
                            </div>

                            <div className="program-summary">
                                <div className="summary-item">
                                    <CheckCircle2 size={20} color="var(--emerald-500)" />
                                    <span>{employeeData.program_type}</span>
                                </div>
                                <div className="summary-item">
                                    <CheckCircle2 size={20} color="var(--emerald-500)" />
                                    <span>Onsite & Mobile Phlebotomy Access</span>
                                </div>
                            </div>

                            <form className="enrollment-form" onSubmit={(e) => e.preventDefault()}>
                                <div className="form-section-title">Complete Your Basic Profile</div>
                                
                                <div className="input-group-modern">
                                    <User size={18} className="input-icon" />
                                    <input type="text" placeholder="Full Name (Legal)" defaultValue={employeeData.full_name} required />
                                </div>

                                <div className="input-group-modern">
                                    <Mail size={18} className="input-icon" />
                                    <input type="email" placeholder="Preferred Email" required />
                                </div>

                                <div className="agreement-text">
                                    By clicking "Get Started", you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
                                </div>

                                <button className="btn btn-primary submit-enroll-btn">
                                    Get Started <ArrowRight size={18} />
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enrollment-card error glass"
                        >
                            <AlertCircle size={48} color="#ef4444" />
                            <h2>Invitation Invalid</h2>
                            <p>This invitation link has expired or is invalid. Please contact your administrator for a new one.</p>
                            <Link to="/" className="btn btn-outline">Back to Home</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="enrollment-footer">
                <img src="/images/MusB_Diagnostic_Logo.webp" alt="MusB Diagnostics" className="footer-logo" />
                <p>&copy; 2026 MusB Diagnostics. All rights reserved.</p>
            </div>
        </div>
    );
};

export default EmployeeEnrollment;
