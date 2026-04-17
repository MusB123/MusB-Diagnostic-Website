import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, LayoutDashboard, Users, 
  ClipboardCheck, CreditCard, LogOut, Bell,
  ShieldCheck, HelpCircle, Settings
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
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'fleet', label: 'Fleet Management', icon: <Users size={20} /> },
    { id: 'allocation', label: 'Order Allocation', icon: <ClipboardCheck size={20} /> },
    { id: 'payments', label: 'Payments & Reports', icon: <CreditCard size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'fleet': return <FleetManager />;
      case 'allocation': return <OrderAllocation />;
      case 'payments': return <PaymentsReports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="hub-portal-wrapper" style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>
      {/* ── Vertical Sidebar (Fixed Skeleton) ── */}
      <aside className="hub-sidebar-sidebar" style={{ width: '280px', background: '#161625', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '2rem 1rem', height: '100vh', position: 'sticky', top: 0 }}>
        <div className="hub-sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
          <div style={{ background: '#6366f1', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 color="white" size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>MusB Hub</h2>
            <p style={{ color: '#818cf8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, margin: 0 }}>Fleet Ops</p>
          </div>
        </div>

        <nav className="hub-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {navItems.map((item) => (
            <div 
              key={item.id}
              className={`hub-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                background: activeTab === item.id ? '#6366f1' : 'transparent',
                color: activeTab === item.id ? '#fff' : '#94a3b8',
                fontWeight: 700
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
          
          <div style={{ marginTop: '2rem', padding: '0 1rem', color: '#475569', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Operations
          </div>
          <div className="hub-nav-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#94a3b8' }}>
            <Settings size={20} /> <span>Configurations</span>
          </div>
          <div className="hub-nav-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#94a3b8' }}>
            <HelpCircle size={20} /> <span>Support</span>
          </div>
        </nav>

        <div className="hub-sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div 
            className="hub-nav-item" 
            onClick={handleLogout} 
            style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', fontWeight: 800 }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (Fixed Skeleton) ── */}
      <main className="hub-main-body" style={{ flexGrow: 1, padding: '3rem', background: '#0f0f1a' }}>
        <header className="flex-between" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              {navItems.find(i => i.id === activeTab).label}
            </h1>
            <p style={{ color: '#6366f1', fontWeight: 800, margin: '5px 0 0 0', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
              Command Center / {user.name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', color: '#fff', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
              <Bell size={20} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%' }}></div>
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
