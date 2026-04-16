import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, CalendarDays, Clock, FileText, CreditCard,
  Settings, LogOut, Star, ChevronRight, Plus, MapPin, User
} from 'lucide-react';
import './PatientPortal.css';

/* ── Mock Data ────────────────────── */
const UPCOMING = [
  { id: 1, test: 'Comprehensive Metabolic Panel', date: 'Apr 22', day: '22', month: 'Apr', time: '9:00 AM', address: '123 Main St, New York', status: 'upcoming', phlebotomist: 'Jessica R.' },
  { id: 2, test: 'Complete Blood Count', date: 'Apr 28', day: '28', month: 'Apr', time: '11:00 AM', address: '456 Oak Ave, Brooklyn', status: 'upcoming', phlebotomist: 'Marcus T.' }
];

const PAST = [
  { id: 3, test: 'Lipid Panel', date: 'Apr 5', day: '05', month: 'Apr', time: '10:00 AM', status: 'completed', phlebotomist: 'Sarah K.' },
  { id: 4, test: 'Thyroid Panel (TSH)', date: 'Mar 18', day: '18', month: 'Mar', time: '8:30 AM', status: 'completed', phlebotomist: 'Jessica R.' },
  { id: 5, test: 'Hemoglobin A1C', date: 'Mar 2', day: '02', month: 'Mar', time: '9:00 AM', status: 'cancelled', phlebotomist: 'Marcus T.' }
];

const SAVED_PHLEBS = [
  { id: 1, name: 'Jessica Rivera', initials: 'JR', rating: 4.9, draws: 1200 },
  { id: 2, name: 'Marcus Thompson', initials: 'MT', rating: 4.8, draws: 860 },
  { id: 3, name: 'Sarah Kim', initials: 'SK', rating: 5.0, draws: 540 }
];

const DOCUMENTS = [
  { id: 1, name: "Dr. Wilson's Lab Order", type: 'Lab Order', date: 'Apr 10, 2026' },
  { id: 2, name: 'BCBS Insurance Card', type: 'Insurance', date: 'Apr 5, 2026' },
  { id: 3, name: 'Lipid Panel Results', type: 'Lab Results', date: 'Apr 7, 2026' }
];

const PAYMENT_METHODS = [
  { id: 1, brand: 'Visa', last4: '4242', exp: '08/27' },
  { id: 2, brand: 'Mastercard', last4: '8888', exp: '12/26' }
];
/* ── End Mock Data ────────────────── */

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const user = JSON.parse(localStorage.getItem('patient_user') || '{"name":"John Doe","email":"john@example.com"}');

  const handleLogout = () => {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_user');
    navigate('/portal/patient/login');
  };

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
          <h3 style={{ color: '#818cf8' }}>5</h3>
          <p>Total Appointments</p>
        </div>
        <div className="pp-stat-card">
          <h3 style={{ color: '#10b981' }}>3</h3>
          <p>Completed Draws</p>
        </div>
        <div className="pp-stat-card">
          <h3 style={{ color: '#fbbf24' }}>2</h3>
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
        {UPCOMING.map((appt) => (
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
        ))}
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
        {PAST.map((appt) => (
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
        ))}
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

  const renderDocuments = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="pp-dash-card">
        <div className="pp-dash-card-title">
          <div className="pp-dash-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
            <FileText size={18} />
          </div>
          Uploaded Documents
        </div>
        {DOCUMENTS.map((doc) => (
          <div key={doc.id} className="pp-doc-item">
            <div className="pp-doc-icon"><FileText size={18} /></div>
            <div className="pp-doc-info">
              <h4>{doc.name}</h4>
              <p>{doc.type} • {doc.date}</p>
            </div>
          </div>
        ))}
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
        <div className="pp-dashboard">
          {/* Sidebar */}
          <aside className="pp-dash-sidebar">
            <div className="pp-dash-sidebar-logo">
              <div className="pp-dash-sidebar-logo-icon">
                <Droplets size={20} />
              </div>
              <h3>MusB Patient</h3>
            </div>

            <nav className="pp-dash-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`pp-dash-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
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
              <div>
                <h1>{TAB_TITLES[activeTab]}</h1>
                <p className="pp-dash-header-subtitle">Welcome back, {user.name}</p>
              </div>
              <button
                className="pp-btn-primary"
                onClick={() => navigate('/portal/patient/book')}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <Plus size={18} /> Book Appointment
              </button>
            </div>

            {getContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
