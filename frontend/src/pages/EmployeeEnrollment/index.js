import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, ShieldCheck, Mail, User, PartyPopper, Check } from 'lucide-react';
import { employersAPI } from '../../services/api';
import './EmployeeEnrollment.css';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12
        }
    }
};

const EmployeeEnrollment = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('verifying'); // verifying, active, invalid
    const [employeeData, setEmployeeData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enrollmentComplete, setEnrollmentComplete] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            setLoading(true);
            try {
                const response = await employersAPI.verifyEnrollment(token);
                if (response.ok) {
                    setEmployeeData(response.data);
                    setStatus('active');
                } else {
                    if (response.data?.error === 'ALREADY_ENROLLED') {
                        setStatus('already-enrolled');
                    } else {
                        setStatus('invalid');
                    }
                }
            } catch (error) {
                console.error('Enrollment verification failed:', error);
                setStatus('invalid');
            } finally {
                setLoading(false);
            }
        };
        if (token) verifyToken();
    }, [token]);

    const handleEnrollment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await employersAPI.completeEnrollment(token, {
                full_name: employeeData.full_name,
                email: employeeData.email
            });
            
            // Simulate smooth transition
            setTimeout(() => {
                setEnrollmentComplete(true);
                setIsSubmitting(false);
            }, 1200);
        } catch (error) {
            console.error('Enrollment submission failed:', error);
            setIsSubmitting(false);
            alert('Failed to complete enrollment. Please try again.');
        }
    };

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
                    {enrollmentComplete ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="enrollment-card success-state glass"
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="success-icon-badge"
                            >
                                <PartyPopper size={40} className="party-icon" />
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                Welcome, {employeeData?.full_name}!
                            </motion.h2>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="success-msg"
                            >
                                Your enrollment in the <strong>{employeeData?.company_name}</strong> health program is complete.
                            </motion.p>
                            
                            <div className="next-steps-list">
                                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="step-item">
                                    <div className="step-check"><Check size={14} /></div>
                                    <span>Account activated successfully</span>
                                </motion.div>
                                <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="step-item">
                                    <div className="step-check"><Check size={14} /></div>
                                    <span>Wellness program link attached</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : status === 'active' ? (
                        <motion.div 
                            key="active"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="enrollment-card glass"
                        >
                            <motion.div variants={itemVariants} className="enrollment-header">
                                <div className="brand-badge">
                                    <ShieldCheck size={18} /> Secure Enrollment
                                </div>
                                <h1 className="main-title">Welcome to MusB</h1>
                                <p className="subtitle">You've been invited by <strong>{employeeData.company_name}</strong> to join their corporate health program.</p>
                            </motion.div>

                            <motion.div variants={itemVariants} className="program-summary">
                                <div className="summary-item">
                                    <div className="check-token"><Check size={12} /></div>
                                    <span>{employeeData.program_type}</span>
                                </div>
                                <div className="summary-item">
                                    <div className="check-token"><Check size={12} /></div>
                                    <span>Onsite & Mobile Access</span>
                                </div>
                            </motion.div>

                            <motion.form variants={itemVariants} className="enrollment-form" onSubmit={handleEnrollment}>
                                <div className="form-section-title">Complete Your Basic Profile</div>
                                
                                <motion.div whileFocus={{ scale: 1.02 }} className="input-group-modern">
                                    <User size={18} className="input-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Full Name (Legal)" 
                                        defaultValue={employeeData.full_name} 
                                        onChange={(e) => setEmployeeData({...employeeData, full_name: e.target.value})}
                                        required 
                                    />
                                </motion.div>

                                <motion.div whileFocus={{ scale: 1.02 }} className="input-group-modern">
                                    <Mail size={18} className="input-icon" />
                                    <input 
                                        type="email" 
                                        placeholder="Preferred Email" 
                                        defaultValue={employeeData.email}
                                        onChange={(e) => setEmployeeData({...employeeData, email: e.target.value})}
                                        required 
                                    />
                                </motion.div>

                                <div className="agreement-text">
                                    By clicking "Accept", you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit" 
                                    className={`submit-enroll-btn ${isSubmitting ? 'loading' : ''}`} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Completing...' : 'Accept & Complete Enrollment'} <ArrowRight size={18} />
                                </motion.button>
                            </motion.form>
                        </motion.div>
                    ) : status === 'already-enrolled' ? (
                        <motion.div 
                            key="already-enrolled"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enrollment-card success-state glass"
                        >
                            <ShieldCheck size={48} color="#10b981" />
                            <h2>You're All Set!</h2>
                            <p>This enrollment invitation has already been successfully completed. Your account is active and verified.</p>
                            <Link to="/" className="btn btn-primary start-journey-btn">Go to Home</Link>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="enrollment-card error glass"
                        >
                            <AlertCircle size={48} color="#ef4444" />
                            <h2>Invitation Inactive</h2>
                            <p>This invitation link is no longer active or has expired. Please contact your company administrator if you believe this is an error.</p>
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
