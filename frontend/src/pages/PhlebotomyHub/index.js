import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ClipboardCheck, LogOut, Bell,
  ShieldCheck,
  Send, Wallet, Star, User, UserPlus
} from 'lucide-react';
import Login from './Login.js';
import Dashboard from './Dashboard.js';
import FleetManager from './FleetManager.js';
import OrderAllocation from './OrderAllocation.js';
import PaymentsReports from './PaymentsReports.js';
import './HubPortal.css';

const PhlebotomyHub = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(false);

  // Auto-close sidebar on mobile when tab changes
  useEffect(() => {
    setSidebarActive(false);
  }, [activeTab]);

  useEffect(() => {
    const savedUser = localStorage.getItem('hub_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_user');
    setUser(null);
  };

  if (loading) return (
    <div style={{ background: '#0f0f1a', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      Initializing Secure Command Center...
    </div>
  );

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'route', label: 'Route Queue', icon: <Send size={20} /> },
    { id: 'active', label: 'Active Job', icon: <ClipboardCheck size={20} /> },
    { id: 'earnings', label: 'Earnings', icon: <Wallet size={20} /> },
    { id: 'reviews', label: 'Reviews', icon: <Star size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'onboarding', label: 'Onboarding', icon: <UserPlus size={20} /> },
  ];

  const notifications = [
    { id: 1, title: 'New Order Allocated', time: '2 min ago', type: 'order' },
    { id: 2, title: 'Phleb Online: Sarah J.', time: '10 min ago', type: 'status' },
    { id: 3, title: 'Route Optimization Complete', time: '15 min ago', type: 'system' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'onboarding': return <FleetManager />;
      case 'route': return <OrderAllocation />;
      case 'earnings': return <PaymentsReports />;
      default: return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className={`hub-portal-wrapper ${sidebarActive ? 'sidebar-active' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarActive && <div className="hub-sidebar-overlay" onClick={() => setSidebarActive(false)}></div>}

      {/* ── Vertical Sidebar (Specialist HQ Style) ── */}
      <aside className={`hub-sidebar-sidebar ${sidebarActive ? 'active' : ''}`}>
        <div className="hub-sidebar-logo">
          <div className="hub-logo-box">
            <ShieldCheck color="white" size={24} />
          </div>
          <div className="hub-logo-text-group">
            <h2 className="hub-brand-name">SPECIALIST HQ</h2>
          </div>
        </div>

        <nav className="hub-nav-list">
          {navItems.map((item) => (
            <div 
              key={item.id}
              className={`hub-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="hub-sidebar-footer">
          <div className="hub-nav-item hub-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

       {/* ── Main Content Area (Fixed Skeleton) ── */}
      <main className="hub-main-body">
        <header className="hub-header">
          <button 
              className={`hub-toggle-v2 ${sidebarActive ? 'active' : ''}`}
              onClick={() => setSidebarActive(!sidebarActive)}
          >
              <div className="toggle-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
          </button>
          
          <div className="hub-header-left">
            <h1 className="hub-header-title">
              {navItems.find(i => i.id === activeTab).label}
            </h1>
            <p className="hub-header-breadcrumb">
              Mission Control / {user.name}
            </p>
          </div>

          <div className="hub-header-actions">
            <div className="hub-notification-wrapper" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={20} className="hub-bell-icon" />
              <div className="hub-notification-dot"></div>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    style={{ 
                      position: 'absolute', top: '120%', right: 0, width: '320px', 
                      background: '#161625', border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px', padding: '1rem', zIndex: 100,
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Recent Notifications</span>
                      <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 800 }}>Clear All</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{n.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem 1.2rem', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <ShieldCheck size={18} /> SECURE
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>


        <footer style={{ marginTop: '5rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
          <div>&copy; 2026 MusB Diagnostic Systems • Secure Fleet Infrastructure</div>
          <div>v2.4.0 • Node: TR-800</div>
        </footer>
      </main>
    </div>
  );
};

export default PhlebotomyHub;
