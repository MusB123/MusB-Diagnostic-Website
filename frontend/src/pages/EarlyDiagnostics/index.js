import React, { useState, useEffect } from 'react';
import { 
  Search, Activity, 
  FileText, Upload, Download, CheckCircle, 
  ArrowRight, ClipboardList, Database, ShieldCheck,
  ChevronRight, RefreshCcw, LogIn
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { researchAPI } from '../../services/api';
import './EarlyDiagnostics.css';

const EarlyDiagnostics = () => {
  const [submissionStatus, setSubmissionStatus] = useState({ loading: false, success: false });
  const [trackerData, setTrackerData] = useState([]);
  const [loadingTracker, setLoadingTracker] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', summary: '' });

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const fetchTrackerData = async () => {
    setLoadingTracker(true);
    const res = await researchAPI.getValidationTracker();
    if (res.ok) {
      setTrackerData(res.data);
    }
    setLoadingTracker(false);
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ loading: true, success: false });
    
    const res = await researchAPI.submitValidation(formData);
    if (res.ok) {
      setSubmissionStatus({ loading: false, success: true });
      setFormData({ name: '', email: '', summary: '' });
      // Refresh tracker to show new submission (optional, depends if it should show up immediately)
      fetchTrackerData();
    } else {
      setSubmissionStatus({ loading: false, success: false, error: 'Submission failed. Please try again.' });
    }
  };

  const steps = [
    { title: 'Intake', icon: <FileText size={40} />, desc: 'Initial technology disclosure and verification of scientific feasibility.' },
    { title: 'Feasibility', icon: <Search size={40} />, desc: 'Market alignment and resource assessment for clinical development.' },
    { title: 'Analytical Validation', icon: <Activity size={40} />, desc: 'Rigorous testing of assay precision, sensitivity, and reproducibility.' },
    { title: 'Pilot Clinical Testing', icon: <ClipboardList size={40} />, desc: 'Small-scale longitudinal studies to validate clinical utility.' }
  ];

  return (
    <div className="diagnostic-validation-page fade-in">
      {/* Hero Section */}
      <section className="diag-hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <motion.div 
          className="diag-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-badge-research" style={{ marginBottom: '20px' }}>Diagnostic Validation</div>
          <h1 className="diag-hero-title">
            Validating Tomorrow's Diagnostics
          </h1>
          <p className="diag-hero-subtitle text-center mb-5">
            Bridging the gap between scientific discovery and clinical application through rigorous, phase-gated validation pathways.
          </p>
          <div className="hero-actions mt-4">
            <Link to="/portal/diagnostic/login" className="btn btn-primary btn-lg">
              <LogIn size={20} /> Diagnostic Login
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Pathway Diagram Section */}
      <section className="pathway-section">
        <div className="pathway-container">
          <div className="text-center mb-5">
            <h2 className="section-title">Validation Pathway</h2>
            <p className="section-subtitle">Our structured approach ensures accuracy and clinical readiness at every stage.</p>
          </div>

          <div className="pathway-flow">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="pathway-step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="step-icon-wrapper">
                  {step.icon}
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-connector desktop-only">
                    <ChevronRight size={24} className="text-muted" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NDA & Submission Section */}
      <section className="submission-section bg-light-alt">
        <div className="section-container">
          <div className="submission-grid">
            <motion.div 
              className="info-card glass"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-4">Secure Technology Submission</h2>
              <p className="mb-4">
                We take intellectual property seriously. Before sharing any proprietary technology details, we recommend establishing a mutual Non-Disclosure Agreement (NDA).
              </p>
              <div className="nda-download">
                <ShieldCheck size={32} className="text-primary" />
                <div>
                  <h4 className="mb-1">Mutual NDA Template</h4>
                  <button className="btn-link-white" onClick={() => window.open('/assets/nda-template.pdf')} style={{ color: 'var(--primary)', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>
                    Download PDF <Download size={14} />
                  </button>
                </div>
              </div>
              <ul className="feature-list mt-5">
                <li><CheckCircle size={18} className="text-secondary" /> <span>End-to-End Encryption</span></li>
                <li><CheckCircle size={18} className="text-secondary" /> <span>IP Protection Protocols</span></li>
                <li><CheckCircle size={18} className="text-secondary" /> <span>Expert Review Panel</span></li>
              </ul>
            </motion.div>

            <motion.div 
              className="submission-card glass"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3>Submit Technology Brief</h3>
              <p className="text-sm mb-4">Initial assessment phase</p>
              <form onSubmit={handleSubmission} className="quote-form">
                <input 
                  type="text" 
                  placeholder="Technology Name / Assay Type" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  type="email" 
                  placeholder="Lead Scientist Email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <textarea 
                  placeholder="Briefly describe the technology and current validation state..." 
                  rows="4" 
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                ></textarea>
                <div className="file-upload-zone" style={{ border: '1px dashed var(--border-color)', padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
                  <Upload className="mx-auto mb-2 text-muted" />
                  <p className="text-sm">Upload Pitch Deck (Mockup)</p>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={submissionStatus.loading}>
                  {submissionStatus.loading ? 'Processing...' : 'Submit for Feasibility Review'}
                </button>
                {submissionStatus.success && (
                  <p className="status-msg success mt-3">Brief submitted successfully! Our team will contact you soon.</p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Project Tracker Portal Section */}
      <section className="portal-section">
        <div className="section-container">
          <div className="text-center mb-5">
            <h2 className="section-title">Validation Tracker Portal</h2>
            <p className="section-subtitle">Real-time oversight for our active research and diagnostic partners.</p>
          </div>

          <motion.div 
            className="portal-mockup"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="portal-header">
              <div className="flex items-center gap-2">
                <Database size={20} />
                <span className="font-bold">Partner Validation Portal</span>
              </div>
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span>Last Updated: Live Data</span>
                <button onClick={fetchTrackerData} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <RefreshCcw size={14} className={loadingTracker ? 'animate-spin' : ''} /> {loadingTracker ? 'Updating...' : 'Refresh Data'}
                </button>
              </div>
            </div>
            <div className="portal-body">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-bold mb-1">Active Validations</h4>
                  <p className="text-sm text-muted">Tracking progress of technology through validation phases.</p>
                </div>
                <Link to="/portal/research/login" className="btn btn-sm btn-outline">Full Dashboard Access</Link>
              </div>

              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="tracker-table">
                  <thead>
                    <tr>
                      <th>Project ID</th>
                      <th>Technology Name</th>
                      <th>Current Phase</th>
                      <th>Path Progress</th>
                      <th>Expected Next Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackerData.map((project, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-sm">{project.project_id || project.id}</td>
                        <td className="font-bold">{project.name}</td>
                        <td>
                          <span className={`status-badge ${
                            project.status?.includes('Validation') ? 'status-active' : 
                            project.status?.includes('Feasibility') ? 'status-pending' : 'status-completed'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden" style={{ minWidth: '100px' }}>
                            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-bold mt-1 inline-block">{project.progress}%</span>
                        </td>
                        <td>
                          <span className="text-sm flex items-center gap-1">
                            {project.date || project.last_updated?.split('T')[0] || 'TBD'} <ArrowRight size={14} className="text-muted" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EarlyDiagnostics;
