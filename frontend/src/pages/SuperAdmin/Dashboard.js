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
            <motion.h1 
                variants={itemVariants}
                style={{ fontSize: '1.8rem', marginBottom: '2rem', fontWeight: '700' }}
            >
                Master Control Dashboard
            </motion.h1>

            {/* KPI Tiles */}
            <motion.div className="admin-stats-grid" variants={containerVariants}>
                {Object.entries(kpiData).map(([key, data]) => (
                    <motion.div 
                        key={key} 
                        className="kpi-card"
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                        <span className="kpi-label">{key.replace('_', ' ').toUpperCase()}</span>
                        <div className="kpi-value">
                            <AnimatedCounter value={data.value} />
                        </div>
                        <div className={`kpi-trend trend-${data.trend}`}>
                            {data.trend === 'up' ? '▲' : '▼'} {data.change}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="dashboard-grid-lower">
                {/* Left Column: Activity & Signups */}
                <motion.div 
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    variants={containerVariants}
                >
                    {/* Today's Activity */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Today's Operating Activity</h2>
                            <button 
                                className="action-btn" 
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                onClick={() => navigate('/superadmin/activity-log')}
                            >
                                View Log
                            </button>
                        </div>
                        <div className="module-body">
                            <AnimatePresence>
                                {activityData.map((item, idx) => (
                                    <motion.div 
                                        key={item.id} 
                                        className="activity-item"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div className="activity-icon">
                                            {item.type === 'appointment' ? '📅' : item.type === 'route' ? '🚚' : '🏢'}
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-title">{item.title}</div>
                                            <div className="activity-meta">{item.time} • {item.type}</div>
                                        </div>
                                        <div className="activity-status">{item.status}</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* New Signups Overview */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Recent Network Growth</h2>
                        </div>
                        <div className="module-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', textAlign: 'center' }}>
                            {Object.entries(signupData).map(([role, count]) => (
                                <motion.div 
                                    key={role} 
                                    style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}
                                    whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }}
                                >
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--admin-accent)' }}>
                                        <AnimatedCounter value={count} duration={1.5} />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'capitalize', color: 'var(--admin-text-secondary)', marginTop: '0.25rem' }}>
                                        {role.replace('_', ' ')}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Column: Alerts & Quick Actions */}
                <motion.div 
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                    variants={containerVariants}
                >
                    {/* System Alerts */}
                    <motion.div 
                        className="admin-module alert-module" 
                        variants={itemVariants}
                    >
                        <div className="module-header">
                            <h2 className="module-title" style={{ color: '#ef4444' }}>Critical System Alerts</h2>
                        </div>
                        <div className="module-body">
                            {alertData.map(alert => (
                                <motion.div 
                                    key={alert.id} 
                                    className={`alert-item urgency-${alert.urgency}`}
                                    whileHover={{ x: 5 }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{alert.msg}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Source: {alert.type.toUpperCase()} System</div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', background: 'white', color: 'black', height: 'fit-content', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                        {alert.urgency}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Access */}
                    <motion.div className="admin-module" variants={itemVariants}>
                        <div className="module-header">
                            <h2 className="module-title">Operational Quick Actions</h2>
                        </div>
                        <div className="module-body">
                            <div className="quick-actions-grid">
                                {[
                                    { label: '➕ New Promo Offer', path: '/superadmin/offers' },
                                    { label: '👥 Onboard Physician', path: '/superadmin/crm' },
                                    { label: '🤝 Approve Affiliate', path: '/superadmin/portals' },
                                    { label: '🩸 Phlebotomy Ops', path: '/superadmin/phlebotomy' },
                                    { label: '🧪 Audit LIS Link', path: '/superadmin/integrations' },
                                    { label: '📦 View Storage', path: '/superadmin/commerce' }
                                ].map((action, i) => (
                                    <motion.button 
                                        key={i}
                                        className="action-btn" 
                                        onClick={() => navigate(action.path)}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {action.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SuperAdminDashboard;
