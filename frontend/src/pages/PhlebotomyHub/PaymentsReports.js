import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, FileText, BarChart3, 
  ArrowDownToLine, Calendar, DollarSign
} from 'lucide-react';
import api from '../../api/api';
import './HubPortal.css';

const PaymentsReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/api/phleb/hubs/reports/');
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div style={{ color: '#818cf8', fontWeight: 800 }}>UPLOADING FINANCIAL DATA...</div>;

  return (
    <div className="hub-reports">
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 className="hub-heading" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>Business Intelligence</h2>
          <p className="hub-subheading" style={{ color: '#94a3b8', fontWeight: 700, marginTop: '8px' }}>Revenue Distribution & Operational Audit</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="hub-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800 }}>
            <Calendar size={18} style={{ display: 'inline', marginRight: '8px' }} /> DATE RANGE
          </button>
          <button className="hub-btn" style={{ background: '#6366f1', color: '#fff', fontWeight: 900 }}>
            <Download size={18} style={{ display: 'inline', marginRight: '8px' }} /> EXPORT AUDIT
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="stat-card-custom" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '24px', padding: '1.5rem' }}>
          <div style={{ color: '#10b981', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Commission</div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>$4,626</div>
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>READY FOR WITHDRAWAL</div>
        </div>
        <div className="stat-card-custom" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div style={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fleet Payouts (MTD)</div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>$10,794</div>
          <div style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: 800 }}>8 OPERATIVES PAID</div>
        </div>
        <div className="stat-card-custom" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div style={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Revenue</div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>$15,420</div>
          <div style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 800 }}>TOTAL HUB VOLUME</div>
        </div>
      </div>

      <div className="hub-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="hub-glass-panel">
          <h3 className="hub-heading" style={{ fontSize: '1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="#6366f1" /> REVENUE FLOW (7 DAYS)
          </h3>
          <div style={{ height: '300px', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', flexGrow: 1, paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {[60, 85, 45, 95, 70, 80, 100].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  style={{ width: '40px', background: 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.1) 100%)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px', color: '#475569', fontSize: '0.8rem', fontWeight: 800 }}>
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </div>
        </div>

        <div className="hub-glass-panel">
          <h3 className="hub-heading" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#6366f1" /> COMPLIANCE REPORTS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map((report, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px' }}><FileText size={20} /></div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{report.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>{report.date} • {report.size}</div>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' }}>
                  <ArrowDownToLine size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsReports;
