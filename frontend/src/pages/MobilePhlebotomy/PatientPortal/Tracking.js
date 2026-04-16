import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Phone, AlertTriangle, X, CalendarDays, ArrowLeft
} from 'lucide-react';
import './PatientPortal.css';

const Tracking = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [eta, setEta] = useState(12);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // Simulated ETA countdown
  useEffect(() => {
    if (eta <= 0 || cancelled) return;
    const timer = setInterval(() => {
      setEta((prev) => (prev > 0 ? prev - 1 : 0));
    }, 30000); // decrease every 30s for demo
    return () => clearInterval(timer);
  }, [eta, cancelled]);

  // Leaflet map initialization
  useEffect(() => {
    const loadMap = () => {
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.body.appendChild(script);

        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(style);

        script.onload = () => initMap();
      } else {
        initMap();
      }
    };

    const initMap = (retries = 5) => {
      const container = mapContainerRef.current;
      if (!container && retries > 0) {
        setTimeout(() => initMap(retries - 1), 300);
        return;
      }
      if (!container || !window.L) return;
      if (mapInstanceRef.current) return;

      const patientLat = 40.7580;
      const patientLng = -73.9855;
      const phlebLat = 40.7485;
      const phlebLng = -73.9860;

      const map = window.L.map(container, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true
      }).setView([patientLat, patientLng], 14);

      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

      // Patient marker
      const patientIcon = window.L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 0 20px #6366f1"></div>',
        iconSize: [16, 16]
      });
      window.L.marker([patientLat, patientLng], { icon: patientIcon }).addTo(map)
        .bindPopup('<b style="color:#6366f1">Your Location</b>');

      // Phlebotomist marker
      const phlebIcon = window.L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 0 20px #10b981;animation:ppPulse 2s infinite"></div>',
        iconSize: [18, 18]
      });
      const phlebMarker = window.L.marker([phlebLat, phlebLng], { icon: phlebIcon }).addTo(map)
        .bindPopup('<b style="color:#10b981">Jessica R. • En Route</b>');

      // Simulate movement
      let currentLat = phlebLat;
      const movementInterval = setInterval(() => {
        currentLat += 0.0003;
        if (currentLat >= patientLat) {
          clearInterval(movementInterval);
          return;
        }
        phlebMarker.setLatLng([currentLat, phlebLng]);
      }, 3000);

      // Range circle
      window.L.circle([patientLat, patientLng], {
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.06,
        radius: 500,
        weight: 1
      }).addTo(map);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleCancel = () => {
    setCancelled(true);
    setShowCancelModal(false);
  };

  if (cancelled) {
    return (
      <div className="pp-wrapper">
        <div className="pp-mesh-bg">
          <div className="pp-mesh-blob blob-1" />
          <div className="pp-mesh-blob blob-2" />
        </div>
        <div className="pp-content">
          <div className="pp-wizard-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ textAlign: 'center', maxWidth: 500 }}
            >
              <X size={80} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>
                Appointment Cancelled
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Your appointment has been cancelled. A $25 cancellation fee may apply for late cancellations.
              </p>
              <p style={{ color: '#fcd34d', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Rebook within 7 days to avoid forfeiture of your booking credit.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="pp-btn-primary" onClick={() => navigate('/portal/patient/book')}>
                  <CalendarDays size={18} /> Rebook Now
                </button>
                <button className="pp-btn-secondary" onClick={() => navigate('/portal/patient/dashboard')}>
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-wrapper">
      <div className="pp-content">
        <div className="pp-tracking-page">
          {/* Map */}
          <div className="pp-tracking-map">
            <div ref={mapContainerRef} className="pp-tracking-map-container" />

            {/* HUD Badge */}
            <div className="pp-tracking-hud">
              <div className="pp-tracking-hud-badge">
                <div className="pp-hud-dot" />
                <span>Live Tracking Active</span>
              </div>
            </div>

            {/* Vignette */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)', zIndex: 1000
            }} />
          </div>

          {/* Bottom Panel */}
          <div className="pp-tracking-panel">
            <button
              className="pp-wizard-back"
              onClick={() => navigate('/portal/patient/dashboard')}
              style={{ marginBottom: '1.5rem' }}
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <div className="pp-tracking-eta">
              <p className="pp-tracking-eta-label">Estimated Arrival</p>
              <h2>{eta > 0 ? `${eta} min` : 'Arriving Now'}</h2>
            </div>

            {/* Phlebotomist Card */}
            <div className="pp-tracking-phleb">
              <div className="pp-tracking-phleb-avatar">JR</div>
              <div className="pp-tracking-phleb-info">
                <h3>Jessica Rivera</h3>
                <p>Certified Phlebotomist • 8+ years</p>
              </div>
              <div className="pp-tracking-phleb-rating">
                <Star size={14} /> 4.9
              </div>
            </div>

            {/* Actions */}
            <div className="pp-tracking-actions">
              <button className="pp-btn-secondary" style={{ flex: 1 }}>
                <Phone size={18} /> Contact
              </button>
              <button
                className="pp-btn-danger"
                style={{ flex: 1 }}
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Appointment
              </button>
            </div>
          </div>

          {/* Cancel Confirmation Modal */}
          <AnimatePresence>
            {showCancelModal && (
              <motion.div
                className="pp-cancel-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}
              >
                <motion.div
                  className="pp-cancel-modal"
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                >
                  <h2>Cancel Appointment?</h2>
                  <p>Are you sure you want to cancel this appointment?</p>

                  <div className="pp-cancel-warning">
                    <AlertTriangle size={20} color="#fca5a5" style={{ flexShrink: 0 }} />
                    <p>
                      Cancellations within <strong>4 hours</strong> of the scheduled time will incur a <strong>$25 base charge</strong>.
                      You may rebook within 7 days to retain your booking credit.
                    </p>
                  </div>

                  <div className="pp-cancel-modal-actions">
                    <button className="pp-btn-secondary" onClick={() => setShowCancelModal(false)}>
                      Keep Appointment
                    </button>
                    <button className="pp-btn-danger" onClick={handleCancel}>
                      Confirm Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Tracking;
