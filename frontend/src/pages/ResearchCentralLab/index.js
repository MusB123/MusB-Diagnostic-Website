import React, { useEffect, useState } from 'react';

import { 
  Dna, Database, GraduationCap, FileText, Mail, 
  CheckCircle, PackageSearch, Users, TestTube, Loader2,
  Microscope, Globe, Shield, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { researchAPI, homeAPI } from '../../services/api';
import ResearchLoginModal from '../ResearchPortal/Login';
import './ResearchCentralLab.css';

const ResearchCentralLab = () => {
  const [stats, setStats] = useState({ reliability: '99.99%', capacity: 'Millions+' });
  const [quoteForm, setQuoteForm] = useState({ pi_name: '', email: '', overview: '' });
  const [quoteStatus, setQuoteStatus] = useState({ loading: false, message: '', error: false });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ loading: false, message: '', error: false });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await researchAPI.getStats();
      if (res.ok) setStats(res.data);
    };
    fetchStats();
  }, []);

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteStatus({ loading: true, message: '', error: false });
    const res = await researchAPI.submitQuote(quoteForm);
    if (res.ok) {
      setQuoteStatus({ loading: false, message: 'Proposal request sent successfully!', error: false });
      setQuoteForm({ pi_name: '', email: '', overview: '' });
    } else {
      setQuoteStatus({ loading: false, message: 'Failed to send request. Please try again.', error: true });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus({ loading: true, message: '', error: false });
    const res = await homeAPI.subscribeNewsletter(newsletterEmail);
    if (res.ok) {
      setNewsletterStatus({ loading: false, message: res.data.message, error: false });
      setNewsletterEmail('');
    } else {
      setNewsletterStatus({ loading: false, message: 'Subscription failed.', error: true });
    }
  };

  return (
    <div className="research-page fade-in">
      {/* Hero Section */}
      <section className="research-hero">
        <motion.div 
          className="research-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-badge-research">Research & Clinical Trials</div>
          <h1 className="research-hero-title">
            Comprehensive Central Lab Services
          </h1>
          <p className="research-hero-subtitle">
            Empowering your scientific progress through rigorous diagnostics, end-to-end sample management, and dedicated academic partnerships.
          </p>
          <div className="hero-actions">
            <a href="#quote" className="btn btn-secondary btn-lg">Request Quote</a>
            <button onClick={() => setShowLoginModal(true)} className="btn btn-outline-white btn-lg">Portal Login</button>
          </div>
        </motion.div>
      </section>

      {/* Study Support Services */}
      <section className="support-section">
        <div className="section-container">
          <motion.div 
            className="text-center mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Study Support Services</h2>
            <p className="section-subtitle max-w-3xl mx-auto">
              End-to-end solutions tailored for clinical trials, longitudinal studies, and advanced diagnostic validations.
            </p>
          </motion.div>
          
          <div className="support-grid">
            {[
              { icon: <TestTube size={32}/>, title: 'Sample Collection', text: 'Standardized Phlebotomy, mobile teams, and customized kits to ensure high-fidelity sample acquisition worldwide.' },
              { icon: <Dna size={32}/>, title: 'Advanced Processing', text: 'PBMC isolation, aliquoting, DNA/RNA extraction, and specialized biomarker handling per complex protocol.' },
              { icon: <Database size={32}/>, title: 'Secure Storage', text: 'GLP-compliant ambient, -20°C, -80°C, and cryopreservation capabilities ensuring absolute sample integrity.' },
              { icon: <PackageSearch size={32}/>, title: 'Global Shipping', text: 'Cold-chain logistics coordination, ambient transport, and strict adherence to IATA regulations.' }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="support-card glass"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="support-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Biorepository & Sample Tracking */}
      <section className="biorepository-section bg-light-alt">
        <div className="section-container">
          <div className="biorepository-content">
            <motion.div 
              className="biorepository-text"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-title">Biorepository & Sample Tracking</h2>
              <p className="mb-4">
                Our state-of-the-art biorepository system offers complete transparency and absolute traceability for every specimen. From the moment of collection to deep-freeze storage and eventual assay, your study materials are meticulously monitored.
              </p>
              <ul className="feature-list">
                <li><CheckCircle className="text-primary"/> <div><strong>24/7 Monitoring:</strong> Real-time temperature logs and automated alert systems for ultra-low freezers.</div></li>
                <li><CheckCircle className="text-primary"/> <div><strong>LIMS Integration:</strong> Full digital chain-of-custody tracking with encrypted barcoding.</div></li>
                <li><CheckCircle className="text-primary"/> <div><strong>Redundancy:</strong> Triple-redundant power and liquid nitrogen backup for critical specimens.</div></li>
                <li><CheckCircle className="text-primary"/> <div><strong>Retrieval Agility:</strong> Under 2-hour retrieval and dispatch for pre-authorized requests.</div></li>
              </ul>
            </motion.div>
            <motion.div 
              className="biorepository-visual glass"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="visual-stat">
                <h3>{stats.reliability || '99.99%'}</h3>
                <p>System Uptime</p>
              </div>
              <div className="visual-stat">
                <h3>{stats.capacity || '10M+'}</h3>
                <p>Sample Capacity</p>
              </div>
              <div className="visual-stat-icons">
                <Shield className="text-primary" size={24} />
                <Zap className="text-secondary" size={24} />
                <Globe className="text-primary-light" size={24} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Academic Collaboration */}
      <section className="academic-section">
        <div className="section-container">
          <motion.div 
            className="academic-content text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GraduationCap size={48} className="academic-icon mx-auto mb-4 text-primary" />
            <h2 className="section-title">Academic Collaboration Focus</h2>
            <p className="section-subtitle max-w-3xl mx-auto mb-5">
              We actively partner with leading universities, research institutions, and principal investigators to push the boundaries of medical science. Our infrastructure is designed to scale with your grant requirements.
            </p>
            <div className="academic-pillars">
              <motion.div 
                className="pillar glass"
                whileHover={{ y: -10 }}
              >
                <Users size={28} className="mb-3 text-secondary" />
                <h4>Joint Grant Applications</h4>
                <p>Providing the laboratory infrastructure and core facility data required to strengthen NIH, NSF, and foundation proposals.</p>
              </motion.div>
              <motion.div 
                className="pillar glass"
                whileHover={{ y: -10 }}
              >
                <FileText size={28} className="mb-3 text-secondary" />
                <h4>Publication Support</h4>
                <p>Rigorous documentation, transparent methodology, and publication-ready data sets to support your peer-reviewed submissions.</p>
              </motion.div>
              <motion.div 
                className="pillar glass"
                whileHover={{ y: -10 }}
              >
                <Microscope size={28} className="mb-3 text-secondary" />
                <h4>Core Facility Access</h4>
                <p>Leverage our high-throughput sequencing and specialized assay development for your pilot studies.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Request Quote & Portal */}
      <section id="quote" className="quote-portal-section bg-light-alt">
        <div className="section-container">
          <div className="quote-portal-grid">
            <motion.div 
              className="quote-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2>Request a Proposal</h2>
              <p>Detail your study protocol, processing requirements, and expected volume to receive a customized laboratory services proposal.</p>
              <form className="quote-form" onSubmit={handleQuoteSubmit}>
                <input 
                  type="text" 
                  placeholder="Principal Investigator / Company" 
                  required 
                  value={quoteForm.pi_name}
                  onChange={(e) => setQuoteForm({...quoteForm, pi_name: e.target.value})}
                  disabled={quoteStatus.loading}
                />
                <input 
                  type="email" 
                  placeholder="Official Institutional Email" 
                  required 
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm({...quoteForm, email: e.target.value})}
                  disabled={quoteStatus.loading}
                />
                <textarea 
                  placeholder="Brief Study Overview & Specific Lab Needs (e.g. storage temperature, specific assays)..." 
                  rows="4" 
                  required
                  value={quoteForm.overview}
                  onChange={(e) => setQuoteForm({...quoteForm, overview: e.target.value})}
                  disabled={quoteStatus.loading}
                ></textarea>
                <button type="submit" className="btn btn-primary w-100" disabled={quoteStatus.loading}>
                  {quoteStatus.loading ? <Loader2 className="animate-spin inline mr-2" size={18}/> : 'Submit Proposal Request'}
                </button>
                {quoteStatus.message && (
                  <p className={`status-msg mt-3 ${quoteStatus.error ? 'error' : 'success'}`}>
                    {quoteStatus.message}
                  </p>
                )}
              </form>
            </motion.div>
            
            <motion.div 
              className="portal-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h2>Sponsor / Investigator Portal</h2>
              <p>Access your real-time LIMS dashboard, track sample manifests, review analytical reports, and download raw data sets.</p>
              <div className="portal-login-box">
                <p className="mb-4">Secure access for authorized research partners.</p>
                <button onClick={() => setShowLoginModal(true)} className="btn btn-outline btn-lg w-100">
                  <Database size={20} className="me-2 d-inline" /> Login to Research Portal
                </button>
                <div className="mt-4 text-sm text-muted">
                  New Study? <a href="#quote" className="text-primary">Inquire about portal onboarding</a>.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="research-newsletter-section">
        <div className="section-container">
          <motion.div 
            className="newsletter-wrapper glass text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Mail size={40} className="mx-auto mb-3 text-primary" />
            <h2>Research Insights Monthly</h2>
            <p className="mb-4 max-w-2xl mx-auto">
              Stay informed on new assay validations, biorepository upgrades, and academic funding opportunities curated for the research community.
            </p>
            <form className="newsletter-form-inline mx-auto" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Institutional email address" 
                required 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus.loading}
              />
              <button type="submit" className="btn btn-secondary" disabled={newsletterStatus.loading}>
                {newsletterStatus.loading ? 'Joining...' : 'Subscribe to Research News'}
              </button>
              {newsletterStatus.message && (
                <p className={`newsletter-msg mt-2 ${newsletterStatus.error ? 'error' : 'success'}`}>
                  {newsletterStatus.message}
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Research Login Modal */}
      <ResearchLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default ResearchCentralLab;
