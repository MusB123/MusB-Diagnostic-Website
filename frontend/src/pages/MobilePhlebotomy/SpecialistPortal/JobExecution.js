import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, MapPin, Clock, FileText, Shield,
  CheckCircle, Navigation, Package, ClipboardList
} from 'lucide-react';
import './SpecialistPortal.css';

const STATUS_STEPS = [
  { id: 'enroute', label: 'En Route', icon: <Navigation size={14} /> },
  { id: 'arrived', label: 'Arrived', icon: <MapPin size={14} /> },
  { id: 'collected', label: 'Collected', icon: <Package size={14} /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> }
];

const MOCK_JOB = {
  patientName: 'Sarah J.',
  appointmentTime: '10:30 AM — 11:00 AM',
  address: '450 Park Avenue, Suite 12B, New York, NY 10022',
  doctorOrder: 'CBC, CMP, Lipid Panel — Fasting Required',
  insurance: 'Blue Cross Blue Shield — Member ID: XYZ-123456',
  phone: '+1 (555) 012-3456'
};

const JobExecution = () => {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState('enroute');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  const getStatusIndex = (s) => STATUS_STEPS.findIndex(st => st.id === s);

  const advanceStatus = (statusId) => {
    const clickIndex = getStatusIndex(statusId);
    const currentIndex = getStatusIndex(currentStatus);
    if (clickIndex <= currentIndex + 1) {
      setCurrentStatus(statusId);
      if (statusId === 'completed') {
        setTimeout(() => setCompleted(true), 800);
      }
    }
  };

  if (completed) {
    return (
      <div className="sp-wrapper">
        <div className="sp-mesh-bg">
          <div className="sp-mesh-blob b1" />
          <div className="sp-mesh-blob b2" />
        </div>
        <div className="sp-content">
          <div className="sp-job-exec-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: 420 }}>
              <CheckCircle size={72} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Collection Complete</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
                Specimen secured and chain-of-custody documented. Great work!
              </p>
              <button className="sp-btn-primary" onClick={() => navigate('/portal/specialist/dashboard')} style={{ maxWidth: 300, margin: '0 auto' }}>
                Return to Dashboard
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-wrapper">
      <div className="sp-mesh-bg">
        <div className="sp-mesh-blob b1" />
        <div className="sp-mesh-blob b2" />
      </div>
      <div className="sp-content">
        <div className="sp-job-exec-page">
          <button className="sp-job-exec-back" onClick={() => navigate('/portal/specialist/dashboard')}>
            <ArrowLeft size={18} /> Back to Queue
          </button>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Active Collection</h1>
          <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '2rem' }}>{MOCK_JOB.patientName} — {MOCK_JOB.appointmentTime}</p>

          {/* Status Steps */}
          <div className="sp-status-steps">
            {STATUS_STEPS.map((s, i) => {
              const ci = getStatusIndex(currentStatus);
              const si = i;
              let cls = '';
              if (si < ci) cls = 'done';
              else if (si === ci) cls = 'active';
              return (
                <button
                  key={s.id}
                  className={`sp-status-step ${cls}`}
                  onClick={() => advanceStatus(s.id)}
                >
                  {s.icon} {s.label}
                </button>
              );
            })}
          </div>

          {/* Patient Info */}
          <div className="sp-card">
            <div className="sp-card-title"><ClipboardList size={16} color="#818cf8" /> Patient Details</div>

            <div className="sp-job-meta">
              <div className="sp-job-meta-row">
                <span>Patient</span>
                <span>{MOCK_JOB.patientName}</span>
              </div>
              <div className="sp-job-meta-row">
                <span>Time</span>
                <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{MOCK_JOB.appointmentTime}</span>
              </div>
              <div className="sp-job-meta-row">
                <span>Address</span>
                <span><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{MOCK_JOB.address}</span>
              </div>
            </div>
          </div>

          {/* Doctor Order */}
          <div className="sp-card">
            <div className="sp-card-title"><FileText size={16} color="#818cf8" /> Doctor&apos;s Order</div>
            <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.06)', borderRadius: 14, border: '1px solid rgba(99,102,241,0.15)', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{MOCK_JOB.doctorOrder}</p>
            </div>
          </div>

          {/* Insurance */}
          <div className="sp-card">
            <div className="sp-card-title"><Shield size={16} color="#34d399" /> Insurance</div>
            <p style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}>{MOCK_JOB.insurance}</p>
          </div>

          {/* Call Button */}
          <a href={`tel:${MOCK_JOB.phone}`} className="sp-call-btn" style={{ textDecoration: 'none', marginBottom: '1.5rem', display: 'flex' }}>
            <Phone size={18} /> Call Patient — {MOCK_JOB.phone}
          </a>

          {/* Specimen Notes */}
          <div className="sp-card">
            <div className="sp-card-title"><ClipboardList size={16} color="#818cf8" /> Specimen Notes</div>
            <div className="sp-form-group">
              <textarea
                rows={4}
                placeholder="Enter specimen handling notes, vein used, collection time, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Advance Button */}
          {currentStatus !== 'completed' && (
            <button
              className="sp-btn-primary"
              onClick={() => {
                const ci = getStatusIndex(currentStatus);
                if (ci < STATUS_STEPS.length - 1) advanceStatus(STATUS_STEPS[ci + 1].id);
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Mark as {STATUS_STEPS[Math.min(getStatusIndex(currentStatus) + 1, STATUS_STEPS.length - 1)].label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobExecution;
