import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api';
import '../../styles/Admin.css';

/* ═══════════════════════════════════════════════════════════════
   PHLEBOTOMY MANAGEMENT — Super Admin Panel
   9-tab unified management center for the mobile phlebotomy platform
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = '/api/superadmin/phleb-management';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'patients', label: 'Patients', icon: '👤' },
  { id: 'phlebotomists', label: 'Phlebotomists', icon: '💉' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ── Helpers ── */
function StatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    suspended: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    disqualified: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    completed: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    in_progress: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    cancelled: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
    disputed: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    paid: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    on_hold: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    flagged: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    valid: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    expired: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    expiring: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    complete: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    paused: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
    pending_approval: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  };
  const s = (status || '').toLowerCase().replace(/\s/g, '_');
  const c = colors[s] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8' };
  return (
    <span style={{ display: 'inline-block', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'capitalize', background: c.bg, color: c.color, letterSpacing: '0.03em' }}>
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function CardBox({ children, style }) {
  return (
    <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1rem', padding: '1.5rem', ...style }}>
      {children}
    </div>
  );
}

function exportCSV(filename, headers, rows) {
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
function PhlebotomyManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      const endpoint = activeTab === 'overview' ? 'overview' : activeTab;
      try {
        const res = await api.get(`${API_BASE}/${endpoint}/`);
        setData(prev => ({ ...prev, [activeTab]: res.data }));
        setLastUpdated(new Date());
      } catch (err) {
        console.error(`Failed to fetch ${activeTab}:`, err);
        setError(err?.response?.data?.error || `Failed to fetch ${activeTab} data`);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchData(false);
    const poll = setInterval(() => {
      fetchData(true);
      if (activeTab !== 'overview') {
        api.get(`${API_BASE}/realtime/`)
          .then((res) => setData(prev => ({ ...prev, realtime: res.data })))
          .catch(() => {});
      }
    }, 15000);

    return () => clearInterval(poll);
  }, [activeTab]);

  return (
    <div>
      <div className="admin-header-main">
        <div>
          <h1 className="admin-page-title">Phlebotomy Management</h1>
          <p className="admin-page-subtitle">Mobile Dispatch &amp; Operations Control Center</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            Live Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.6rem 1.1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              background: activeTab === t.id ? 'var(--admin-accent)' : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? 'white' : 'var(--admin-text-secondary)',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontWeight: 700, fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="admin-loading-container"><div className="admin-spinner" /><p>Loading {activeTab}...</p></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && <OverviewTab data={data.overview} />}
            {activeTab === 'patients' && <PatientsTab data={data.patients} />}
            {activeTab === 'phlebotomists' && <PhlebotomistsTab data={data.phlebotomists} setData={setData} />}
            {activeTab === 'companies' && <CompaniesTab data={data.companies} />}
            {activeTab === 'orders' && <OrdersTab data={data.orders} setData={setData} />}
            {activeTab === 'payments' && <PaymentsTab data={data.payments} />}
            {activeTab === 'reviews' && <ReviewsTab data={data.reviews} />}
            {activeTab === 'marketing' && <MarketingTab data={data.marketing} />}
            {activeTab === 'settings' && <SettingsTab data={data.settings} />}
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}


/* ═══════════════════════════════════════════
   TAB 1 — OVERVIEW
   ═══════════════════════════════════════════ */
