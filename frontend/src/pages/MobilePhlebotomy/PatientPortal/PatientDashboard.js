import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, CalendarDays, Clock, FileText, CreditCard,
  Settings, LogOut, Star, ChevronRight, Plus, MapPin, User, Menu
} from 'lucide-react';
import './PatientPortal.css';
import api from '../../../api/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState({
    upcoming: [],
    past: [],
    saved_phlebotomists: [],
    documents: [],
    stats: { total: 0, completed: 0, upcoming: 0 }
  });

  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    if (!token) {
      navigate('/portal/patient/login', { replace: true });
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/patients/dashboard/');
      setDashData(response.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Fallback to minimal empty state or mock if desired
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('patient_user') || 'null');

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_user');
    navigate('/portal/patient/login', { replace: true });
  };

  // Use real data from backend, default to empty arrays if none
  const UPCOMING = dashData.upcoming || [];
  const PAST = dashData.past || [];
  const SAVED_PHLEBS = dashData.saved_phlebotomists || [];
  const DOCUMENTS = dashData.documents || [];
  const PAYMENT_METHODS = dashData.payment_methods || [];
  const STATS = dashData.stats;

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: CalendarDays },
    { id: 'appointments', label: 'Appointments', icon: Clock },
    { id: 'phlebotomists', label: 'Saved Specialists', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'settings', label: 'Account Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Stats Row */}
      <div className="pp-dash-grid pp-dash-grid-3" style={{ marginBottom: '2rem' }}>
        <div className="pp-stat-card">
          <h3 style={{ color: '#818cf8' }}>{STATS.total}</h3>
          <p>Total Appointments</p>
        </div>
        <div className="pp-stat-card">
          <h3 style={{ color: '#10b981' }}>{STATS.completed}</h3>
          <p>Completed Draws</p>
        </div>
        <div className="pp-stat-card">
          <h3 style={{ color: '#fbbf24' }}>{STATS.upcoming}</h3>
          <p>Upcoming</p>
        </div>
      </div>

      {/* Upcoming */}
      <div className="pp-dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <CalendarDays size={18} />
          </div>
          Upcoming Appointments
        </div>
        {UPCOMING.length > 0 ? UPCOMING.map((appt) => (
          <div key={appt.id} className="pp-appt-item">
            <div className="pp-appt-date-block">
              <span className="pp-appt-month">{appt.month}</span>
              <span className="pp-appt-day">{appt.day}</span>
            </div>
            <div className="pp-appt-info">
              <h4>{appt.test}</h4>
              <p>{appt.time} • {appt.phlebotomist}</p>
            </div>
            <div className="pp-appt-actions">
              <button
                className="pp-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                onClick={() => navigate('/portal/patient/tracking')}
              >
                Track <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )) : (
          <div className="pp-empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <CalendarDays size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No upcoming appointments scheduled.</p>
          </div>
        )}
        <button
          className="pp-btn-primary"
          onClick={() => navigate('/portal/patient/book')}
          style={{ marginTop: '1rem' }}
        >
          <Plus size={18} /> Book New Appointment
        </button>
      </div>

      {/* Saved Phlebotomists */}
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
            <Star size={18} />
          </div>
          Saved Phlebotomists
        </div>
        {SAVED_PHLEBS.map((p) => (
          <div
            key={p.id}
            className="pp-saved-phleb"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/portal/patient/phlebotomist/' + p.id)}
          >
            <div className="pp-saved-phleb-avatar">{p.initials}</div>
            <div className="pp-saved-phleb-info">
              <h4>{p.name}</h4>
              <p>{p.draws} draws completed</p>
            </div>
            <div className="pp-saved-phleb-rating">
              <Star size={14} /> {p.rating}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderAppointments = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <Clock size={18} />
          </div>
          Upcoming
        </div>
        {UPCOMING.map((appt) => (
          <div key={appt.id} className="pp-appt-item">
            <div className="pp-appt-date-block">
              <span className="pp-appt-month">{appt.month}</span>
              <span className="pp-appt-day">{appt.day}</span>
            </div>
            <div className="pp-appt-info">
              <h4>{appt.test}</h4>
              <p>
                <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {appt.address}
              </p>
              <p>{appt.time} • {appt.phlebotomist}</p>
            </div>
            <span className="pp-appt-badge upcoming">Upcoming</span>
          </div>
        ))}
      </div>

      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <CalendarDays size={18} />
          </div>
          Past Appointments
        </div>
        {PAST.length > 0 ? PAST.map((appt) => (
          <div key={appt.id} className="pp-appt-item">
            <div className="pp-appt-date-block">
              <span className="pp-appt-month">{appt.month}</span>
              <span className="pp-appt-day">{appt.day}</span>
            </div>
            <div className="pp-appt-info">
              <h4>{appt.test}</h4>
              <p>{appt.time} • {appt.phlebotomist}</p>
            </div>
            <span className={`pp-appt-badge ${appt.status}`}>{appt.status}</span>
          </div>
        )) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <p>No past appointment history.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPhlebotomists = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
            <User size={18} />
          </div>
          Your Saved Specialists
        </div>
        {SAVED_PHLEBS.length > 0 ? SAVED_PHLEBS.map((p) => (
          <div
            key={p.id}
            className="pp-saved-phleb"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/portal/patient/phlebotomist/' + p.id)}
          >
            <div className="pp-saved-phleb-avatar">{p.initials}</div>
            <div className="pp-saved-phleb-info">
              <h4>{p.name}</h4>
              <p>{p.draws} draws completed</p>
            </div>
            <div className="pp-saved-phleb-rating">
              <Star size={14} /> {p.rating}
            </div>
          </div>
        )) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <p>You haven't saved any specialists yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderDocuments = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <FileText size={18} />
          </div>
          Uploaded Documents
        </div>
        {DOCUMENTS.length > 0 ? DOCUMENTS.map((doc) => (
          <div key={doc.id} className="pp-doc-item">
            <div className="pp-doc-icon"><FileText size={18} /></div>
            <div className="pp-doc-info">
              <h4>{doc.name}</h4>
              <p>{doc.type} • {doc.date}</p>
            </div>
          </div>
        )) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
            <p>No documents found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderPayments = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
            <CreditCard size={18} />
          </div>
          Saved Payment Methods
        </div>
        {PAYMENT_METHODS.map((card) => (
          <div key={card.id} className="pp-doc-item">
            <div className="pp-doc-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <CreditCard size={18} />
            </div>
            <div className="pp-doc-info">
              <h4>{card.brand} •••• {card.last4}</h4>
              <p>Expires {card.exp}</p>
            </div>
          </div>
        ))}
        <button className="pp-btn-secondary" style={{ marginTop: '1rem' }}>
          <Plus size={18} /> Add Payment Method
        </button>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <Settings size={18} />
          </div>
          Account Settings
        </div>
        <div className="pp-auth-form" style={{ maxWidth: 500 }}>
          <div className="pp-form-group">
            <label>Full Name</label>
            <input type="text" defaultValue={user.name} />
          </div>
          <div className="pp-form-group">
            <label>Email Address</label>
            <input type="email" defaultValue={user.email} />
          </div>
          <div className="pp-form-group">
            <label>Phone Number</label>
            <input type="tel" defaultValue="+1 (555) 000-0000" />
          </div>
          <div className="pp-form-group">
            <label>Notification Preferences</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 'auto' }} /> SMS
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 'auto' }} /> Email
              </label>
            </div>
          </div>
          <button className="pp-btn-primary" style={{ maxWidth: 200 }}>
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );

  const getContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'appointments': return renderAppointments();
      case 'phlebotomists': return renderPhlebotomists();
      case 'documents': return renderDocuments();
      case 'payments': return renderPayments();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  const TAB_TITLES = {
    overview: 'Dashboard',
    appointments: 'Appointments',
    phlebotomists: 'Saved Specialists',
    documents: 'Documents',
    payments: 'Payment Methods',
    settings: 'Account Settings'
  };

  return (
    <div className="pp-wrapper">
      <div className="pp-mesh-bg">
        <div className="pp-mesh-blob blob-1" />
        <div className="pp-mesh-blob blob-2" />
      </div>
      <div className="pp-content">
        <div className={`pp-dashboard ${sidebarOpen ? 'sidebar-active' : ''}`}>
          {/* Mobile Overlay */}
          {sidebarOpen && <div className="pp-dash-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`pp-dash-sidebar ${sidebarOpen ? 'active' : ''}`}>
            <div className="pp-dash-sidebar-logo">
              <div className="pp-dash-sidebar-logo-icon">
                <Droplets size={20} />
              </div>
              <h3>{user.name}</h3>
            </div>

            <nav className="pp-dash-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`pp-dash-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="pp-dash-nav-footer">
              <button className="pp-dash-nav-item" onClick={handleLogout}>
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="pp-dash-main">
            <div className="pp-dash-header">
              <div className="pp-dash-header-title-group">
                <button className="pp-dash-menu-toggle" onClick={() => setSidebarOpen(true)}>
                  <Menu size={24} />
                </button>
                <div className="pp-dash-header-text">
                  <h1>{TAB_TITLES[activeTab]}</h1>
                  <p className="pp-dash-header-subtitle">Welcome back, {user.name}</p>
                </div>
              </div>
            </div>


            {loading ? (
              <div className="pp-loader-container">
                <motion.div 
                  className="pp-loader"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>
            ) : getContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
