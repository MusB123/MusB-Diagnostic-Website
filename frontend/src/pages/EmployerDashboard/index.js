import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Wallet, CreditCard, 
  MapPin, LogOut, Menu, X, Bell, Search, Plus, 
  Download, Filter, ChevronRight, AlertCircle,
  FileText, CheckCircle2, Clock, Sun, Moon, Share2, Copy, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { employersAPI } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import AnimatedCounter from '../../components/Admin/AnimatedCounter';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
  const { logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('employer-theme') || 'light');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Theme Toggle Logic
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('employer-theme', newTheme);
  }, [theme]);

  // Notifications Logic
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Onsite Event Verified', message: 'Event at 15 Broad St. is now active.', time: '2 mins ago', read: false },
    { id: 2, type: 'info', title: 'Results Uploaded', message: '12 new test results are available for review.', time: '1 hour ago', read: false },
    { id: 3, type: 'warning', title: 'Bulk Invite Sent', message: 'Successfully sent 8 employee invites.', time: '3 hours ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  // Lifted Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeInvite, setActiveInvite] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ full_name: '', email: '', due_date: '' });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, empRes, billRes] = await Promise.all([
        employersAPI.getStats(token),
        employersAPI.getEmployees(token),
        employersAPI.getBilling(token)
      ]);
      if (statsRes.ok) setStats(statsRes.data);
      if (empRes.ok) setEmployees(empRes.data);
      if (billRes.ok) setBilling(billRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [token, fetchDashboardData]);
  
  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this employee? This action cannot be undone.')) return;
    
    try {
      const res = await employersAPI.deleteEmployee(employeeId, token);
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to remove employee: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error removing employee');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await employersAPI.addEmployee(newEmployee, token);
      if (res.ok) {
        setShowAddModal(false);
        setNewEmployee({ full_name: '', email: '', due_date: '' }); // Reset
        fetchDashboardData();
      } else {
        alert('Failed to add employee: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to add employee');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'schedule', label: 'Testing Schedule', icon: Calendar },
    { id: 'credits', label: 'Credits Wallet', icon: Wallet },
    { id: 'onsite', label: 'Onsite Collections', icon: MapPin },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab stats={stats} employees={employees} />;
      case 'employees': return (
        <EmployeesTab 
          employees={employees} 
          onShowAdd={() => setShowAddModal(true)} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onShowShare={(emp) => {
            setActiveInvite(emp);
            setShowShareModal(true);
          }}
          onDelete={handleDeleteEmployee}
        />
      );
      case 'onsite': return <OnsiteTab token={token} onRefresh={fetchDashboardData} />;
      case 'billing': return <BillingTab billing={billing} stats={stats} />;
      default: return (
        <div className="tab-placeholder">
          <AlertCircle size={48} />
          <h2>Module Under Construction</h2>
          <p>The {activeTab} module is currently being finalized. Check back soon!</p>
        </div>
      );
    }
  };

  return (
    <div className={`dashboard-container ${theme}-theme`}>
      {/* Sidebar */}
      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon">E</div>
            <span className="logo-text">Employer <span>Portal</span></span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="active-indicator" />}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="user-avatar"
              style={{ background: 'transparent', border: 'none', width: 'auto', height: 'auto', marginBottom: '0.35rem' }}
            >
              <img 
                src="/images/MusB_Diagnostic_Logo.png" 
                alt="MusB Logo" 
                style={{ width: '120px', height: 'auto', objectFit: 'contain' }} 
              />
            </motion.div>
            <div className="user-details" style={{ display: 'block', padding: 0 }}>
              <div className="user-name" style={{ color: 'white', fontWeight: 800, lineHeight: 1 }}>MusB Diagnostics</div>
              <div className="user-role" style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem' }}>Official Partner</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
            </button>
            <h1 className="page-title">{navItems.find(i => i.id === activeTab)?.label}</h1>
          </div>
          
          <div className="topbar-right">
            <div className="search-bar">
              <Search size={18} color="var(--slate-700)" />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeTab !== 'employees') setActiveTab('employees');
                }}
              />
            </div>
            
             <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button 
                onClick={toggleTheme}
                style={{ background: 'var(--bg-input)', border: 'none', padding: '0.65rem', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <div className="notifications-container" style={{ position: 'relative' }} ref={dropdownRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ position: 'relative', background: 'var(--bg-input)', border: 'none', padding: '0.65rem', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="badge" style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--emerald-500)', color: 'white', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '50%', fontWeight: '800' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="notifications-dropdown"
                    >
                      <div className="dropdown-header">
                        <h3>Notifications</h3>
                        <button onClick={markAllRead}>Mark all read</button>
                      </div>
                      <div className="dropdown-body">
                        {notifications.length > 0 ? (
                          notifications.map(notify => (
                            <div key={notify.id} className={`notify-item ${notify.read ? 'read' : 'unread'}`}>
                              <div className={`notify-dot ${notify.type}`} />
                              <div className="notify-content">
                                <p className="notify-title">{notify.title}</p>
                                <p className="notify-message">{notify.message}</p>
                                <span className="notify-time">{notify.time}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-notify">No new notifications</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="current-date" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        <div className="content-body">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="dashboard-loader"
              >
                <div className="spinner"></div>
                <p>Syncing with Atlas...</p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Share Invite Modal */}
      {showShareModal && activeInvite && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content glass invite-share-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Share Invitation</h2>
              <button className="close-btn" onClick={() => setShowShareModal(false)}><X size={20} /></button>
            </div>
            
            <div className="invite-modal-body">
              <div className="qr-section">
                <div className="qr-wrapper">
                  <QRCode 
                    value={`${window.location.origin}/enroll/${activeInvite.invite_token}`}
                    size={180}
                    bgColor="white"
                    fgColor="#1e293b"
                    level="H"
                  />
                </div>
                <p className="qr-hint">Scan with phone camera to enroll instantly</p>
              </div>

              <div className="link-section">
                <label>Magic Enrollment Link</label>
                <div className="copy-link-group">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/enroll/${activeInvite.invite_token}`} 
                  />
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/enroll/${activeInvite.invite_token}`);
                      // Simple feedback
                      const btn = document.activeElement;
                      const original = btn.innerHTML;
                      btn.innerHTML = 'Copied!';
                      setTimeout(() => btn.innerHTML = original, 2000);
                    }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="invite-meta">
                <p>Inviting: <strong>{activeInvite.full_name}</strong></p>
                <p>Status: <span className="status-badge invited">Ready to Join</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lifted Modal - Rendered at root to avoid stacking context issues */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Invite Employee</h2>
            <form onSubmit={handleAddEmployee} className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={newEmployee.full_name} onChange={e => setNewEmployee({...newEmployee, full_name: e.target.value})} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="john@company.com" required />
              </div>
              <div className="form-group">
                <label>Annual Due Date (Est)</label>
                <input type="date" value={newEmployee.due_date} onChange={e => setNewEmployee({...newEmployee, due_date: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Send Invite</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for Tabs ---

const OverviewTab = ({ stats, employees }) => {
  const chartData = [
    { name: 'Jan', tests: 4 },
    { name: 'Feb', tests: 7 },
    { name: 'Mar', tests: 5 },
    { name: 'Apr', tests: 12 },
    { name: 'May', tests: 8 },
  ];
  
  return (
    <div className="overview-container">
      {/* Symmetric Stat Grid */}
      <div className="stats-row">
        {[
          { icon: Users, label: 'Enrolled', value: stats?.employees_count || 12, trend: '+2.4%', color: 'blue', positive: true },
          { icon: CheckCircle2, label: 'Account', value: stats?.plan_status || 'Active', trend: 'Premium', color: 'green' },
          { icon: Clock, label: 'Urgent', value: stats?.next_due_count || 3, trend: 'Requires Action', color: 'yellow', warning: true },
          { icon: Wallet, label: 'Wallet', value: stats?.credits_wallet?.points || 450, suffix: ' pt', trend: 'Executive', color: 'purple' },
        ].map((card, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="stat-card"
          >
            <div className="stat-header">
              <div className={`stat-icon ${card.color}`}>
                <card.icon size={20} />
              </div>
              <div className={`status-pill ${card.positive ? 'success' : card.warning ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                {card.trend}
              </div>
            </div>
            <div className="stat-body">
              <p className="stat-label">{card.label}</p>
              <h3 className="stat-value">
                <AnimatedCounter value={card.value} suffix={card.suffix || ''} />
              </h3>
              {/* Optional Small Sparkline would go here */}
              <div style={{ height: '4px', background: 'var(--slate-100)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 1 }}
                  style={{ height: '100%', background: card.color === 'blue' ? '#0284c7' : card.color === 'green' ? '#10b981' : card.color === 'yellow' ? '#ca8a04' : '#9333ea' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid-main">
        {/* Analytics Section */}
        <div className="chart-container">
          <h2 className="section-title">Testing Volume Analytics</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-card)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-card)', 
                    boxShadow: 'var(--shadow-premium)',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ fontWeight: 800, color: 'var(--text-primary)' }}
                />
                <Bar dataKey="tests" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--emerald-500)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--emerald-600)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Activity */}
        <div className="activity-feed">
          <h2 className="section-title">System Activity</h2>
          <div className="timeline">
            {[
              { text: 'Onsite Event Verified - 15 Broad St.', time: '2 mins ago', active: true },
              { text: 'Results Uploaded for John Doe', time: '1 hour ago', active: true },
              { text: 'Bulk Employee Invite Sent (8)', time: '3 hours ago', active: false },
              { text: 'Billing Statement Generated', time: 'Yesterday', active: false },
              { text: 'New Account Verified', time: 'Mar 28, 2026', active: false },
            ].map((event, i) => (
              <div key={i} className={`timeline-item ${event.active ? 'active' : ''}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <p className="timeline-text">{event.text}</p>
                  <p className="timeline-time">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeesTab = ({ employees, onShowAdd, searchTerm, setSearchTerm, onShowShare, onDelete }) => {
  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employees-tab">
      <div className="employees-toolbar">
        <div className="toolbar-left">
          <div className="search-input-group glass">
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group-pill glass">
            <Filter size={16} color="var(--text-secondary)" />
            <select>
              <option>All Status</option>
              <option>Completed</option>
              <option>Scheduled</option>
              <option>Invited</option>
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="btn bulk-btn" onClick={() => console.log('Bulk toggle')}>
            <Download size={18} />
            <span>Bulk Upload</span>
          </button>
          <button className="btn btn-primary add-btn" onClick={onShowAdd}>
            <Plus size={18} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="table-container shadow-premium">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th style={{ color: 'var(--text-secondary)' }}>Employee Name</th>
              <th style={{ color: 'var(--text-secondary)' }}>Email Address</th>
              <th style={{ color: 'var(--text-secondary)' }}>Current Status</th>
              <th style={{ color: 'var(--text-secondary)' }}>Next Due Date</th>
              <th style={{ color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? filteredEmployees.map((emp, idx) => (
              <motion.tr 
                key={emp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <td><strong>{emp.full_name}</strong></td>
                <td>{emp.email}</td>
                <td>
                  <span className={`status-badge ${emp.status.toLowerCase()}`}>
                    {emp.status}
                  </span>
                </td>
                <td>{emp.due_date}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="icon-btn small share" 
                      title="Share Invite"
                      onClick={() => onShowShare(emp)}
                    >
                      <Share2 size={16} />
                    </button>
                    <button className="icon-btn small"><FileText size={16} /></button>
                    <button 
                      className="icon-btn small delete" 
                      title="Remove Employee"
                      onClick={() => onDelete(emp.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OnsiteTab = ({ token, onRefresh }) => {
  const [formData, setFormData] = useState({
    date: '', address: '', headcount: 5, notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await employersAPI.submitOnsiteRequest(formData, token);
      if (res.ok) {
        setSubmitted(true);
        if (onRefresh) onRefresh();
      } else {
        alert('Request failed');
      }
    } catch (err) {
      alert('Request failed');
    }
  };

  return (
    <div className="onsite-tab">
      <div className="onsite-grid">
        <div className="onsite-form-container glass">
          <h3>Request Onsite Collection</h3>
          <p>Schedule a mobile phlebotomy team for your office. (5+ headcount required)</p>
          
          {submitted ? (
            <div className="success-message">
              <CheckCircle2 size={48} color="var(--emerald-500)" />
              <h3>Request Submitted!</h3>
              <p>Our logistics team will verify the date and headcount and contact you within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="btn btn-outline" style={{ marginTop: '1rem' }}>Schedule Another</button>
            </div>
          ) : (
            <form className="onsite-form" onSubmit={handleSubmit}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Service Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Expected Headcount</label>
                  <input type="number" min="5" value={formData.headcount} onChange={e => setFormData({...formData, headcount: e.target.value})} required />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Office Address</label>
                <input type="text" placeholder="123 Corporate St, Ste 500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Additional Instructions</label>
                <textarea rows="3" placeholder="Security gate code, specific department, etc." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-block">Submit Request</button>
            </form>
          )}
        </div>

        <div className="onsite-info glass">
          <h3>Onsite Rules</h3>
          <ul className="rules-list" style={{ padding: 0 }}>
            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="rule-icon" style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '8px', color: 'var(--slate-800)' }}><Users size={20}/></div>
              <p><strong>Min Headcount:</strong> 5 employees same-day.</p>
            </li>
            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div className="rule-icon" style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '8px', color: 'var(--slate-800)' }}><Clock size={20}/></div>
              <p><strong>Notice Period:</strong> Request at least 48 hours in advance.</p>
            </li>
            <li style={{ display: 'flex', gap: '1rem' }}>
              <div className="rule-icon" style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '8px', color: 'var(--slate-800)' }}><CheckCircle2 size={20}/></div>
              <p><strong>Zero Cost:</strong> No travel fees for corporate partners.</p>
            </li>
          </ul>
          <div className="onsite-promo" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--emerald-50)', borderRadius: '12px', border: '1px dashed var(--emerald-200)', color: 'var(--emerald-800)' }}>
            <p>Gathering 10+ employees? We'll provide complimentary breakfast catering during the blood draw session!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingTab = ({ billing, stats }) => {
  return (
    <div className="billing-tab">
      <div className="billing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="current-plan glass" style={{ padding: '2rem' }}>
          <h3>Current Plan</h3>
          <div className="plan-badge" style={{ background: 'var(--emerald-500)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', display: 'inline-block', fontWeight: 800, margin: '1rem 0' }}>
            {stats?.plan_status || 'Corporate Match'}
          </div>
          <p>Your subscription renews on: <strong>{stats?.renewal_date || 'Next Month'}</strong></p>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--slate-100)' }} />
          <button className="btn btn-primary btn-block">Upgrade Plan</button>
          <button className="btn btn-outline btn-block" style={{ marginTop: '0.75rem' }}>View Plan Benefits</button>
        </div>

        <div className="billing-history glass" style={{ padding: '2rem' }}>
          <h3>Payment History</h3>
          <table className="dashboard-table" style={{ marginTop: '1.5rem' }}>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {billing.length > 0 ? billing.map((inv, idx) => (
                <tr key={idx}>
                  <td><strong>{inv.id}</strong></td>
                  <td>{inv.date}</td>
                  <td>${inv.amount}</td>
                  <td><span className="status-pill success">{inv.status}</span></td>
                  <td><button className="icon-btn small"><Download size={16}/></button></td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No billing history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