function OverviewTab({ data }) {
  if (!data) return null;
  const kpis = data.kpis || {};
  const kpiOrder = ['orders_today', 'orders_week', 'orders_month', 'total_revenue', 'platform_fees', 'active_phlebotomists', 'registered_companies', 'flagged_accounts'];

  return (
    <>
      {/* KPI Tiles */}
      <div className="admin-stats-grid">
        {kpiOrder.map(key => {
          const k = kpis[key];
          if (!k) return null;
          return (
            <motion.div key={key} className="kpi-card" whileHover={{ y: -4 }}>
              <span className="kpi-label">{key.replace(/_/g, ' ').toUpperCase()}</span>
              <div className="kpi-value">{k.value}</div>
              <div className={`kpi-trend trend-${k.trend}`}>
                {k.trend === 'up' ? '▲' : '▼'} {k.change}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Orders Chart Placeholder */}
        <CardBox>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>📈 Orders This Week</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '160px' }}>
            {(data.orders_over_time || []).map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{d.orders}</span>
                <div style={{ width: '100%', background: `linear-gradient(to top, var(--admin-accent), rgba(16,185,129,0.3))`, borderRadius: '0.5rem 0.5rem 0 0', height: `${(d.orders / 80) * 100}%`, minHeight: '8px', transition: 'height 0.5s ease' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{d.date}</span>
              </div>
            ))}
          </div>
        </CardBox>

        {/* Top ZIP Codes */}
        <CardBox>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>📍 Top ZIP Codes by Volume</h3>
          {(data.top_zip_codes || []).map((z, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: i < 4 ? '1px solid var(--admin-border)' : 'none' }}>
              <span style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', color: '#818cf8' }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{z.zip} — {z.city}</div>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--admin-accent)' }}>{z.orders}</span>
            </div>
          ))}
        </CardBox>
      </div>

      {/* Recent Activity */}
      <CardBox>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>🕐 Recent Activity Feed</h3>
        {(data.recent_activity || []).map(a => {
          const icons = { signup: '👤', order: '📋', cancellation: '❌', dispute: '⚠️' };
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--admin-border)' }}>
              <span style={{ fontSize: '1.2rem' }}>{icons[a.type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.message}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.time}</span>
            </div>
          );
        })}
      </CardBox>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 2 — PATIENTS
   ═══════════════════════════════════════════ */
