import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Facebook, Twitter, Instagram, Linkedin, 
  ShieldCheck, Award, Microscope, Activity,
  Server, Globe, Database
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const statusItems = [
    { icon: Server, label: 'LIS Mainframe', color: '#10b981' },
    { icon: ShieldCheck, label: 'HIPAA Shield', color: '#10b981' },
    { icon: Globe, label: 'API Edge', color: '#10b981' },
    { icon: Database, label: 'MongoCore', color: '#10b981' }
  ];

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <motion.div 
            className="footer-brand"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
          >
            <Link to="/" className="footer-logo">
              <img src="/images/MusB_Diagnostic_Logo.webp" alt="MusB Diagnostics" />
              <div className="logo-glow"></div>
            </Link>
            <p className="brand-description">
              Pioneering next-generation diagnostics with research-grade accuracy and nationwide availability. Affordable, HIPAA-compliant laboratory solutions for the modern world.
            </p>
            <div className="social-links">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                <motion.a 
                  key={idx} 
                  href="#" 
                  className="social-icon"
                  whileHover={{ y: -5, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="footer-links"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
          >
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/test-catalog">Test Catalog</Link></li>
              <li><Link to="/book">Book Appointment</Link></li>
              <li><Link to="/offers">Health Offers</Link></li>
              <li><Link to="/mobile-phlebotomy">Mobile Phlebotomy</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
            </ul>
          </motion.div>

          {/* Legal & Compliance */}
          <motion.div 
            className="footer-links"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
          >
            <h4>Legal & Safety</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/hipaa">HIPAA Compliance</Link></li>
              <li><Link to="/refunds">Refund Policy</Link></li>
              <li><Link to="/certifications">Certifications</Link></li>
            </ul>
          </motion.div>

          {/* Management & Portals */}
          <motion.div 
            className="footer-links admin-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
          >
            <h4>Network Portals</h4>
            <ul>
              <li><Link to="/portal/employer">Employer Portal</Link></li>
              <li><Link to="/portal/physician">Physician Portal</Link></li>
              <li><Link to="/superadmin/login" className="admin-link">
                <div className="admin-indicator pulse"></div>
                Super Admin Console
              </Link></li>
              <li><Link to="/partnerships">Partner with Us</Link></li>
            </ul>
            
            {/* Live Operational Status */}
            <div className="live-status-container">
               <div className="live-status-header">
                  <Activity size={12} className="pulse-text" /> 
                  <span>LIVE Operational Status</span>
               </div>
               <div className="status-grid">
                  {statusItems.map((item, i) => (
                    <div key={i} className="status-item">
                       <item.icon size={14} style={{ color: item.color }} />
                       <span className="dot" style={{ backgroundColor: item.color }}></span>
                       <span className="label">{item.label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="bottom-content">
            <p>&copy; {currentYear} MusB Diagnostics. All Rights Reserved.</p>
            <div className="compliance-badges">
              <span><ShieldCheck size={14} /> CLIA #123456789</span>
              <span><Award size={14} /> COLA Accredited</span>
              <span><Microscope size={14} /> CAP Proficiency</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
