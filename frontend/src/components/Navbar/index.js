import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Calendar, Tag, Heart, Briefcase, Building2, FlaskConical, ChevronDown, LayoutGrid } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  useCart();

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isParentActive = (paths) => paths.some(path => location.pathname === path) ? 'active' : '';
  
  // Hide global navbar on portal (dashboard) routes
  if (location.pathname.startsWith('/portal')) {
    return null;
  }

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/images/MusB_Diagnostic_Logo.webp" alt="MusB Diagnostics Logo" className="logo-img" />
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/')}`}><Stethoscope className="nav-icon"/> Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/test-catalog" className={`nav-link ${isActive('/test-catalog')}`}><LayoutGrid className="nav-icon"/> Catalog</Link>
          </li>
          <li className="nav-item">
            <Link to="/self-pay-lab-tests" className={`nav-link ${isActive('/self-pay-lab-tests')}`}><Heart className="nav-icon"/> Self-Pay Patients</Link>
          </li>
          <li className="nav-item">
            <Link to="/employer-health-program" className={`nav-link ${isActive('/employer-health-program')}`}><Briefcase className="nav-icon"/> Employers & HR</Link>
          </li>
          <li className="nav-item dropdown">
            <div className={`nav-link dropdown-toggle ${isParentActive(['/assisted-living-testing', '/mobile-phlebotomy', '/community-programs', '/physicians'])}`}>
              <Building2 className="nav-icon"/> Facilities <ChevronDown className="dropdown-arrow" size={14}/>
            </div>
            <ul className="dropdown-menu">
              <li>
                <Link to="/assisted-living-testing" className={`dropdown-item ${isActive('/assisted-living-testing')}`}>Assisted Living</Link>
              </li>
              <li>
                <Link to="/mobile-phlebotomy" className={`dropdown-item ${isActive('/mobile-phlebotomy')}`}>Mobile Phlebotomy</Link>
              </li>
              <li>
                <Link to="/community-programs" className={`dropdown-item ${isActive('/community-programs')}`}>Non Profits</Link>
              </li>
              <li>
                <Link to="/physicians" className={`dropdown-item ${isActive('/physicians')}`}>Physician</Link>
              </li>
            </ul>
          </li>
          <li className="nav-item dropdown">
            <div className={`nav-link dropdown-toggle ${isParentActive(['/research-central-lab', '/early-diagnostics'])}`}>
              <FlaskConical className="nav-icon"/> Research <ChevronDown className="dropdown-arrow" size={14}/>
            </div>
            <ul className="dropdown-menu">
              <li>
                <Link to="/research-central-lab" className={`dropdown-item ${isActive('/research-central-lab')}`}>Research Central Lab</Link>
              </li>
              <li>
                <Link to="/early-diagnostics" className={`dropdown-item ${isActive('/early-diagnostics')}`}>Diagnostic Validation</Link>
              </li>
            </ul>
          </li>
          <li className="nav-item">
            <Link to="/offers" className={`nav-link ${isActive('/offers')}`}><Tag className="nav-icon"/> Offers</Link>
          </li>
        </ul>
        <div className="nav-actions">
          <Link to="/book" className="btn btn-primary"><Calendar className="nav-icon"/> Book Now</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;