function PatientsTab({ data }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const patients = (data?.patients || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-input-group">
          <span className="admin-input-icon">🔍</span>
          <input className="admin-input" placeholder="Search patients by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-select-group">
          <span>📊</span>
          <select className="admin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
        <button className="action-btn" onClick={() => exportCSV('patients.csv', ['id','name','email','phone','total_bookings','status'], patients)}>📥 Export CSV</button>
      </div>

      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Name', 'Email', 'Phone', 'Bookings', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{p.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                <td style={tdStyle}>{p.email}</td>
                <td style={tdStyle}>{p.phone}</td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{p.total_bookings}</span></td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
                <td style={tdStyle}>
                  <button style={actionBtnStyle} onClick={() => setSelected(p)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div style={drawerOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div style={drawerPanel} initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Patient Detail</h2>
                <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => setSelected(null)}>✕ Close</button>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  ['Name', selected.name], ['Email', selected.email], ['Phone', selected.phone],
                  ['Status', selected.status], ['Joined', selected.joined], ['Last Booking', selected.last_booking],
                  ['Insurance', selected.insurance], ['Total Bookings', selected.total_bookings],
                  ['Payment Method', selected.payment_method],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>{l}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button className="action-btn">📝 Add Note</button>
                <button className="action-btn" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>⏸ Suspend</button>
                <button className="action-btn" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}>💰 Issue Refund</button>
                <button className="action-btn">📥 Export Record</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 3 — PHLEBOTOMISTS
   ═══════════════════════════════════════════ */
function PhlebotomistsTab({ data, setData }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const phlebs = (data?.phlebotomists || []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingPhlebs = (data?.phlebotomists || []).filter(p => p.status === 'pending');

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.post(`${API_BASE}/phlebotomists/${id}/status/`, { status });
      // Refresh only the phlebotomists tab data
      const res = await api.get(`${API_BASE}/phlebotomists/`);
      setData(prev => ({ ...prev, phlebotomists: res.data }));
      setSelected(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating phlebotomist status.");
    }
  };

  return (
    <>
      {/* Verification Queue Section (NEW) */}
      {pendingPhlebs.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>Onboarding Verification Queue</h2>
            <span style={{ background: '#f59e0b', color: '#000', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 900 }}>
              {pendingPhlebs.length} PENDING
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {pendingPhlebs.map(p => (
              <CardBox key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.email}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#818cf8' }}>{p.id}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.zip_codes && p.zip_codes.slice(0, 3).map(z => (
                    <span key={z} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', color: '#64748b' }}>{z}</span>
                  ))}
                  {p.zip_codes?.length > 3 && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>+{p.zip_codes.length - 3} more</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                  <button className="action-btn" style={{ flex: 1 }} onClick={() => setSelected(p)}>Review Docs</button>
                  <button className="action-btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }} onClick={() => handleStatusUpdate(p.id, 'active')}>✓ Approve</button>
                  <button className="action-btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleStatusUpdate(p.id, 'rejected')}>✕</button>
                </div>
              </CardBox>
            ))}
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-input-group">
          <span className="admin-input-icon">🔍</span>
          <input className="admin-input" placeholder="Search phlebotomists..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="admin-select-group">
          <span>📊</span>
          <select className="admin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>
        <button className="action-btn" onClick={() => exportCSV('phlebotomists.csv', ['id','name','type','status','rating','total_jobs'], phlebs)}>📥 Export CSV</button>
      </div>

      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Name', 'Type', 'Status', 'Rating', 'Jobs', 'DL', 'Cert', 'Insurance', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {phlebs.map(p => (
              <tr key={p.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{p.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{p.type}</span></td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: p.rating >= 4.5 ? '#fbbf24' : p.rating >= 3 ? '#94a3b8' : '#ef4444' }}>★ {p.rating || '—'}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{p.total_jobs}</span></td>
                <td style={tdStyle}><StatusBadge status={p.compliance?.dl} /></td>
                <td style={tdStyle}><StatusBadge status={p.compliance?.certificate} /></td>
                <td style={tdStyle}><StatusBadge status={p.compliance?.insurance} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button style={actionBtnStyle} onClick={() => setSelected(p)}>View</button>
                    {p.status === 'pending' && <button style={{ ...actionBtnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981' }} onClick={() => handleStatusUpdate(p.id, 'active')}>✓</button>}
                    {p.status === 'pending' && <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => handleStatusUpdate(p.id, 'rejected')}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>

      {/* Phlebotomist Detail Drawer with Staff Dashboard Preview */}
      <AnimatePresence>
        {selected && (
          <motion.div style={drawerOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div style={{ ...drawerPanel, maxWidth: '600px' }} initial={{ x: 600 }} animate={{ x: 0 }} exit={{ x: 600 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selected.name}</h2>
                <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => setSelected(null)}>✕ Close</button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={selected.status} />
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{selected.type}</span>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>★ {selected.rating}</span>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  ['Email', selected.email], ['Phone', selected.phone], ['Joined', selected.joined],
                  ['Total Jobs', selected.total_jobs], ['ZIP Codes', (selected.zip_codes || []).join(', ')],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>{l}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>Compliance Documents</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {Object.entries(selected.compliance || {}).map(([k, v]) => (
                  <div key={k} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>{k}</div>
                    <StatusBadge status={v} />
                  </div>
                ))}
              </div>

              {/* Staff Dashboard Preview */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>🖥️ Staff Dashboard Preview</h3>
              <div style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#818cf8' }}>{selected.total_jobs}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Jobs Done</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24' }}>★ {selected.rating}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{(selected.zip_codes || []).length}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ZIP Zones</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                  This is what {selected.name.split(' ')[0]} sees in their Specialist HQ dashboard
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {selected.status === 'pending' && <button className="action-btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }} onClick={() => handleStatusUpdate(selected.id, 'active')}>✓ Approve Signup</button>}
                {selected.status === 'pending' && <button className="action-btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleStatusUpdate(selected.id, 'rejected')}>✕ Reject Signup</button>}
                {selected.status === 'active' && <button className="action-btn" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }} onClick={() => handleStatusUpdate(selected.id, 'disqualified')}>⚠ Disqualify</button>}
                <button className="action-btn">📍 Override ZIP Codes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 4 — COMPANIES
   ═══════════════════════════════════════════ */
function CompaniesTab({ data }) {
  const [selected, setSelected] = useState(null);
  const companies = data?.companies || [];

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-input-group" style={{ flex: 1 }}>
          <span className="admin-input-icon">🔍</span>
          <input className="admin-input" placeholder="Search companies..." />
        </div>
        <button className="action-btn" onClick={() => exportCSV('companies.csv', ['id','name','contact','phlebotomist_count','orders','revenue','status'], companies)}>📥 Export CSV</button>
      </div>

      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Company', 'Contact', 'Phlebotomists', 'Orders', 'Revenue', 'Docs', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{c.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{c.name}</span></td>
                <td style={tdStyle}>{c.contact}</td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{c.phlebotomist_count}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{c.orders}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#10b981' }}>{c.revenue}</span></td>
                <td style={tdStyle}><StatusBadge status={c.doc_status} /></td>
                <td style={tdStyle}><StatusBadge status={c.status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button style={actionBtnStyle} onClick={() => setSelected(c)}>View</button>
                    {c.status === 'pending' && <button style={{ ...actionBtnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✓</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>

      <AnimatePresence>
        {selected && (
          <motion.div style={drawerOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div style={drawerPanel} initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selected.name}</h2>
                <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => setSelected(null)}>✕ Close</button>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['Contact', selected.contact], ['Email', selected.email], ['Phlebotomists', selected.phlebotomist_count], ['Total Orders', selected.orders], ['Revenue', selected.revenue], ['Docs', selected.doc_status], ['Joined', selected.joined]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>{l}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {selected.status === 'pending' && <button className="action-btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>✓ Approve</button>}
                {selected.status === 'pending' && <button className="action-btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>✕ Reject</button>}
                {selected.status === 'active' && <button className="action-btn" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>⏸ Suspend</button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 5 — ORDERS
   ═══════════════════════════════════════════ */
function OrdersTab({ data, setData }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const orders = (data?.orders || []).filter(o => statusFilter === 'all' || o.status === statusFilter);

  const handleStatusUpdate = async (orderId, newStatus, rejectionReason = '') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/api/superadmin/phleb-management/orders/${orderId}/status/`, {
        status: newStatus,
        reason: rejectionReason
      });
      
      // Update local state to reflect change immediately
      setData(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          orders: prev.orders.orders.map(o => o.id === orderId ? { ...o, status: res.data.status } : o)
        }
      }));
      
      setRejectingId(null);
      setReason('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Action failed - Potential System Outage';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-input-group">
          <span className="admin-input-icon">🔍</span>
          <input className="admin-input" placeholder="Search orders by ID, patient, or phlebotomist..." />
        </div>
        <div className="admin-select-group">
          <span>📊</span>
          <select className="admin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="pending">Approved (Pending Dispatch)</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button className="action-btn" onClick={() => exportCSV('orders.csv', ['id','patient','phlebotomist','date','status','charge'], orders)}>📥 Export CSV</button>
      </div>

      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Order ID', 'Patient', 'Phlebotomist', 'Date', 'Tests', 'Charge', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{o.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{o.patient}</span></td>
                <td style={tdStyle}>{o.phlebotomist || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Unassigned</span>}</td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem' }}>{o.date} {o.time}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem' }}>{o.tests}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#10b981' }}>{o.charge}</span></td>
                <td style={tdStyle}><StatusBadge status={o.status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button style={actionBtnStyle} onClick={() => setSelected(o)}>View</button>
                      
                      {o.status === 'pending_approval' && (
                        <>
                          <button 
                            style={{ ...actionBtnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                            onClick={() => handleStatusUpdate(o.id, 'approved')}
                            disabled={actionLoading}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                            onClick={() => setRejectingId(o.id === rejectingId ? null : o.id)}
                            disabled={actionLoading}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>

                    {rejectingId === o.id && (
                      <div style={{ marginTop: '0.5rem', background: 'rgba(239,68,68,0.05)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <label style={{ ...labelStyle, fontSize: '0.65rem', marginBottom: '0.25rem' }}>Rejection Reason (Sent to Patient)</label>
                        <textarea 
                          style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.4rem', minHeight: '60px' }} 
                          placeholder="Type reason here..."
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                        />
                        <button 
                          className="action-btn" 
                          style={{ marginTop: '0.5rem', width: '100%', background: '#ef4444', color: '#fff' }}
                          onClick={() => handleStatusUpdate(o.id, 'rejected', reason)}
                          disabled={!reason || actionLoading}
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>

      <AnimatePresence>
        {selected && (
          <motion.div style={drawerOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div style={drawerPanel} initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Order {selected.id}</h2>
                <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }} onClick={() => setSelected(null)}>✕ Close</button>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[['Patient', selected.patient], ['Phlebotomist', selected.phlebotomist || 'Unassigned'], ['Company', selected.company || 'N/A'], ['Date/Time', `${selected.date} ${selected.time}`], ['Tests', selected.tests], ['Charge', selected.charge], ['Insurance', selected.insurance], ['Doctor Order', selected.has_order ? 'Yes' : 'No'], ['ZIP', selected.zip], ['Status', selected.status]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem' }}>{l}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button className="action-btn" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}>🔄 Reassign Phlebotomist</button>
                <button className="action-btn">📥 Export Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 6 — PAYMENTS
   ═══════════════════════════════════════════ */
function PaymentsTab({ data }) {
  if (!data) return null;

  return (
    <>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Total Pending</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{data.total_pending}</div>
        </CardBox>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Platform Fee</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#818cf8' }}>{data.platform_fee_rate}</div>
        </CardBox>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Next Payout</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-accent)' }}>{data.next_payout_day}</div>
        </CardBox>
      </div>

      {/* Payout Queue */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>📤 Friday Payout Queue</h3>
      <CardBox style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Recipient', 'Type', 'Gross', 'Fee', 'Net', 'Jobs', 'Status', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.payout_queue || []).map(p => (
              <tr key={p.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{p.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{p.recipient}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{p.type}</span></td>
                <td style={tdStyle}>{p.gross}</td>
                <td style={tdStyle}><span style={{ color: '#f87171' }}>{p.fee}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: 'white' }}>{p.net}</span></td>
                <td style={tdStyle}>{p.jobs}</td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button style={{ ...actionBtnStyle, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem' }}>Release</button>
                    <button style={{ ...actionBtnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.65rem' }}>Hold</button>
                    <button style={{ ...actionBtnStyle, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: '0.65rem' }}>Adjust</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>

      {/* Payment History */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>📜 Payment History</h3>
      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['TXN ID', 'Recipient', 'Date', 'Gross', 'Fee', 'Net', 'Status'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.payment_history || []).map(p => (
              <tr key={p.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{p.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{p.recipient}</span></td>
                <td style={tdStyle}>{p.date}</td>
                <td style={tdStyle}>{p.gross}</td>
                <td style={tdStyle}><span style={{ color: '#f87171' }}>{p.fee}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{p.net}</span></td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 7 — REVIEWS
   ═══════════════════════════════════════════ */
function ReviewsTab({ data }) {
  const [filter, setFilter] = useState('all');
  const reviews = (data?.reviews || []).filter(r => {
    if (filter === 'flagged') return r.flagged;
    if (filter === 'low') return r.rating <= 2;
    return true;
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Total Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{data?.total || 0}</div>
        </CardBox>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Flagged</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>{data?.flagged_count || 0}</div>
        </CardBox>
        <CardBox style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>Auto-Flag Threshold</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>≤ {data?.auto_flag_threshold || 2} ★</div>
        </CardBox>
      </div>

      <div className="admin-toolbar">
        <div className="admin-select-group">
          <span>🔍</span>
          <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Reviews</option>
            <option value="flagged">Flagged Only</option>
            <option value="low">Low Rating (≤2★)</option>
          </select>
        </div>
      </div>

      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Patient', 'Phlebotomist', 'Rating', 'Review', 'Date', 'Flagged', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r.id} style={{ ...trStyle, background: r.flagged ? 'rgba(239,68,68,0.04)' : undefined }}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{r.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{r.patient}</span></td>
                <td style={tdStyle}>{r.phlebotomist}</td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: r.rating >= 4 ? '#fbbf24' : r.rating >= 3 ? '#94a3b8' : '#ef4444' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></td>
                <td style={{ ...tdStyle, maxWidth: '250px' }}><span style={{ fontSize: '0.8rem' }}>{r.text}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem' }}>{r.date}</span></td>
                <td style={tdStyle}>{r.flagged ? <span style={{ color: '#ef4444', fontWeight: 800 }}>🚩</span> : '—'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {!r.flagged && <button style={{ ...actionBtnStyle, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.65rem' }}>Flag</button>}
                    <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.65rem' }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 8 — MARKETING
   ═══════════════════════════════════════════ */
function MarketingTab({ data }) {
  if (!data) return null;

  return (
    <>
      {/* Campaigns */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>📣 Ad Campaigns</h3>
      <CardBox style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Campaign', 'Platform', 'Spend', 'Clicks', 'Conversions', 'Status', 'UTM'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.campaigns || []).map(c => (
              <tr key={c.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{c.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{c.name}</span></td>
                <td style={tdStyle}>{c.platform}</td>
                <td style={tdStyle}>{c.spend}</td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{c.clicks.toLocaleString()}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#10b981' }}>{c.conversions}</span></td>
                <td style={tdStyle}><StatusBadge status={c.status} /></td>
                <td style={tdStyle}><code style={{ fontSize: '0.65rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>{c.utm}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem' }}>
          <button className="action-btn">➕ Create Campaign</button>
        </div>
      </CardBox>

      {/* SEO Settings */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>🔍 Landing Page SEO</h3>
      <CardBox style={{ marginBottom: '2rem' }}>
        {(data.seo_pages || []).map((p, i) => (
          <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', marginBottom: i < (data.seo_pages || []).length - 1 ? '0.75rem' : 0 }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{p.page} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ZIP: {p.zip}</span></div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}><strong>Title:</strong> {p.meta_title}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}><strong>Desc:</strong> {p.meta_desc}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><strong>Keywords:</strong> {p.keywords}</div>
            <button style={{ ...actionBtnStyle, marginTop: '0.75rem', fontSize: '0.7rem' }}>✏ Edit SEO</button>
          </div>
        ))}
      </CardBox>

      {/* Promo Codes */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>🎟️ Promotional Codes</h3>
      <CardBox style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Code', 'Discount', 'Usage', 'Limit', 'Expires', 'Status'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.promo_codes || []).map(p => (
              <tr key={p.code} style={trStyle}>
                <td style={tdStyle}><code style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{p.code}</code></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{p.discount}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 800 }}>{p.usage}</span></td>
                <td style={tdStyle}>{p.limit}</td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem' }}>{p.expires}</span></td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem' }}>
          <button className="action-btn">➕ Create Promo Code</button>
        </div>
      </CardBox>

      {/* Email/SMS Blast */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>📨 Email/SMS Blast</h3>
      <CardBox>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Audience Segment</label>
            <select style={inputStyle}>
              <option>All Patients</option>
              <option>By ZIP Code</option>
              <option>Inactive Users (30+ days)</option>
              <option>New Signups (Last 7 days)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Channel</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="action-btn" style={{ flex: 1 }}>📧 Email</button>
              <button className="action-btn" style={{ flex: 1 }}>📱 SMS</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <textarea rows={4} placeholder="Compose your message..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <button className="action-btn" style={{ background: 'var(--admin-accent)', color: 'white', borderColor: 'var(--admin-accent)', width: 'fit-content' }}>🚀 Schedule Send</button>
        </div>
      </CardBox>
    </>
  );
}


/* ═══════════════════════════════════════════
   TAB 9 — SETTINGS
   ═══════════════════════════════════════════ */
function SettingsTab({ data }) {
  if (!data) return null;
  const config = data.system_config || {};

  return (
    <>
      {/* Admin Users */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>👥 Admin Users &amp; Roles</h3>
      <CardBox style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Name', 'Email', 'Role', 'Last Login', 'Actions'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.admin_users || []).map(u => (
              <tr key={u.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{u.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{u.name}</span></td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}><span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{u.role}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem' }}>{u.last_login}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button style={actionBtnStyle}>Edit</button>
                    <button style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem' }}>
          <button className="action-btn">➕ Add Admin User</button>
        </div>
      </CardBox>

      {/* System Configuration */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>⚙️ System Configuration</h3>
      <CardBox style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Platform Fee (%)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="range" min={config.platform_fee_min} max={config.platform_fee_max} defaultValue={config.current_fee} style={{ flex: 1 }} />
              <span style={{ fontWeight: 900, color: 'var(--admin-accent)', minWidth: '40px' }}>{config.current_fee}%</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Range: {config.platform_fee_min}% — {config.platform_fee_max}%</span>
          </div>
          <div>
            <label style={labelStyle}>Cancellation Window (Hours)</label>
            <input type="number" defaultValue={config.cancellation_window_hours} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Payout Day</label>
            <select style={inputStyle} defaultValue={config.payout_day}>
              <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Rating Disqualify Threshold</label>
            <input type="number" step="0.1" defaultValue={config.rating_disqualify_threshold} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Auto-Flag Review Threshold (Stars)</label>
            <input type="number" defaultValue={config.auto_flag_review_threshold} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Max Dispatch Radius (Miles)</label>
            <input type="number" defaultValue={config.max_dispatch_radius_miles} style={inputStyle} />
          </div>
        </div>
        <button className="action-btn" style={{ marginTop: '1.5rem', background: 'var(--admin-accent)', color: 'white', borderColor: 'var(--admin-accent)' }}>💾 Save Configuration</button>
      </CardBox>

      {/* Audit Log */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>📝 Audit Log</h3>
      <CardBox style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['ID', 'Admin User', 'Action', 'Timestamp'].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {(data.audit_log || []).map(a => (
              <tr key={a.id} style={trStyle}>
                <td style={tdStyle}><span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.8rem' }}>{a.id}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{a.admin}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.85rem' }}>{a.action}</span></td>
                <td style={tdStyle}><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.timestamp}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBox>
    </>
  );
}


/* ── Shared Inline Styles ── */
const thStyle = { textAlign: 'left', padding: '0.85rem 0.75rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', borderBottom: '1px solid var(--admin-border)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem', whiteSpace: 'nowrap' };
const trStyle = { transition: 'background 0.15s' };
const actionBtnStyle = { padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: 'var(--admin-accent)', transition: 'all 0.15s' };
const drawerOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' };
const drawerPanel = { width: '100%', maxWidth: '480px', background: '#0f172a', borderLeft: '1px solid var(--admin-border)', padding: '2rem', overflowY: 'auto', height: '100%' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--admin-border)', borderRadius: '0.75rem', color: 'white', fontSize: '0.85rem', fontWeight: 600 };


export default PhlebotomyManagement;
