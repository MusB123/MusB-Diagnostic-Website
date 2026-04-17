import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
    Microscope, LayoutDashboard, Database, TestTube, 
    BarChart3, Users, Settings, LogOut, Bell, Search,
    FlaskConical, Package, FlaskRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ResearchPortal.css';

// Dashboard Modules
import StudyManagement from './modules/StudyManagement';
import SampleTracking from './modules/SampleTracking';
import StorageInventory from './modules/StorageInventory';
import Reporting from './modules/Reporting';
import UniversityDirectory from './modules/UniversityDirectory';

const ResearchDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ 
        active_studies: 0, 
        total_samples: 0, 
        storage_utilization: '0%', 
        critical_alerts: 0 
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifs, setShowNotifs] = useState(false);
    const [sidebarActive, setSidebarActive] = useState(false);
    
    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        setSidebarActive(false);
    }, [location.pathname]);

    const [notifications, setNotifications] = useState([
        { id: 1, type: 'study', msg: 'New protocol STUDY-BF5492 initiated for Clinical Phase II.', time: '2m ago' },
        { id: 2, type: 'inventory', msg: 'Freezer FZ-01 capacity reached 88%. Optimization recommended.', time: '1h ago' },
        { id: 3, type: 'sample', msg: 'High-priority sample SAMP-X99 accessioned by admin.', time: '4h ago' },
        { id: 4, type: 'study', msg: 'PI Dr. Sarah Jenkins updated Study STUDY-A102 metadata.', time: 'Yesterday' }
    ]);

    useEffect(() => {
        const token = localStorage.getItem('res_token');
        const storedUser = localStorage.getItem('res_user');
        if (!token || !storedUser) {
            navigate('/portal/research/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchStats(token);
    }, [navigate]);

    const fetchStats = async (token) => {
        try {
            const res = await fetch('/api/research/portal/dashboard/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleLogout = () => {
        localStorage.removeItem('res_token');
        localStorage.removeItem('res_user');
        navigate('/');
    };

    if (!user) return null;

    const navItems = [
        { name: 'Overview', path: 'dashboard', icon: <LayoutDashboard size={20} />, role: 'any' },
        { name: 'Study Management', path: 'studies', icon: <Database size={20} />, role: 'admin' },
        { name: 'Sample Tracking', path: 'samples', icon: <TestTube size={20} />, role: 'admin' },
        { name: 'Storage Inventory', path: 'inventory', icon: <FlaskConical size={20} />, role: 'any' },
        { name: 'Reporting & Analytics', path: 'reporting', icon: <BarChart3 size={20} />, role: 'admin' },
        { name: 'University Intake', path: 'universities', icon: <Users size={20} />, role: 'admin' },
    ];

    const allowedNavItems = navItems.filter(item => item.role === 'any' || item.role === user.role);

    return (
        <div className={`research-portal ${sidebarActive ? 'sidebar-active' : ''}`}>
            {/* Mobile Sidebar Overlay */}
            {sidebarActive && <div className="res-sidebar-overlay" onClick={() => setSidebarActive(false)}></div>}

            {/* Sidebar */}
            <aside className={`res-sidebar ${sidebarActive ? 'active' : ''}`}>
                <div className="res-logo">
                    <Microscope size={28} />
                    <h2>{user.role === 'admin' ? 'CENTRAL LAB' : 'RESEARCH HUB'}</h2>
                </div>
                
                <nav className="res-nav-menu">
                    {allowedNavItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={`/portal/research/${item.path}`}
                            className={`res-nav-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="res-sidebar-footer pt-6 border-t border-slate-800">
                    <button 
                        onClick={() => alert('Settings module coming in the next security patch (v2.4).')}
                        className="res-nav-item mb-4 w-full text-left"
                    >
                        <Settings size={20} />
                        Portal Settings
                    </button>
                    <button onClick={handleLogout} className="res-nav-item w-full text-red-500 hover:bg-red-500/10 hover:text-red-400">
                        <LogOut size={20} />
                        Logout Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="res-content">
                <header className="res-header">
                    <button 
                        className={`res-sidebar-toggle ${sidebarActive ? 'active' : ''}`}
                        onClick={() => setSidebarActive(!sidebarActive)}
                    >
                        <span></span>
                    </button>
                    <div className="res-header-title">
                        <h1>{location.pathname.includes('dashboard') ? 'System Overview' : location.pathname.split('/').pop().replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h1>
                        <div className="breadcrumb">Research & Diagnostics » {user.institution}</div>
                    </div>
                    <div className="res-header-actions">
                        <div className="res-search-wrapper">
                            <Search className="res-search-icon" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search Barcodes..." 
                                className="res-header-search" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && alert(`Searching for: ${searchQuery}`)}
                            />
                        </div>
                        <div className="relative">
                            <button 
                                className="res-notification-btn"
                                onClick={() => setShowNotifs(!showNotifs)}
                            >
                                <Bell size={18} />
                                {notifications.length > 0 && <span className="res-notif-dot"></span>}
                            </button>

                            <AnimatePresence>
                                {showNotifs && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="res-notifications-popover"
                                    >
                                        <div className="res-notif-header">
                                            <h4>Repository Alerts</h4>
                                            <button onClick={() => setNotifications([])}>Clear All</button>
                                        </div>
                                        <div className="res-notif-list">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div key={n.id} className="res-notif-item">
                                                        <div className={`res-notif-icon ${n.type}`}>
                                                            {n.type === 'study' && <FlaskRound size={18} />}
                                                            {n.type === 'inventory' && <Database size={18} />}
                                                            {n.type === 'sample' && <TestTube size={18} />}
                                                        </div>
                                                        <div className="res-notif-content">
                                                            <div className="res-notif-msg">{n.msg}</div>
                                                            <div className="res-notif-meta">{n.time} • {n.type}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="res-notif-empty">
                                                    No pending alerts in the repository.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div 
                            className="res-user-badge"
                            onClick={() => alert(`Logged in as ${user.name}\nInstitution: ${user.institution}`)}
                        >
                            <div className="res-avatar-chip">
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="res-user-info">
                                <p className="res-user-name">{user.name.split(' ')[0]}</p>
                                <p className="res-user-role">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="res-main-viewport">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<OverviewModule user={user} stats={stats} />} />
                            <Route path="studies" element={<StudyManagement user={user} />} />
                            <Route path="samples" element={<SampleTracking user={user} />} />
                            <Route path="inventory" element={<StorageInventory user={user} />} />
                            <Route path="reporting" element={<Reporting user={user} />} />
                            <Route path="universities" element={<UniversityDirectory user={user} />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

// Internal Overview Module (Inline for shell simplicity)
const OverviewModule = ({ user, stats }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-8"
    >
        <div className="res-grid">
            <div className="res-stats-card">
                <p className="text-slate-400 text-sm font-medium mb-1">Active Studies</p>
                <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-bold text-white">{stats.active_studies}</h3>
                    <FlaskRound className="text-blue-500" size={24} />
                </div>
            </div>
            <div className="res-stats-card">
                <p className="text-slate-400 text-sm font-medium mb-1">Samples in Archival</p>
                <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-bold text-white">{stats.total_samples}</h3>
                    <Database className="text-emerald-500" size={24} />
                </div>
            </div>
            {user.role === 'admin' ? (
                <>
                <div className="res-stats-card">
                    <p className="text-slate-400 text-sm font-medium mb-1">Storage Utilization</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-bold text-white">{stats.storage_utilization}</h3>
                        <Package className="text-amber-500" size={24} />
                    </div>
                </div>
                <div className="res-stats-card">
                    <p className="text-slate-400 text-sm font-medium mb-1">Critical Alerts</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-bold text-red-500">{stats.critical_alerts}</h3>
                        <Bell className="text-red-500" size={24} />
                    </div>
                </div>
                </>
            ) : (
                <>
                <div className="res-stats-card">
                    <p className="text-slate-400 text-sm font-medium mb-1">Recent Shipments</p>
                    <h3 className="text-3xl font-bold text-white">{stats.recent_shipments}</h3>
                </div>
                <div className="res-stats-card">
                    <p className="text-slate-400 text-sm font-medium mb-1">Pending Requests</p>
                    <h3 className="text-3xl font-bold text-white">{stats.pending_requests}</h3>
                </div>
                </>
            )}
        </div>

        <div className="res-hub-card group">
            <div className="relative z-10">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="res-hub-icon-container"
                >
                    <Microscope size={40} />
                </motion.div>
                
                <h4 className="res-hub-title">Technical Operations Hub</h4>
                
                <p className="res-hub-description">
                    Welcome to the secure management interface for MusB Central Lab. 
                    Monitor bi-directional data flow, biorepository metrics, and technical protocols 
                    from a centralized command center.
                </p>

                <div className="res-hub-status-wrapper">
                    <div className="res-hub-status-pill active">
                        <span className="res-status-dot active"></span>
                        LIMS Active
                    </div>
                    <div className="res-hub-status-pill nominal">
                        <span className="res-status-dot nominal"></span>
                        Protocol Sync: Nominal
                    </div>
                </div>

                <div className="res-hub-actions">
                    <Link to="/portal/research/samples" className="res-btn bg-blue-600 hover:bg-blue-500 px-8 py-3">
                        Quick Accession
                    </Link>
                    <Link to="/portal/research/reporting" className="res-btn bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-3">
                        View Reports
                    </Link>
                </div>
            </div>
        </div>
    </motion.div>
);

export default ResearchDashboard;
