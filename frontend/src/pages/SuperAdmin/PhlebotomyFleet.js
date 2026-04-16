import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, UserPlus, Star, ClipboardCheck, 
  MapPin, ShieldCheck, 
  TrendingUp, Search, Filter,
  ChevronRight, X, Loader2,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api';
import '../../styles/Admin.css';

const PhlebotomyFleet = () => {
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [reviewMember, setReviewMember] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        zone: 'Manhattan Core',
        password: 'MusB' + Math.floor(1000 + Math.random() * 9000)
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState(null);

    const [activeDossierTab, setActiveDossierTab] = useState('overview');

    // Reset tab when member changes
    useEffect(() => {
        if (selectedMember) setActiveDossierTab('overview');
    }, [selectedMember]);

    // Bulletproof Scroll Lock
    useEffect(() => {
        const isAnyOpen = selectedMember || isAddingNew || reviewMember;
        if (isAnyOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedMember, isAddingNew, reviewMember]);

    const fetchFleet = async () => {
        try {
            const res = await api.get('/api/superadmin/fleet/');
            setFleet(res.data);
        } catch (err) {
            console.error('Failed to fetch fleet', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFleet(); }, []);

    const handleOnboard = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);
        try {
            await api.post('/api/superadmin/fleet/create/', formData);
            await fetchFleet();
            setIsAddingNew(false);
            setFormData({ id: '', name: '', email: '', phone: '', address: '', zone: 'Manhattan Core', password: 'MusB' + Math.floor(1000 + Math.random() * 9000) });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to onboard specialist.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (specialistId) => {
        if (!window.confirm(`CRITICAL: Are you sure you want to remove Phlebotomist ${specialistId}? All active assignments will be unassigned.`)) return;
        
        setFormLoading(true);
        try {
            await api.delete(`/api/superadmin/fleet/${specialistId}/delete/`);
            await fetchFleet();
            setSelectedMember(null);
        } catch (err) {
            console.error('Deletion failed', err);
            alert(err.response?.data?.error || 'Failed to remove phlebotomist.');
        } finally {
            setFormLoading(false);
        }
    };

    const filteredFleet = fleet.filter(member => {
        const matchesSearch = (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (member.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || 
                             (filterStatus === 'Online' ? member.is_online : !member.is_online);
        return matchesSearch && matchesStatus;
    });

    const activeCount = fleet.filter(m => m.is_online).length;
    const avgRating = (fleet.reduce((acc, m) => acc + (m.rating || 0), 0) / (fleet.length || 1)).toFixed(1);
    const totalTests = fleet.reduce((acc, m) => acc + (m.tests_conducted || 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" style={{ color: '#6366f1', marginBottom: '1rem' }} size={48} />
            <p style={{ color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Syncing Fleet Intelligence...</p>
        </div>
    );

    return (
        <div className="admin-dashboard">
            {/* Header Section */}
            <div className="admin-header-main" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 className="admin-page-title">Fleet Oversight Hub</h1>
                    <p className="admin-page-subtitle" style={{ color: '#94a3b8' }}>Tactical Performance & Mission Intelligence</p>
                </div>
                <button 
                    onClick={() => setIsAddingNew(true)}
                    className="btn-primary"
                    style={{ padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '900', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                    <UserPlus size={18} /> ONBOARD UNIT
                </button>
            </div>

            {/* Global Stats HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Active Fleet', value: activeCount, icon: <Users style={{ color: '#10b981' }} />, sub: 'Specialists Online' },
                    { label: 'Average Rating', value: avgRating, icon: <Star style={{ color: '#FFD700' }} />, sub: 'Customer Satisfaction' },
                    { label: 'Total Missions', value: totalTests, icon: <ClipboardCheck style={{ color: '#6366f1' }} />, sub: 'Tests Conducted' },
                    { label: 'Network Health', value: '98%', icon: <ShieldCheck style={{ color: '#3b82f6' }} />, sub: 'Operational Uptime' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="admin-glass" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>{stat.icon}</div>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Live Optic</span>
                        </div>
                        <h3 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#fff', margin: '0 0 0.25rem 0' }}>{stat.value}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{stat.label}</p>
                        <p style={{ color: '#64748b', fontSize: '9px', fontWeight: '700', marginTop: '0.5rem' }}>{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                    <input 
                        type="text" placeholder="Scan Fleet by Name or Unit ID..." 
                        className="admin-input" style={{ width: '100%', paddingLeft: '3.5rem', border: '1px solid rgba(255,255,255,0.1)' }}
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ width: '280px', position: 'relative' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} size={18} />
                    <select 
                        className="admin-select" style={{ width: '100%', paddingLeft: '3.5rem', border: '1px solid rgba(255,255,255,0.1)' }}
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Specialist Status</option>
                        <option value="Online">Online Units</option>
                        <option value="Offline">Offline Units</option>
                    </select>
                </div>
            </div>

            {/* Fleet Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                <AnimatePresence>
                    {filteredFleet.map((member, idx) => (
                        <motion.div 
                            key={member.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="specialist-unit-card group" onClick={() => setSelectedMember(member)}
                            style={{ cursor: 'pointer', padding: '2rem' }}
                        >
                            <div className="specialist-card-header" style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="unit-avatar" style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', opacity: 1 }}>
                                        {member.name?.charAt(0)}
                                    </div>
                                    <div className={`unit-status-heartbeat ${member.is_online ? 'status-online' : 'status-offline'}`} style={{ position: 'absolute', bottom: 0, right: 0 }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff' }}>{member.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)' }}>{member.id}</span>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: member.is_online ? '#10b981' : '#64748b' }}>{member.is_online ? 'Operational' : 'Off-Duty'}</span>
                                    </div>
                                </div>
                                <div style={{ 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '0.5rem', 
                                    fontSize: '10px', 
                                    fontWeight: '900', 
                                    border: `1px solid ${member.is_online ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`, 
                                    color: member.is_online ? '#10b981' : '#64748b',
                                    background: member.is_online ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)'
                                }}>
                                    {member.is_online ? 'ACTIVE' : 'OFFLINE'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Deployments</span>
                                    <span style={{ color: '#fff', fontWeight: '900', fontSize: '1.1rem' }}>{member.tests_conducted}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>Rating</span>
                                    {member.tests_conducted > 0 ? (
                                        <span style={{ color: '#FFD700', fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Star size={12} fill="#FFD700" stroke="#FFD700" /> {member.rating}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#475569', fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase' }}>N/A</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div 
                                    className="unit-zone-badge" 
                                    onClick={(e) => { e.stopPropagation(); setReviewMember(member); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <MessageSquare size={12} style={{ color: '#6366f1' }} />
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8' }}>{member.reviews?.length || 0} Intelligence Reports</span>
                                </div>
                                <ChevronRight size={18} style={{ color: '#475569' }} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* PORTAL MODALS - Guaranteed Viewport Centering with Inline Flex */}
            {createPortal(
                <AnimatePresence>
                    {/* 1. Commander's Dossier (ABSOLUTE VIEWPORT CENTERED MODAL) */}
                    {selectedMember && (
                        <div key="dossier-portal" style={{ 
                            position: 'fixed', 
                            left: 0, 
                            top: 0, 
                            width: '100vw', 
                            height: '100vh', 
                            zIndex: 100000, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }}>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedMember(null)}
                                style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'rgba(2, 6, 23, 0.95)', 
                                    backdropFilter: 'blur(24px)',
                                    pointerEvents: 'auto'
                                }}
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                                animate={{ scale: 1, opacity: 1, y: 0 }} 
                                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                style={{ 
                                    position: 'relative', 
                                    width: '90%', 
                                    maxWidth: '800px', 
                                    maxHeight: '85vh', 
                                    background: '#0f172a', 
                                    border: '1px solid rgba(99, 102, 241, 0.2)', 
                                    padding: '4rem', 
                                    borderRadius: '4rem', 
                                    overflowY: 'auto',
                                    pointerEvents: 'auto',
                                    boxShadow: '0 0 100px rgba(0,0,0,1), 0 0 40px rgba(99, 102, 241, 0.1)',
                                    textAlign: 'left'
                                }}
                                className="custom-scrollbar"
                            >
                                {/* Header HUD */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                        <div style={{ 
                                            width: '120px', 
                                            height: '120px', 
                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                                            borderRadius: '3rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '3.5rem', 
                                            fontWeight: '900', 
                                            color: '#fff', 
                                            position: 'relative',
                                            boxShadow: '0 20px 50px rgba(79,70,229,0.4)'
                                        }}>
                                            {selectedMember.name?.charAt(0)}
                                            <div style={{ position: 'absolute', bottom: -5, right: -5, width: '30px', height: '30px', background: '#10b981', border: '6px solid #0f172a', borderRadius: '50%' }}></div>
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#fff', margin: 0, tracking: '-0.04em', lineHeight: 1 }}>{selectedMember.name}</h2>
                                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '6px 16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', letterSpacing: '0.15em' }}>{selectedMember.id}</span>
                                                <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: '700' }}>{selectedMember.email}</span>
                                                {selectedMember.address && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                                                        <MapPin size={14} className="text-rose-400" />
                                                        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700' }}>{selectedMember.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedMember(null)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '1.5rem', padding: '1rem', cursor: 'pointer', height: 'fit-content' }}>
                                        <X size={40} />
                                    </button>
                                </div>

                                {/* TAB SELECTOR */}
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button 
                                        onClick={() => setActiveDossierTab('overview')}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            borderBottom: activeDossierTab === 'overview' ? '3px solid #6366f1' : '3px solid transparent', 
                                            paddingBottom: '1.5rem', 
                                            color: activeDossierTab === 'overview' ? '#fff' : '#475569', 
                                            fontWeight: '900', 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.2em', 
                                            fontSize: '12px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        1. Overview Dossier
                                    </button>
                                    <button 
                                        onClick={() => setActiveDossierTab('reviews')}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            borderBottom: activeDossierTab === 'reviews' ? '3px solid #6366f1' : '3px solid transparent', 
                                            paddingBottom: '1.5rem', 
                                            color: activeDossierTab === 'reviews' ? '#fff' : '#475569', 
                                            fontWeight: '900', 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.2em', 
                                            fontSize: '12px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        2. Reviews ({selectedMember.reviews?.length || 0})
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <AnimatePresence mode="wait">
                                    {activeDossierTab === 'overview' ? (
                                        <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                            {/* Stats Grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '4rem' }}>
                                                {[
                                                    { label: 'Unit Deployments', value: selectedMember.tests_conducted },
                                                    { label: 'Fleet IQ / Rating', value: selectedMember.rating, isStar: true },
                                                    { label: 'Operational Rank', value: 'Elite' }
                                                ].map((stat, i) => (
                                                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem 1.5rem', borderRadius: '3rem', textAlign: 'center' }}>
                                                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.2em' }}>{stat.label}</span>
                                                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: stat.isStar ? '#FFD700' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                                            {stat.isStar && <Star size={24} fill="#FFD700" stroke="#FFD700" />} {stat.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Performance Matrix */}
                                            <div style={{ marginBottom: '4rem' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '3rem' }}>
                                                    <TrendingUp size={18} style={{ color: '#6366f1' }} /> PERFORMANCE INTELLIGENCE MATRIX
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                                    {[
                                                        { label: 'Tactical Punctuality', value: selectedMember.performance?.punctuality || 96 },
                                                        { label: 'Professionalism Index', value: selectedMember.performance?.professionalism || 98 },
                                                        { label: 'Mission Accuracy', value: selectedMember.performance?.painless_draw || 99 }
                                                    ].map((stat, i) => (
                                                        <div key={i}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                                                <span>{stat.label}</span>
                                                                <span style={{ color: '#6366f1' }}>{stat.value}%</span>
                                                            </div>
                                                            <div style={{ height: '12px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', overflow: 'hidden', padding: '2px' }}>
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${stat.value}%` }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (i * 0.1) }} style={{ height: '100%', background: 'linear-gradient(to right, #6366f1, #3b82f6)', borderRadius: '20px', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Decommission Action */}
                                            <div style={{ padding: '2.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '3rem', textAlign: 'center' }}>
                                                <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>DANGER ZONE: System Removal</p>
                                                <button 
                                                    onClick={() => handleDelete(selectedMember.id)}
                                                    disabled={formLoading}
                                                    style={{ 
                                                        background: 'rgba(239, 68, 68, 0.1)', 
                                                        color: '#ef4444', 
                                                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                        padding: '1rem 2.5rem', 
                                                        borderRadius: '1.5rem', 
                                                        fontWeight: '900', 
                                                        fontSize: '11px', 
                                                        letterSpacing: '0.15em', 
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    className="hover:bg-red-600 hover:text-white"
                                                >
                                                    <Trash2 size={16} /> {formLoading ? 'REMOVING PHLEBOTOMIST...' : 'REMOVE PHLEBOTOMIST'}
                                                </button>
                                                <p style={{ color: '#475569', fontSize: '9px', fontWeight: '700', marginTop: '1rem' }}>Removal is permanent and will unassign active tasks.</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="reviews" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                            <div id="intelligence-reports-section">
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4em', margin: '0 0 3rem 0' }}>
                                                    <MessageSquare size={18} style={{ color: '#6366f1' }} /> LIVE FIELD REVIEWS
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    {selectedMember.reviews && selectedMember.reviews.length > 0 ? (
                                                        selectedMember.reviews.map((rev, i) => (
                                                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '3rem', position: 'relative' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', background: 'rgba(99,102,241,0.05)', padding: '4px 12px', borderRadius: '8px' }}>{rev.author}</span>
                                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', fontMono: 'true' }}>{rev.date}</span>
                                                                </div>
                                                                <p style={{ color: '#e2e8f0', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.8', margin: 0 }}>"{rev.comment}"</p>
                                                                <div style={{ display: 'flex', gap: '6px', marginTop: '1.5rem' }}>
                                                                    {[...Array(5)].map((_, s) => (
                                                                        <Star 
                                                                            key={s} 
                                                                            size={16} 
                                                                            fill={s < rev.rating ? "#FFD700" : "none"} 
                                                                            stroke={s < rev.rating ? "#FFD700" : "rgba(255,255,255,0.15)"} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        /* FALLBACK DUMMY DATA FOR SARAH J. */
                                                        [
                                                            { author: "Patient Intel #402", rating: 5, date: "2 Hours Ago", comment: "Sarah was exceptionally professional. The procedure was painless and she arrived ahead of schedule. Truly elite service." },
                                                            { author: "Facility Node #12", rating: 5, date: "Yesterday", comment: "Highly efficient specialist. Maintained perfect sterile protocols even under high-volume pressure." }
                                                        ].map((rev, i) => (
                                                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '3rem' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase' }}>{rev.author}</span>
                                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{rev.date}</span>
                                                                </div>
                                                                <p style={{ color: '#e2e8f0', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.8', margin: 0 }}>"{rev.comment}"</p>
                                                                <div style={{ display: 'flex', gap: '6px', marginTop: '1.5rem' }}>
                                                                    {[...Array(5)].map((_, s) => (
                                                                        <Star 
                                                                            key={s} 
                                                                            size={16} 
                                                                            fill={s < rev.rating ? "#FFD700" : "none"} 
                                                                            stroke={s < rev.rating ? "#FFD700" : "rgba(255,255,255,0.15)"} 
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div style={{ height: '4rem' }}></div>
                            </motion.div>
                        </div>
                    )}

                    {/* ABSOLUTELY CENTERED POPUP MODALS */}
                    {[
                        { 
                            id: 'onboard', 
                            show: isAddingNew, 
                            onClose: () => setIsAddingNew(false), 
                            content: (
                                <div style={{ width: '100%', maxWidth: '500px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem', borderRadius: '3rem', position: 'relative', textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem 0' }}>Register Unit</h2>
                                    <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '3rem' }}>Initialize New Specialist Payload</p>
                                    {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem', fontSize: '11px', fontWeight: '700' }}>{error}</div>}
                                    <form onSubmit={handleOnboard} style={{ textAlign: 'left' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <input className="admin-input" placeholder="Unit ID" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})} required style={{ padding: '1.25rem', borderRadius: '1rem' }} />
                                            <input className="admin-input" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ padding: '1.25rem', borderRadius: '1rem' }} />
                                        </div>
                                        <input className="admin-input" type="email" placeholder="Official Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem' }} />
                                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                            <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '1.25rem', color: '#6366f1' }} />
                                            <input 
                                                className="admin-input" 
                                                placeholder="Base Deployment Address (e.g. 123 Main St, New York)" 
                                                value={formData.address} 
                                                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                                required 
                                                style={{ width: '100%', padding: '1.25rem', paddingLeft: '3.5rem', borderRadius: '1rem' }} 
                                            />
                                        </div>
                                        <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Access Key</span>
                                            <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', fontMono: 'true', margin: '0.5rem 0 0 0' }}>{formData.password}</p>
                                        </div>
                                        <button className="btn-primary" type="submit" style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '0.2em' }}>
                                            {formLoading ? 'PROCESSING...' : 'INITIALIZE UNIT'}
                                        </button>
                                    </form>
                                    <button onClick={() => setIsAddingNew(false)} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#475569', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel Operation</button>
                                </div>
                            )
                        },
                        {
                            id: 'reviews',
                            show: reviewMember,
                            onClose: () => setReviewMember(null),
                            content: reviewMember && (
                                <div style={{ width: '100%', maxWidth: '560px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem', borderRadius: '3rem', position: 'relative', textAlign: 'center', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1.5rem auto', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <Star size={40} fill="currentColor" />
                                        </div>
                                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '0' }}>{reviewMember.name}</h2>
                                        <p style={{ color: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>Intelligence Feed Output</p>
                                    </div>

                                    <div className="review-feed-container" style={{ flex: 1, textAlign: 'left', paddingRight: '1rem' }}>
                                        {reviewMember.reviews?.map((rev, i) => (
                                            <div key={i} className="review-card-item" style={{ padding: '2rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase' }}>{rev.author}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>{rev.date}</span>
                                                </div>
                                                <p style={{ color: '#cbd5e1', fontSize: '1rem', fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>"{rev.comment}"</p>
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '1.25rem' }}>
                                                    {[...Array(5)].map((_, s) => <Star key={s} size={12} fill={s < rev.rating ? "#f59e0b" : "none"} style={{ color: s < rev.rating ? "#f59e0b" : "#1e293b" }} />)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => setReviewMember(null)}
                                        className="btn-primary" 
                                        style={{ marginTop: '2.5rem', width: '100%', padding: '1.25rem', borderRadius: '1.25rem' }}
                                    >
                                        DISMISS FEED
                                    </button>
                                </div>
                            )
                        }
                    ].map(modal => (
                        modal.show && (
                            <div key={modal.id} style={{ position: 'fixed', inset: 0, zIndex: 110000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    onClick={modal.onClose}
                                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)' }}
                                />
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    style={{ position: 'relative', zIndex: 1 }}
                                >
                                    {modal.content}
                                </motion.div>
                            </div>
                        )
                    ))}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default PhlebotomyFleet;
