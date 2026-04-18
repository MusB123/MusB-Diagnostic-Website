import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Star, DollarSign, Calendar, Bell,
  MapPin, Clock, FileText, User, Settings, LogOut,
  CheckCircle, XCircle, AlertTriangle, Wallet,
  Navigation, BarChart3, Shield, ChevronRight, Upload
} from 'lucide-react';
import './SpecialistPortal.css';

/* ── Mock Data ── */
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'urgent', title: 'New STAT Request', message: 'Urgent collection at 450 Park Ave.', time: '2 min ago' },
  { id: 2, type: 'payment', title: 'Payout Processed', message: 'Weekly payout of $1,245.50 sent.', time: '1 hr ago' },
  { id: 3, type: 'info', title: 'Route Optimized', message: 'Afternoon route updated for efficiency.', time: '3 hrs ago' },
  { id: 4, type: 'success', title: 'New 5-Star Review', message: '"Professional and punctual" — Sarah J.', time: '5 hrs ago' }
];

const MOCK_JOB = {
  patientName: 'Sarah J.',
  distance: '2.4 mi',
  address: '450 Park Avenue, Suite 12B',
  time: '10:30 AM — 11:00 AM',
  hasOrder: true,
  hasInsurance: true,
  isStat: false
};
/* ── End Mock Data ── */

const SpecialistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showJobRequest, setShowJobRequest] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [jobAccepted, setJobAccepted] = useState(false);

  const user = JSON.parse(localStorage.getItem('phleb_user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('phleb_token');
    const patientToken = localStorage.getItem('patient_token');
    if (!token) {
      if (patientToken) navigate('/portal/patient/dashboard', { replace: true });
      else navigate('/mobile-phlebotomy');
    }
  }, [navigate]);

  /* Auto-show job request after 5s for demo */
  useEffect(() => {
    const t = setTimeout(() => setShowJobRequest(true), 5000);
    return () => clearTimeout(t);
  }, []);

  /* Countdown timer */
  useEffect(() => {
    if (!showJobRequest || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { setShowJobRequest(false); return 120; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showJobRequest, timerSeconds]);

  const handleAcceptJob = () => {
    setJobAccepted(true);
    setTimeout(() => { setShowJobRequest(false); setJobAccepted(false); setTimerSeconds(120); }, 2000);
  };

  const handleDeclineJob = () => {
    setShowJobRequest(false);
    setTimerSeconds(120);
  };

  const handleLogout = () => {
    localStorage.removeItem('phleb_token');
    localStorage.removeItem('phleb_user');
    navigate('/mobile-phlebotomy');
  };

  const formatTimer = useCallback((s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }, []);

  const TABS = [
    { id: 'overview', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { id: 'route', label: 'Route Queue', icon: <Navigation size={18} /> },
    { id: 'earnings', label: 'Earnings', icon: <Wallet size={18} /> },
    { id: 'reviews', label: 'Reviews', icon: <Star size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> }
  ];

  return (
    <div className="sp-wrapper">
      <div className="sp-mesh-bg">
        <div className="sp-mesh-blob b1" />
        <div className="sp-mesh-blob b2" />
      </div>
      <div className="sp-content">
        <div className="sp-dashboard">
          {/* Sidebar */}
          <aside className="sp-sidebar">
            <div className="sp-sidebar-logo">
              <div className="sp-sidebar-logo-icon"><Droplets size={20} /></div>
              <h3>SPECIALIST HQ</h3>
            </div>
            <nav className="sp-sidebar-nav">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`sp-nav-item ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
            <div className="sp-sidebar-footer">
              <button className="sp-nav-item" onClick={() => setActiveTab('profile')}>
                <Settings size={18} /> Settings
              </button>
              <button className="sp-nav-item" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="sp-main">
            <div className="sp-main-header">
              <div>
                <h1>Welcome, {user.name || 'Specialist'}</h1>
                <p className="sp-main-header-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <button className="sp-btn-secondary" onClick={() => setShowJobRequest(true)}>
                <Bell size={16} /> Simulate Job
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'route' && <RouteTab navigate={navigate} />}
                {activeTab === 'earnings' && <EarningsTab />}
                {activeTab === 'reviews' && <ReviewsTab />}
                {activeTab === 'profile' && <ProfileTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Job Request Overlay */}
      <AnimatePresence>
        {showJobRequest && (
          <motion.div className="sp-job-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="sp-job-card" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}>
              {jobAccepted ? (
                <div style={{ padding: '2rem' }}>
                  <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                  <h2>Job Accepted!</h2>
                  <p style={{ color: '#94a3b8' }}>Added to your route queue.</p>
                </div>
              ) : (
                <>
                  <h2>Incoming Job Request</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Respond within the time limit</p>

                  <div className="sp-job-timer-bar">
                    <div className="sp-job-timer-fill" style={{ width: `${(timerSeconds / 120) * 100}%` }} />
                  </div>
                  <div className="sp-job-timer-text">{formatTimer(timerSeconds)}</div>

                  <div className="sp-job-badges">
                    {MOCK_JOB.hasOrder && <span className="sp-badge order"><FileText size={10} /> Doctor Order</span>}
                    {MOCK_JOB.hasInsurance && <span className="sp-badge insurance"><Shield size={10} /> Insured</span>}
                    {MOCK_JOB.isStat && <span className="sp-badge stat"><AlertTriangle size={10} /> STAT</span>}
                  </div>

                  <div className="sp-job-meta">
                    <div className="sp-job-meta-row">
                      <span>Patient</span>
                      <span>{MOCK_JOB.patientName}</span>
                    </div>
                    <div className="sp-job-meta-row">
                      <span>Distance</span>
                      <span>{MOCK_JOB.distance}</span>
                    </div>
                    <div className="sp-job-meta-row">
                      <span>Address</span>
                      <span>{MOCK_JOB.address}</span>
                    </div>
                    <div className="sp-job-meta-row">
                      <span>Time Window</span>
                      <span>{MOCK_JOB.time}</span>
                    </div>
                  </div>

                  <div className="sp-btn-row">
                    <button className="sp-btn-danger" onClick={handleDeclineJob}>
                      <XCircle size={18} /> Decline
                    </button>
                    <button className="sp-btn-primary" onClick={handleAcceptJob}>
                      <CheckCircle size={18} /> Accept
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══ TAB COMPONENTS ═══ */

const OverviewTab = () => (
  <>
    <div className="sp-kpi-grid">
      {[
        { label: "Today's Jobs", value: '6', icon: <Calendar size={20} />, bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
        { label: 'Week Earnings', value: '$1,890', icon: <DollarSign size={20} />, bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
        { label: 'Star Rating', value: '4.95', icon: <Star size={20} />, bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' },
        { label: 'Completed', value: '234', icon: <CheckCircle size={20} />, bg: 'rgba(99,102,241,0.1)', color: '#818cf8' }
      ].map((k, i) => (
        <div key={i} className="sp-kpi-card">
          <div className="sp-kpi-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
          <h3>{k.value}</h3>
          <p>{k.label}</p>
        </div>
      ))}
    </div>

    <div className="sp-grid-2">
      {/* Next Appointment */}
      <div className="sp-card">
        <div className="sp-card-title"><Calendar size={16} color="#818cf8" /> Next Appointment</div>
        <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.06)', borderRadius: 16, border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Sarah J.</span>
            <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.85rem' }}>10:30 AM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <MapPin size={14} /> 450 Park Avenue, Suite 12B
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <span className="sp-badge order"><FileText size={10} /> Lab Order</span>
            <span className="sp-badge insurance"><Shield size={10} /> BCBS</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="sp-card">
        <div className="sp-card-title"><Bell size={16} color="#818cf8" /> Notifications</div>
        {MOCK_NOTIFICATIONS.map(n => (
          <div key={n.id} className="sp-notif-item">
            <div className={`sp-notif-dot ${n.type}`} />
            <div className="sp-notif-text">
              <h4>{n.title}</h4>
              <p>{n.message}</p>
            </div>
            <span className="sp-notif-time">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

const RouteTab = ({ navigate }) => {
  const JOBS = [
    { id: 1, patient: 'Sarah J.', address: '450 Park Ave, Suite 12B', time: '10:30 AM', type: 'Routine Panel', status: 'enroute' },
    { id: 2, patient: 'Michael R.', address: '220 W 42nd St, FL 8', time: '11:15 AM', type: 'Lipid Panel', status: 'upcoming' },
    { id: 3, patient: 'Linda P.', address: '88 Greenwich St', time: '12:00 PM', type: 'CBC + CMP', status: 'upcoming' },
    { id: 4, patient: 'David W.', address: '712 5th Avenue', time: '1:30 PM', type: 'Thyroid Panel', status: 'upcoming' },
    { id: 5, patient: 'Emma K.', address: '55 Water St, Apt 14A', time: '2:45 PM', type: 'Glucose Fasting', status: 'completed' }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Today&apos;s Route — {JOBS.length} Stops</h3>
        <button className="sp-btn-secondary" style={{ padding: '10px 18px', fontSize: '0.8rem' }}>
          <Navigation size={14} /> Reorder Route
        </button>
      </div>

      {JOBS.map((j, idx) => (
        <div
          key={j.id}
          className="sp-route-item"
          onClick={() => navigate('/portal/specialist/job')}
        >
          <div className="sp-route-num">{idx + 1}</div>
          <div className="sp-route-info">
            <h4>{j.patient} — {j.type}</h4>
            <p><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{j.address} · {j.time}</p>
          </div>
          <span className={`sp-route-status ${j.status}`}>{j.status === 'enroute' ? 'En Route' : j.status}</span>
          <ChevronRight size={18} color="#475569" />
        </div>
      ))}

      <div className="sp-map-container" style={{ marginTop: '1.5rem' }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
          <MapPin size={32} style={{ marginRight: 8 }} /> Map view — Leaflet integration ready
        </div>
      </div>
    </>
  );
};

const EarningsTab = () => {
  const daysUntilFriday = () => {
    const d = new Date();
    const day = d.getDay();
    return day <= 5 ? 5 - day : 6;
  };

  const HISTORY = [
    { date: 'Apr 11, 2026', jobs: 8, gross: '$360.00', fee: '30%', net: '$252.00' },
    { date: 'Apr 4, 2026', jobs: 7, gross: '$315.00', fee: '30%', net: '$220.50' },
    { date: 'Mar 28, 2026', jobs: 9, gross: '$405.00', fee: '30%', net: '$283.50' },
    { date: 'Mar 21, 2026', jobs: 6, gross: '$270.00', fee: '30%', net: '$189.00' }
  ];

  return (
    <>
      <div className="sp-earnings-summary">
        <div className="sp-earnings-card">
          <h3 style={{ color: '#34d399' }}>$1,890</h3>
          <p>Gross This Week</p>
        </div>
        <div className="sp-earnings-card">
          <h3 style={{ color: '#f87171' }}>-$567</h3>
          <p>Platform Fee (30%)</p>
        </div>
        <div className="sp-earnings-card">
          <h3>$1,323</h3>
          <p>Net Payout</p>
        </div>
      </div>

      <div className="sp-payout-countdown">
        <Clock size={20} color="#818cf8" />
        <span>Next payout in</span>
        <strong>{daysUntilFriday()} days</strong>
        <span>(Friday)</span>
      </div>

      <div className="sp-card">
        <div className="sp-card-title"><Wallet size={16} color="#818cf8" /> Payment History</div>
        <table className="sp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Jobs</th>
              <th>Gross</th>
              <th>Fee</th>
              <th>Net Paid</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i}>
                <td>{h.date}</td>
                <td>{h.jobs}</td>
                <td>{h.gross}</td>
                <td style={{ color: '#f87171' }}>{h.fee}</td>
                <td style={{ fontWeight: 800, color: 'white' }}>{h.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const ReviewsTab = () => {
  const BREAKDOWN = [
    { stars: 5, count: 198, pct: 85 },
    { stars: 4, count: 24, pct: 10 },
    { stars: 3, count: 8, pct: 3 },
    { stars: 2, count: 3, pct: 1 },
    { stars: 1, count: 1, pct: 0.4 }
  ];

  const REVIEWS = [
    { id: 1, stars: 5, text: 'Incredibly professional and quick. Best phlebotomy experience I\'ve had.', author: 'Sarah J.', date: 'Apr 12, 2026' },
    { id: 2, stars: 5, text: 'Arrived promptly, very gentle with the draw. Will request again!', author: 'Michael R.', date: 'Apr 10, 2026' },
    { id: 3, stars: 4, text: 'Great service overall. Minor difficulty finding the vein but handled it well.', author: 'Linda P.', date: 'Apr 8, 2026' }
  ];

  return (
    <>
      <div className="sp-grid-2">
        <div className="sp-card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '4rem', fontWeight: 900, color: '#fbbf24', margin: '1rem 0 0.5rem' }}>4.95</h3>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: '0.5rem' }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="#fbbf24" color="#fbbf24" />)}
          </div>
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.85rem' }}>Based on 234 reviews</p>
        </div>

        <div className="sp-card">
          <div className="sp-card-title">Rating Breakdown</div>
          <div className="sp-rating-breakdown">
            {BREAKDOWN.map(b => (
              <div key={b.stars} className="sp-rating-bar-row">
                <span className="sp-rating-bar-label">{b.stars} ★</span>
                <div className="sp-rating-bar">
                  <div className="sp-rating-bar-fill" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="sp-rating-bar-count">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sp-card" style={{ marginTop: '1.5rem' }}>
        <div className="sp-card-title"><Star size={16} color="#fbbf24" /> Recent Reviews</div>
        {REVIEWS.map(r => (
          <div key={r.id} className="sp-review-item">
            <div className="sp-review-item-header">
              <div className="sp-review-item-stars">
                {Array.from({ length: r.stars }, (_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <span className="sp-review-item-date">{r.date}</span>
            </div>
            <p>{r.text}</p>
            <p className="sp-review-item-author">— {r.author}</p>
          </div>
        ))}
      </div>
    </>
  );
};

const ProfileTab = () => {
  const [available, setAvailable] = useState(true);

  const DOCS = [
    { name: 'Driving License', status: 'valid', expires: 'Dec 2027', icon: <User size={20} />, bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
    { name: 'Phlebotomy Certificate', status: 'valid', expires: 'Jun 2028', icon: <Shield size={20} />, bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
    { name: 'Liability Insurance', status: 'pending', expires: 'Renewal Pending', icon: <FileText size={20} />, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' }
  ];

  return (
    <>
      {/* Availability Toggle */}
      <div className="sp-avail-toggle">
        <button className={`sp-toggle-switch ${available ? 'on' : ''}`} onClick={() => setAvailable(!available)} />
        <div className="sp-avail-text">
          <h4>{available ? 'On Duty' : 'Off Duty'}</h4>
          <p>{available ? 'You are accepting new job requests' : 'You are not receiving job requests'}</p>
        </div>
      </div>

      <div className="sp-grid-2">
        <div className="sp-card">
          <div className="sp-card-title"><User size={16} color="#818cf8" /> Personal Information</div>
          <div className="sp-form" style={{ gap: '1rem' }}>
            <div className="sp-form-group">
              <label>Full Name</label>
              <input type="text" defaultValue="Mishra (Mission Control)" />
            </div>
            <div className="sp-form-group">
              <label>Email</label>
              <input type="email" defaultValue="phleb@musb.com" readOnly style={{ opacity: 0.6 }} />
            </div>
            <div className="sp-form-group">
              <label>Phone</label>
              <input type="tel" defaultValue="+1 (555) 000-0000" />
            </div>
            <div className="sp-form-group">
              <label>Service Zones</label>
              <input type="text" defaultValue="Manhattan, Brooklyn, Queens" />
            </div>
            <button className="sp-btn-primary" style={{ marginTop: '0.5rem' }}>Save Changes</button>
          </div>
        </div>

        <div className="sp-card">
          <div className="sp-card-title"><FileText size={16} color="#818cf8" /> Documents</div>
          {DOCS.map((d, i) => (
            <div key={i} className="sp-doc-item">
              <div className="sp-doc-icon" style={{ background: d.bg, color: d.color }}>{d.icon}</div>
              <div className="sp-doc-info">
                <h4>{d.name}</h4>
                <p>{d.expires}</p>
              </div>
              <span className={`sp-doc-status ${d.status}`}>{d.status}</span>
            </div>
          ))}
          <button className="sp-btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>
            <Upload size={16} /> Re-upload Documents
          </button>
        </div>
      </div>
    </>
  );
};

export default SpecialistDashboard;
