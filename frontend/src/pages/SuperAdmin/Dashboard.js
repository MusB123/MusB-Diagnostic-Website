import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../../components/Admin/AnimatedCounter';
import '../../styles/Admin.css';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/superadmin/dashboard-stats/');
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="admin-loading-container">
            <div className="admin-spinner"></div>
            <p>Initializing Master Control...</p>
        </div>
    );

    const kpiData = stats?.kpis || {};
    const activityData = stats?.activity || [];
    const signupData = stats?.signups || {};
    const alertData = stats?.alerts || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <motion.div 
            className="admin-dashboard"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div style={{ marginBottom: '2rem' }}>
                <motion.h1 
                    variants={itemVariants}
                    className="admin-page-title"
                    style={{ fontWeight: '800', margin: 0 }}
                >
                    Master Control Dashboard
                </motion.h1>
            </div>

            {/* KPI Section - Native Mobile Slider */}
            <div className="admin-slider-viewport">
                <div className="admin-stats-grid admin-slider-track">
                    {Object.entries(kpiData).map(([key, data]) => (
                        <motion.div 
                            key={key} 
                            className="kpi-card"
                            variants={itemVariants}
                        >
                            <span className="kpi-label">{key.replace('_', ' ')}</span>
                            <div className="kpi-value">
                                <AnimatedCounter value={data.value} />
                            </div>
                            <div className={`kpi-trend trend-${data.trend}`}>
                                {data.trend === 'up' ? '▲' : '▼'} {data.change}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Dashboard Lower Modules - Native Mobile slider */}
            <div className="admin-slider-viewport">
                <div className="dashboard-grid-lower admin-slider-track">
                    
                    {/* Activity */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Operating Activity</h2>
                            <button className="action-btn" onClick={() => navigate('/superadmin/activity-log')}>Log</button>
                        </div>
                        <div className="module-body">
                            <AnimatePresence>
                                {activityData.slice(0, 3).map((item) => (
                                    <div key={item.id} className="activity-item">
                                        <div className="activity-icon">
                                            {item.type === 'appointment' ? '📅' : '🚚'}
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-title">{item.title}</div>
                                            <div className="activity-meta">{item.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Network Growth */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Network Growth</h2>
                        </div>
                        <div className="module-body">
                            <div className="admin-scroll-row">
                                {Object.entries(signupData).map(([role, count]) => (
                                    <div key={role} className="admin-scroll-item">
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-accent)' }}>
                                            <AnimatedCounter value={count} />
                                        </div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>
                                            {role.split('_')[0]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Critical Alerts */}
                    <motion.div className="admin-module alert-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title" style={{ color: '#ef4444' }}>Critical Alerts</h2>
                        </div>
                        <div className="module-body">
                            {alertData.slice(0, 2).map(alert => (
                                <div key={alert.id} className={`alert-item urgency-${alert.urgency}`}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{alert.msg}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>SYSTEM: {alert.type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick actions */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Operational Actions</h2>
                        </div>
                        <div className="module-body">
                            <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                {[
                                    { label: 'Promo', path: '/superadmin/offers' },
                                    { label: 'Physicians', path: '/superadmin/crm' },
                                    { label: 'Fleet', path: '/superadmin/phlebotomy' },
                                    { label: 'Audit', path: '/superadmin/integrations' }
                                ].map((action, i) => (
                                    <button 
                                        key={i} 
                                        className="action-btn" 
                                        onClick={() => navigate(action.path)}
                                        style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default SuperAdminDashboard;
