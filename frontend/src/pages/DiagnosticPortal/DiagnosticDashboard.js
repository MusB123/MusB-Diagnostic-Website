import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import { 
    Activity, LayoutDashboard, FileText, Settings, 
    LogOut, Bell, ShieldCheck, Database, 
    Plus, ArrowRight, RefreshCcw, Lock,
    Clock, MessageSquare, CreditCard, Inbox, Trello, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { researchAPI, diagnosticAPI } from '../../services/api';
import './DiagnosticPortal.css';

// Import newly created modules
import Timeline from './modules/Timeline';
import Tasks from './modules/Tasks';
import DocumentCenter from './modules/DocumentCenter';
import Messenger from './modules/Messenger';
import Billing from './modules/Billing';
import KanbanBoard from './modules/KanbanBoard';
import SubmissionsInbox from './modules/SubmissionsInbox';
import NDAWorkflow from './modules/NDAWorkflow';

const DiagnosticDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const token = localStorage.getItem('diag_token');
        const storedUser = localStorage.getItem('diag_user');
        if (!token || !storedUser) {
            navigate('/portal/diagnostic/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchData(parsedUser.role);
    }, [navigate]);

    const fetchData = async (role) => {
        setLoading(true);
        try {
            const res = await researchAPI.getValidationTracker();
            if (res.ok) {
                setProjects(res.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('diag_token');
        localStorage.removeItem('diag_user');
        navigate('/');
    };

    if (!user) return null;

    const isAdmin = user.role === 'admin';

    const menuItems = isAdmin ? [
        { id: 'overview', label: 'Admin Overiew', icon: <LayoutDashboard size={20} /> },
        { id: 'inbox', label: 'Submissions', icon: <Inbox size={20} /> },
        { id: 'pipeline', label: 'Pipeline (Kanban)', icon: <Trello size={20} /> },
        { id: 'nda', label: 'NDA Workflow', icon: <Shield size={20} /> },
        { id: 'billing', label: 'Invoicing', icon: <CreditCard size={20} /> },
    ] : [
        { id: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'timeline', label: 'Status Timeline', icon: <Clock size={20} /> },
        { id: 'tasks', label: 'Assigned Tasks', icon: <Activity size={20} /> },
        { id: 'documents', label: 'Documents', icon: <FileText size={20} /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} /> },
        { id: 'billing', label: 'Invoices', icon: <CreditCard size={20} /> },
    ];

    return (
        <div className="diag-portal-container">
            {/* Navigation Sidebar */}
            <aside className="diag-sidebar">
                <div className="diag-logo">
                    <ShieldCheck size={28} className="text-primary" />
                    <h2>DIAGNOSTIC HUB</h2>
                </div>
                
                <nav className="diag-nav">
                    {menuItems.map(item => (
                        <button 
                            key={item.id}
                            className={`diag-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="diag-sidebar-footer">
                    <button className="diag-nav-item" onClick={() => alert('Settings module coming soon.')}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                    <button onClick={handleLogout} className="diag-nav-item logout">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="diag-main-content">
                <header className="diag-header">
                    <div className="diag-header-left">
                        <h1 className="capitalize">{activeTab} View</h1>
                        <p className="breadcrumb">Diagnostic Portal » {isAdmin ? 'Internal Admin' : 'Client Panel'}</p>
                    </div>
                    
                    <div className="diag-header-actions">
                        <button className="diag-notif-btn">
                            <Bell size={18} />
                            <span className="notif-dot"></span>
                        </button>
                        <div className="diag-user-profile">
                            <div className="avatar">{user.name[0]}</div>
                            <div className="info">
                                <span className="name">{user.name}</span>
                                <span className="role">{isAdmin ? 'System Admin' : 'Biomarker Developer'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="diag-workspace-inner">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Role-Specific Content Router (Switch Case) */}
                            {activeTab === 'overview' && (
                                <>
                                    <div className="diag-stats-row">
                                        <div className="diag-stat-card">
                                            <div className="stat-label">{isAdmin ? 'Total Submissions' : 'Active Validations'}</div>
                                            <div className="stat-value">{projects.length}</div>
                                            <div className="stat-icon"><Activity size={20} /></div>
                                        </div>
                                        <div className="diag-stat-card">
                                            <div className="stat-label">Pending Actions</div>
                                            <div className="stat-value">2</div>
                                            <div className="stat-icon"><Clock size={20} /></div>
                                        </div>
                                        <div className="diag-stat-card">
                                            <div className="stat-label">System Health</div>
                                            <div className="stat-status"><span className="dot active"></span> 100%</div>
                                            <div className="stat-icon"><Database size={20} /></div>
                                        </div>
                                    </div>

                                    <div className="diag-content-card mt-6">
                                        <div className="card-header">
                                            <div>
                                                <h3>Project Overview</h3>
                                                <p>Quick summary of technology validation status.</p>
                                            </div>
                                            <button className="refresh-btn" onClick={() => fetchData(user.role)}>
                                                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                        
                                        <div className="diag-table-responsive">
                                            <table className="diag-data-table">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Technology</th>
                                                        <th>Phase</th>
                                                        <th>Progress</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projects.map(p => (
                                                        <tr key={p.project_id}>
                                                            <td className="font-mono text-sm">{p.project_id}</td>
                                                            <td className="font-bold">{p.name}</td>
                                                            <td><span className="diag-phase-pill">{p.status}</span></td>
                                                            <td>
                                                                <div className="diag-progress-mini">
                                                                    <div className="diag-progress-bar"><div className="fill" style={{width: `${p.progress}%`}}></div></div>
                                                                    <span className="text-[10px]">{p.progress}%</span>
                                                                </div>
                                                            </td>
                                                            <td><button className="btn-link" onClick={() => setActiveTab(isAdmin ? 'pipeline' : 'timeline')}>Detail <ArrowRight size={12}/></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Client Modules */}
                            {activeTab === 'timeline' && <Timeline projects={projects} />}
                            {activeTab === 'tasks' && <Tasks projectId={projects[0]?.project_id} />}
                            {activeTab === 'documents' && <DocumentCenter projectId={projects[0]?.project_id} />}
                            {activeTab === 'messages' && <Messenger projectId={projects[0]?.project_id} currentUser={user} />}
                            {activeTab === 'billing' && <Billing projectId={projects[0]?.project_id} />}

                            {/* Admin Modules */}
                            {activeTab === 'inbox' && <SubmissionsInbox />}
                            {activeTab === 'pipeline' && <KanbanBoard />}
                            {activeTab === 'nda' && <NDAWorkflow />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default DiagnosticDashboard;
