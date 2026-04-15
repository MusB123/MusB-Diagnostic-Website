import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Droplets, 
  LogOut, MapPin, 
  ShieldCheck, TrendingUp, Truck, AlertCircle,
  Navigation, User, Info, ListChecks, Clock,
  Calendar, Users, Edit3, Save, X, Plus, Minus, Phone,
  ChevronDown, ChevronUp, ClipboardList, Stethoscope, Building2,
  Wallet, Star, ArrowUpRight, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api';
import './Portal.css';

const PhlebotomistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dispatch');
  const [data, setData] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState('indigo'); 
  const [checkedSpecimens, setCheckedSpecimens] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    location: '',
    company: ''
  });
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('phleb_user')) || { name: 'Specialist', company: 'MusB Field Ops' });
  const [isOnline, setIsOnline] = useState(false);
  const [expandedStopIdx, setExpandedStopIdx] = useState(null);
  const [activeAction, setActiveAction] = useState(null); // Tracking current processing button
  const [notification, setNotification] = useState(null); // HUD feedback state
  const [isReviewsOpen, setIsReviewsOpen] = useState(false); // Specialist reviews modal
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // --- Tactical Action Engine ---
  const triggerTacticalAction = (actionId, label, successMsg, duration = 2000) => {
    if (activeAction) return;
    setActiveAction(actionId);
    
    setTimeout(() => {
      setActiveAction(null);
      setNotification({ label, message: successMsg });
      setTimeout(() => setNotification(null), 4000);
    }, duration);
  };

  // --- Handlers ---
  const handleStatusToggle = () => {
    if (!isOnline) {
      if ("geolocation" in navigator) {
        // Explicitly request the native browser permission dialog
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Success: Permission granted and location detected
            setIsOnline(true);
          },
          (error) => {
            console.error("Geolocation Error:", error);
            if (error.code === 1) {
              alert("CRITICAL: Location access is RESTRICTED by your browser. \n\nTo go On Duty:\n1. Click the 'Lock' icon next to the website URL.\n2. Set 'Location' to 'Allow'.\n3. Refresh this page.");
            } else if (error.code === 3) {
              alert("Location Timeout: The system couldn't get a GPS fix in time. Are you inside a shielded building?");
            } else {
              alert(`Location Error: ${error.message}. Please check your GPS settings.`);
            }
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000,
            maximumAge: 0 
          }
        );
      } else {
        alert("Your browser does not support location detection.");
      }
    } else {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/phleb/dashboard/');
        setData(response.data);
        
        // Initialize profile data from response
        if (response.data.specialist) {
           setProfileData({
             name: response.data.specialist.name,
             phone: response.data.specialist.phone || '',
             location: response.data.specialist.zone || '',
             company: response.data.specialist.company
           });
        }
        
        if (response.data.active_case?.status) {
           const s = response.data.active_case.status.toLowerCase();
           setWorkflowStatus(s === 'completed' ? 'completed' : s);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('phleb_token');
          navigate('/mobile-phlebotomy');
        }
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchDashboard();
  }, [navigate]);

  // --- Real-time Heartbeat & Location Sync ---
  useEffect(() => {
    let watchId = null;

    if (isOnline) {
      const sendHeartbeat = async (coords) => {
        try {
          await api.post('/api/phleb/heartbeat/', {
            lat: coords.latitude,
            lng: coords.longitude,
            is_online: true
          });
        } catch (err) {
          console.error('Heartbeat sync failed:', err);
        }
      };

      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            sendHeartbeat(position.coords);
          },
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true }
        );
      }
    } else {
      // Send one final heartbeat to go offline
      const goOffline = async () => {
        try {
          await api.post('/api/phleb/heartbeat/', { is_online: false });
        } catch (err) { }
      };
      goOffline();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline]);

  // Robust Tactical Map Initialization
  useEffect(() => {
    if (activeTab === 'dispatch' && !loading) {
      const loadLeaflet = () => {
        if (!window.L) {
          const script = document.createElement('script');
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          document.body.appendChild(script);
          
          const style = document.createElement('link');
          style.rel = "stylesheet";
          style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(style);

          script.onload = () => initMapWithRetry();
        } else {
          initMapWithRetry();
        }
      };

      const initMapWithRetry = (retries = 5) => {
        const container = document.getElementById('tactical-map');
        if (!container && retries > 0) {
          setTimeout(() => initMapWithRetry(retries - 1), 200);
          return;
        }
        if (!container || !window.L) return;
        if (container._leaflet_id) return;

        // Coordinates logic
        const stop = data?.dispatch?.next_stop;
        const lat = stop?.coordinates?.coordinates?.[1] || 40.7580;
        const lng = stop?.coordinates?.coordinates?.[0] || -73.9855;

        const map = window.L.map('tactical-map', {
          zoomControl: false,
          attributionControl: false,
          fadeAnimation: true,
          scrollWheelZoom: false,
          dragging: true
        }).setView([lat, lng], 13);

        mapRef.current = map;

        // Enable custom scroll-to-pan
        const mapContainer = document.getElementById('tactical-map');
        const handleWheel = (e) => {
          e.preventDefault();
          const speed = 1.2; // Adjust pan sensitivity
          map.panBy([e.deltaX * speed, e.deltaY * speed], { animate: false });
        };
        mapContainer.addEventListener('wheel', handleWheel, { passive: false });

        // Advanced Dark Tactical Tiles
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

        // Specialist / Target Marker
        const icon = window.L.divIcon({
          className: 'tactical-ping-icon',
          html: '<div class="radar-ping"></div>',
          iconSize: [20, 20]
        });

        window.L.marker([lat, lng], { icon }).addTo(map)
          .bindPopup(`<div class="p-2">
            <h5 class="text-[10px] font-black uppercase text-indigo-400 mb-1">Active Target</h5>
            <p class="text-xs font-bold text-white">${stop?.patient || 'Scanning Area...'}</p>
          </div>`, { className: 'tactical-popup' })
          .openPopup();

        // Aesthetic Grid Pulse
        window.L.circle([lat, lng], {
          color: '#6366f1',
          fillColor: '#6366f1',
          fillOpacity: 0.1,
          radius: 1000,
          weight: 1
        }).addTo(map);
      };

      loadLeaflet();
    }
  }, [activeTab, loading, data]);

  const handleWorkflowChange = async (status) => {
    const testId = data?.active_case?.id || data?.active_case?._id;
    if (!testId) return;
    
    setWorkflowStatus(status);

    try {
      await api.post(`/api/phleb/test/${testId}/status/`, { status });
      // Refresh data to get synced state
      const response = await api.get('/api/phleb/dashboard/');
      setData(response.data);
    } catch (err) {
      console.error('Workflow sync failed:', err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/phleb/profile/', profileData);
      const newUser = { ...user, ...profileData };
      setUser(newUser);
      localStorage.setItem('phleb_user', JSON.stringify(newUser));
      setIsProfileModalOpen(false);
      // Refresh dashboard to show updated data
      const response = await api.get('/api/phleb/dashboard/');
      setData(response.data);
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  const toggleSpecimen = (id) => {
    setCheckedSpecimens(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div className="phleb-dash-wrapper flex items-center justify-center">
      <div className="stellar-mesh-container">
        <div className="mesh-blob" style={{ top: '20%', left: '20%', background: '#6366f1' }}></div>
        <div className="mesh-blob" style={{ bottom: '20%', right: '20%', background: '#4f46e5' }}></div>
      </div>
      <div className="text-center relative z-10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mb-6 mx-auto"
        />
        <p className="text-slate-200 font-bold tracking-widest text-xs uppercase">Initializing System...</p>
      </div>
    </div>
  );

  // --- Sub-Renders for Modules ---

  // --- Phase 1: Phlebotomist Dashboard (Home) ---
  const renderDispatch = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-10"
    >
      {/* 1. Today's Appointments List (Primary) */}
      <motion.section 
        whileHover={{ y: -5 }}
        className="phleb-card !p-12"
      >
        <div className="flex justify-between items-center mb-12">
          <h2 className="phleb-card-title !mb-0">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)]"><ListChecks size={20} /></div>
            Today's Appointments List
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">GPS {isOnline ? 'SIGNAL ACTIVE' : 'LOCKED'}</span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data?.dispatch?.today_route?.length} Field Tests Active</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {data?.dispatch?.today_route?.map((stop, idx) => (
            <div 
              key={idx} 
              className="route-item-grid"
              style={{ '--indicator-color': stop.status === 'Completed' ? '#10b981' : '#6366f1' }}
            >
              <div className="route-time-block">
                <div className="route-time">{stop.preferred_time || '09:00 AM'}</div>
                <span className={`status-chip ${stop.status === 'Completed' ? 'completed' : 'pending'}`}>
                  {stop.status}
                </span>
              </div>
              
              <div className="route-info">
                <div className="test-tag">{stop.test_name || "Laboratory Analysis"}</div>
                <h5 className="text-white font-black text-sm mb-1">{stop.full_name || "Assigned Patient"}</h5>
                <div className="address-line">
                  <MapPin size={10} className="text-slate-400" />
                  {stop.address}
                </div>
              </div>

              <div className="route-actions">
                <a href={`tel:${stop.phone}`} className="action-bubble primary">
                  <Phone size={12} /> {stop.phone}
                </a>
                {stop.alt_phone && stop.alt_phone !== 'N/A' && (
                  <a href={`tel:${stop.alt_phone}`} className="action-bubble">
                    <Phone size={12} /> {stop.alt_phone} (Alt)
                  </a>
                )}
              </div>

              <button 
                className="details-toggle"
                onClick={() => setExpandedStopIdx(expandedStopIdx === idx ? null : idx)}
              >
                {expandedStopIdx === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expandedStopIdx === idx ? 'CLOSE DOSSIER' : 'VIEW STOP DETAILS'}
              </button>

              <AnimatePresence>
                {expandedStopIdx === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="route-details-panel"
                  >
                    <div className="dossier-grid">
                      {/* Mission Briefing - New Descriptive View */}
                      <div className="dossier-section briefing-card">
                        <h6><Info size={10} className="inline mr-1" /> Mission Briefing</h6>
                        <div className="briefing-content">
                          <p className="test-desc-long text-slate-300 font-medium">{stop.clinical_data?.test_info?.description}</p>
                          <div className="mt-3 flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                               <Clock size={10} className="text-indigo-400" />
                               <span>Scheduled: <b className="text-white">{stop.clinical_data?.preferred_time}</b></span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                               <Truck size={10} className="text-indigo-400" />
                               <span>Protocol: <b className="text-white">{stop.clinical_data?.visit_type}</b></span>
                             </div>
                             <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                               <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Preparation</p>
                               <p className="text-[10px] text-slate-300 font-medium italic">{stop.clinical_data?.test_info?.preparation}</p>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="dossier-section">
                        <h6><Users size={10} className="inline mr-1" /> Demographics</h6>
                        <p className="dossier-val">{stop.clinical_data?.age}Y / {stop.clinical_data?.gender}</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">ID: {stop.patient_id}</p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          <Navigation size={10} /> LAUNCH NAVIGATION
                        </a>
                      </div>

                      <div className="dossier-section">
                        <h6><ClipboardList size={10} className="inline mr-1" /> Specimens Required</h6>
                        <div className="specimen-list">
                          {stop.clinical_data?.specimens?.map((spec, sidx) => (
                            <span key={sidx} className="specimen-tag">{spec}</span>
                          )) || <span className="text-slate-500 italic text-[10px]">No specimens listed</span>}
                        </div>
                      </div>

                      <div className="dossier-section">
                        <h6><Stethoscope size={10} className="inline mr-1" /> Command Intel</h6>
                        <div className="flex items-center gap-2 mb-2">
                           <Building2 size={10} className="text-indigo-400" />
                           <span className="text-[10px] font-bold text-slate-300">{stop.clinical_data?.facility}</span>
                        </div>
                        <div className="instruction-block">
                          {stop.clinical_data?.instructions}
                        </div>
                        <div className="mt-3 text-[10px] text-slate-500 font-bold uppercase">
                          Ordering Physician: <span className="text-slate-300 ml-1">{stop.clinical_data?.doctor}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="dash-modules-grid">
        {/* 2. Route Map and Optimized Route (Radar) */}
        <motion.section 
          whileHover={{ scale: 1.005 }}
          className="phleb-card map-module full-bleed border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          style={{ height: '520px', position: 'relative' }}
        >
          {/* Map Container - Positioned to fill entire card background (including upper header area) */}
          <div 
            id="tactical-map" 
            className="map-placeholder overflow-hidden absolute inset-0 z-0" 
            style={{ height: '100%', width: '100%', top: 0, left: 0 }}
          >
             {/* Fallback/Loader Layer */}
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#020408] z-[5]">
                <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="text-slate-600 text-[8px] font-black uppercase tracking-[0.8em] animate-pulse">
                   Syncing Grid...
                </div>
             </div>
             
             {/* HUD Vignette Overlay */}
             <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-20"></div>
             <div className="absolute inset-0 pointer-events-none border-black/20 z-10"></div>
          </div>

          {/* Enhanced HUD Header - Overlaid on top of map */}
          <div className="absolute top-8 left-8 z-[1001] flex flex-col gap-1 pointer-events-none">
             <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/5 py-2 px-4 rounded-full">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Live Tactical Radar</h4>
             </div>
             <div className="flex items-center gap-2 pl-4 mt-2">
               <MapPin size={12} className="text-slate-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global Coverage Locked</span>
             </div>
          </div>


          {/* Tactical Zoom Controls - FIXED VANILLA CSS VERSION */}
          <div className="tactical-zoom-overlay">
             <button 
               onClick={() => mapRef.current?.zoomIn()}
               className="zoom-btn-base zoom-btn-in"
             >
               <Plus size={18} strokeWidth={4} style={{ marginRight: '8px' }} /> Zoom In
             </button>
             <button 
               onClick={() => mapRef.current?.zoomOut()}
               className="zoom-btn-base zoom-btn-out"
             >
               <Minus size={18} strokeWidth={4} style={{ marginRight: '8px' }} /> Zoom Out
             </button>
          </div>
        </motion.section>

        {/* 3. Next Stop Details & 4. Status Buttons */}
        <div className="space-y-6">
          <motion.section 
            whileHover={{ y: -5 }}
            className="phleb-card next-stop-card !p-10"
          >
            <div className="flex justify-between items-center mb-10">
               <div className="next-stop-badge">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                  {data?.dispatch?.next_stop ? 'Next Test Active' : 'System Standby'}
               </div>
               <span className="eta-label">{data?.dispatch?.next_stop ? 'ETA: 12 MINS' : 'Scanning...'}</span>
            </div>

            {data?.dispatch?.next_stop ? (
              <>
                <h3 className="text-4xl font-black text-white mb-3 tracking-tight">{data.dispatch.next_stop.time}</h3>
                <div className="flex items-center gap-2 mb-10">
                   <div className="w-10 h-[1px] bg-white/20"></div>
                   <p className="text-sm font-bold text-slate-300">{data.dispatch.next_stop.patient} • {data.dispatch.next_stop.address}</p>
                </div>

                {/* Test Timeline Visualizer */}
                <div className="mission-timeline-container">
                   <div className="timeline-track"></div>
                   <div 
                      className="timeline-progress" 
                      style={{ 
                        width: workflowStatus === 'enroute' ? '15%' : 
                               workflowStatus === 'arrived' ? '55%' : 
                               workflowStatus === 'completed' ? '100%' : '5%' 
                      }}
                   ></div>
                   
                   {[
                     { id: 'enroute', color: '#0ea5e9' },
                     { id: 'arrived', color: '#f59e0b' },
                     { id: 'completed', color: '#6366f1' }
                   ].map((step, idx) => {
                      const stages = ['enroute', 'arrived', 'completed'];
                      const currentIdx = stages.indexOf(workflowStatus);
                      const isCompleted = currentIdx > idx;
                      const isActive = workflowStatus === step.id;
                      
                      return (
                        <div 
                          key={step.id} 
                          className={`timeline-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                          style={{ '--node-color': step.color }}
                        ></div>
                      );
                   })}
                </div>
              </>
            ) : (
              <div className="py-10 text-center">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 animate-pulse">
                    <Navigation size={24} className="text-slate-500" />
                 </div>
                 <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Tests Found</h4>
                 <p className="text-[10px] font-bold text-slate-500 mt-2">Waiting for HQ to dispatch optimized route...</p>
              </div>
            )}
            
            <div className="workflow-actions border-t border-white/5 pt-10">
              <button 
                className={`workflow-btn btn-tactical ${workflowStatus === 'enroute' ? 'active' : ''}`} 
                onClick={() => handleWorkflowChange('enroute')} 
                style={{ '--btn-color': '#0ea5e9', '--btn-color-glow': 'rgba(2, 132, 199, 0.4)' }}
              >
                <Navigation size={18} /> Started
              </button>
              <button 
                className={`workflow-btn btn-tactical ${workflowStatus === 'arrived' ? 'active' : ''}`} 
                onClick={() => handleWorkflowChange('arrived')} 
                style={{ '--btn-color': '#f59e0b', '--btn-color-glow': 'rgba(245, 158, 11, 0.4)' }}
              >
                <Truck size={18} /> Arrived
              </button>
              <button 
                className={`workflow-btn btn-tactical ${workflowStatus === 'completed' ? 'active' : ''}`} 
                onClick={() => handleWorkflowChange('completed')} 
                style={{ '--btn-color': '#6366f1', '--btn-color-glow': 'rgba(99, 102, 241, 0.4)' }}
              >
                <CheckCircle2 size={18} /> Completed
              </button>
              <button 
                className={`workflow-btn btn-tactical ${workflowStatus === 'issue' ? 'active' : ''}`} 
                onClick={() => handleWorkflowChange('issue')} 
                style={{ '--btn-color': '#ef4444', '--btn-color-glow': 'rgba(239, 68, 68, 0.4)' }}
              >
                <AlertCircle size={18} /> Issue
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );

  const renderActiveCase = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="case-file-grid"
    >
      <div className="case-profile-sidebar">
        {/* 1. Patient Profile & 4. Associated Doctor/Facility/Employer */}
        <motion.section 
          whileHover={{ y: -5 }}
          className="phleb-card case-profile-card"
        >
          <div className="patient-avatar-container">
            <div className="avatar-ring"></div>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-[30px] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <User size={40} strokeWidth={2.5} />
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-white tracking-tight">{data?.active_case?.initials} • {data?.active_case?.patient_id}</h3>
          
          <div className="case-profile-stats mt-8">
            <div className="stat-box"><h6>Age</h6><p>{data?.active_case?.age}Y</p></div>
            <div className="stat-box"><h6>Gender</h6><p>{data?.active_case?.gender}</p></div>
          </div>

          <div className="mt-8 space-y-4 border-t border-white/5 pt-6">
            {[
              { label: 'Facility', value: data?.active_case?.associated_facility, icon: Info },
              { label: 'Clinician', value: data?.active_case?.doctor, icon: User },
              { label: 'Employer', value: data?.active_case?.employer || 'Not Specified', icon: ShieldCheck }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <item.icon size={14} className="text-indigo-400" />
                   <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                <span className="text-[11px] font-black text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 6. Reschedule / report issue */}
        <section className="action-stack mt-8">
          <button 
            onClick={() => triggerTacticalAction('resched', 'Satellite Link', 'Reschedule Request Transmitted to HQ', 2000)}
            disabled={activeAction === 'resched'}
            className={`btn-tactical !w-full !p-6 flex items-center justify-center gap-3 ${activeAction === 'resched' ? 'btn-processing' : ''}`}
          >
            {activeAction === 'resched' ? <div className="tactical-spinner"></div> : <Calendar size={18} />}
            {activeAction === 'resched' ? 'Connecting...' : 'Reschedule Test'}
          </button>
          <button 
            onClick={() => triggerTacticalAction('report', 'Uplinking Intel', 'Issue Logged: Field Specialist Contact Initiated', 2500)}
            disabled={activeAction === 'report'}
            className={`btn-danger !w-full !p-6 flex items-center justify-center gap-3 ${activeAction === 'report' ? 'btn-processing' : ''}`}
          >
            {activeAction === 'report' ? <div className="tactical-spinner"></div> : <AlertCircle size={18} />}
            {activeAction === 'report' ? 'Uplinking...' : 'Report Issue'}
          </button>
        </section>
      </div>

      <div className="space-y-14">
        {/* 2. Collection Instructions */}
        <section className="phleb-card">
          <h2 className="phleb-card-title mb-10">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Info size={20} /></div>
            Collection Instructions
          </h2>
          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl border-l-4">
            <p className="text-sm font-bold text-amber-200/80 italic leading-relaxed">
              "{data?.active_case?.instructions}"
            </p>
          </div>
        </section>

        {/* 3. Payment Collection */}
        <section className="phleb-card !p-14 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <h2 className="phleb-card-title mb-12">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Droplets size={20} /></div>
            Payment Collection
          </h2>
          <div className="flex items-center justify-between p-10 bg-black/20 rounded-2xl border border-white/5">
             <div>
                <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] mb-1">Financial Status</p>
                <h4 className="text-lg font-black text-white">{data?.active_case?.payment_status || 'Pending Verification'}</h4>
             </div>
             <button 
              onClick={() => triggerTacticalAction('pay', 'Payment Gateway', 'Transaction ID: TX-882 Verified Successfully', 2000)}
              disabled={activeAction === 'pay'}
              className={`btn-success !px-8 !py-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 ${activeAction === 'pay' ? 'btn-processing' : ''}`}
             >
                {activeAction === 'pay' ? <div className="tactical-spinner"></div> : 'Collect Payment'}
             </button>
          </div>
        </section>

        {/* 5. Notes + Specimen Checklist */}
        <section className="phleb-card !p-14">
          <div className="flex justify-between items-center mb-14">
            <h2 className="phleb-card-title !mb-0">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><ListChecks size={20} /></div>
              Notes + Specimen Checklist
            </h2>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              {checkedSpecimens.length} / {data?.active_case?.specimens?.length} SECURED
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            {data?.active_case?.specimens?.map((spec, idx) => (
              <div key={idx} onClick={() => toggleSpecimen(spec)} className={`checklist-item ${checkedSpecimens.includes(spec) ? 'checked' : ''} p-5`}>
                <div className={`w-6 h-6 rounded-md border-2 ${checkedSpecimens.includes(spec) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'} flex items-center justify-center`}>
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-200">{spec}</span>
              </div>
            ))}
          </div>

          <textarea 
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-xs font-bold text-slate-200 focus:border-indigo-500 transition-all resize-none"
            placeholder="Final clinic notes..."
            defaultValue={data?.active_case?.notes}
          />
          
          <button 
            disabled={checkedSpecimens.length < (data?.active_case?.specimens?.length || 0) || activeAction === 'seal'}
            onClick={() => triggerTacticalAction('seal', 'Submitting Lab Results', 'Mission Complete: Results Sealed & Transmitted', 2500)}
            className={`btn-primary !w-full !mt-10 !p-8 shadow-[0_0_40px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 ${activeAction === 'seal' ? 'btn-processing' : ''} ${checkedSpecimens.length < (data?.active_case?.specimens?.length || 0) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            {activeAction === 'seal' ? <div className="tactical-spinner"></div> : <ShieldCheck size={20} />}
            {activeAction === 'seal' ? 'Sealing...' : checkedSpecimens.length < (data?.active_case?.specimens?.length || 0) ? 'Complete Checklist to Finalize' : 'Finalize & Seal Test'}
          </button>
        </section>
      </div>
    </motion.div>
  );

  // --- Phase 3: Specialist Performance Dossier ---
  const renderPerformance = () => {
    // Dynamic Mapping: Link to real-time backend data with high-fidelity mock fallback
    const metrics = data?.admin?.detailed_metrics || {};
    const stats = {
      wallet: {
        balance: "$1,248.50", // Mock for presentation (usually sensitive)
        weekly: "+$420.00",
        pending: "$150.00"
      },
      metrics: {
        totalTests: metrics.completed_visits || 48,
        goalTests: 60,
        rating: 4.9,
        successRate: metrics.completed_visits ? `${((metrics.completed_visits / (metrics.completed_visits + (metrics.no_shows || 0))) * 100).toFixed(1)}%` : "98.5%"
      },
      history: [
        { id: 'TX-901', date: 'Oct 11', amount: '$45.00', status: 'Settled', patient: 'J. Doe' },
        { id: 'TX-902', date: 'Oct 11', amount: '$60.00', status: 'Settled', patient: 'A. Smith' },
        { id: 'TX-903', date: 'Oct 10', amount: '$45.00', status: 'Pending', patient: 'M. Ross' },
      ]
    };

    // Mini Performance Chart Component (SVG)
    const MiniChart = ({ color }) => (
      <div className="metric-chart-container">
        <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d="M0,25 C10,20 15,28 25,22 C35,16 45,25 55,18 C65,11 80,15 100,2"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            className={`glow-${color === '#6366f1' ? 'indigo' : color === '#10b981' ? 'emerald' : 'amber'}`}
          />
        </svg>
      </div>
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-12 pb-16"
      >
        {/* Optimized Header & Status Control */}
        <header className="mb-12 relative z-10 flex justify-between items-center border-b border-white/5 pb-10">
           <div className="flex-1">
              <h1 className="phleb-title-main !text-5xl !mb-2">Specialist Dossier</h1>
              <div className="flex items-center gap-4">
                 <p className="text-[10px] text-indigo-400 font-black tracking-[0.4em] uppercase">Field Agent: {user.name} • Specialist ID: {data?.specialist?.id || "SF-77"}</p>
                 <div className="h-2 w-2 rounded-full bg-white/10"></div>
                 <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">Unit {user.location || 'Echo-1'}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 leading-none">Global Status</p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">Active Duty</span>
                 </div>
              </div>
              <div className="w-[1px] h-10 bg-white/5"></div>
              <div className="flex flex-col gap-1">
                 <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest mb-0.5">Satellite Sync</p>
                 <div className="flex gap-0.5">
                    {[1,2,3,4].map(i => <div key={i} className={`w-3 h-1 rounded-full ${i <= 3 ? 'bg-indigo-500' : 'bg-white/10 animate-pulse'}`}></div>)}
                 </div>
              </div>
           </div>
        </header>

        {/* Top Tier Metrics: Wallet & Analytics (FIXED GRID 12) */}
        <div className="grid grid-cols-12 gap-10">
           {/* Wallet Card - Premium Gradient */}
           <motion.section 
            whileHover={{ y: -5 }}
            className="phleb-card col-span-5 !p-12 relative overflow-hidden group"
           >
              <div className="phleb-card-hud-border"></div>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-150 rotate-12">
                 <Wallet size={160} strokeWidth={1} />
              </div>
              
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-10">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10"><Wallet size={20} /></div>
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Financial Command</h2>
                 </div>

                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Available Balance</p>
                 <h3 className="text-6xl font-black text-white mb-8 tracking-tighter leading-none metric-value-glow">{stats.wallet.balance}</h3>
                 
                 <div className="flex items-center gap-8 mb-12">
                    <div className="flex flex-col">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Weekly Growth</p>
                       <div className="flex items-center gap-2">
                          <TrendingUp size={12} className="text-emerald-400" />
                          <p className="text-base font-black text-emerald-400">{stats.wallet.weekly}</p>
                       </div>
                    </div>
                    <div className="w-[1px] h-10 bg-white/10"></div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pending Settlements</p>
                       <p className="text-base font-black text-slate-300">{stats.wallet.pending}</p>
                    </div>
                 </div>

                 <button 
                  onClick={() => triggerTacticalAction('payout', 'Account Verification', 'Secure Payout Process Initiated', 2500)}
                  disabled={activeAction === 'payout'}
                  className={`btn-success !w-full !p-6 flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] ${activeAction === 'payout' ? 'btn-processing' : ''}`}
                 >
                    {activeAction === 'payout' ? <div className="tactical-spinner"></div> : <ArrowUpRight size={20} />}
                    {activeAction === 'payout' ? 'Verifying Node...' : 'Request Secure Payout'}
                 </button>
              </div>
           </motion.section>

           {/* Metrics Grid */}
           <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-10">
              <motion.div whileHover={{ scale: 1.02 }} className="phleb-card !p-10 flex flex-col relative group">
                 <div className="phleb-card-hud-border"></div>
                 <div className="flex justify-between items-start mb-10">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10"><CheckCircle2 size={20} /></div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-500/5 rounded-full border border-indigo-500/10">Efficiency Index</span>
                 </div>
                 <div className="mt-2">
                    <h4 className="text-5xl font-black text-white mb-3 tracking-tight metric-value-glow">{stats.metrics.totalTests}</h4>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Completed Appointments</p>
                    
                    <div className="mt-8 w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.metrics.totalTests/stats.metrics.goalTests)*100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-linear-to-r from-indigo-600 to-indigo-400 shadow-[0_0_15px_#6366f1]"
                        ></motion.div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dossier Goal: {stats.metrics.goalTests}</p>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{Math.round((stats.metrics.totalTests/stats.metrics.goalTests)*100)}%</p>
                    </div>
                 </div>
                 <MiniChart color="#6366f1" />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="phleb-card !p-10 flex flex-col relative group">
                 <div className="phleb-card-hud-border"></div>
                 <div className="flex justify-between items-start mb-10">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10"><Star size={20} /></div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] px-3 py-1 bg-amber-500/5 rounded-full border border-amber-500/10">Client Sentiment</span>
                 </div>
                 <div className="mt-2">
                    <div className="flex items-center gap-3 mb-3">
                       <h4 className="text-5xl font-black text-white tracking-tight metric-value-glow">{stats.metrics.rating}</h4>
                       <div className="flex gap-1.5">
                          {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= 4 ? "#f59e0b" : "none"} className={s <= 4 ? "text-amber-500 glow-amber" : "text-white/10"} />)}
                       </div>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aggregate Specialist Score</p>
                    <div className="mt-8 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">{stats.metrics.successRate} Success</span>
                       </div>
                       <div 
                        onClick={() => setIsReviewsOpen(true)}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest underline cursor-pointer hover:text-white transition-colors"
                      >View Feedback</div>
                    </div>
                 </div>
                 <MiniChart color="#f59e0b" />
              </motion.div>
           </div>
        </div>

        {/* Transaction History & Test Logs - Full Width Optimized */}
        <section className="phleb-card !p-12 relative overflow-hidden group">
           <div className="phleb-card-hud-border"></div>
           <div className="flex justify-between items-center mb-12 relative z-10">
              <h2 className="phleb-card-title !mb-0 !text-xl group-hover:translate-x-1 transition-transform">
                 <div className="p-3 bg-white/5 text-slate-300 rounded-2xl border border-white/10 group-hover:border-indigo-500/30 transition-colors"><CreditCard size={20} /></div>
                 Operation Ledger Activity
              </h2>
              <div className="flex items-center gap-6">
                 <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Sync Active</span>
                 </div>
                 <button 
                  onClick={() => triggerTacticalAction('extract', 'Data Decryption', 'Performance Dossier Extracted Successfully', 3000)}
                  disabled={activeAction === 'extract'}
                  className={`text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:text-white transition-all bg-indigo-500/10 hover:bg-indigo-500/20 px-6 py-2.5 rounded-full border border-indigo-500/20 flex items-center gap-2 ${activeAction === 'extract' ? 'btn-processing' : ''}`}
                 >
                    {activeAction === 'extract' && <div className="tactical-spinner !w-3 !h-3"></div>}
                    {activeAction === 'extract' ? 'Syncing...' : 'Extract Statement'}
                 </button>
              </div>
           </div>

           <div className="space-y-5 relative z-10">
              {stats.history.map((tx, idx) => (
                 <div key={idx} className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/5 rounded-[32px] group/item hover:bg-white/[0.04] hover:border-white/20 transition-all hover:translate-x-2">
                    <div className="flex items-center gap-8">
                       <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover/item:border-indigo-500/20 transition-all">
                          <CheckCircle2 size={24} className={tx.status === 'Settled' ? 'text-emerald-400 glow-emerald' : 'text-amber-400 glow-amber'} />
                       </div>
                       <div>
                          <p className="text-base font-black text-white tracking-tight mb-1">{tx.patient}</p>
                          <div className="flex items-center gap-3">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tx.id}</p>
                             <div className="w-1 h-1 rounded-full bg-white/10"></div>
                             <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest">{tx.date}</p>
                          </div>
                       </div>
                    </div>
                    <div className="text-right flex items-center gap-10">
                       <div className="hidden sm:block">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Collection Status</p>
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${tx.status === 'Settled' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-amber-500/5 text-amber-400 border-amber-500/10'}`}>
                             {tx.status}
                          </p>
                       </div>
                       <div className="min-w-[100px]">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Net Settlement</p>
                          <p className="text-xl font-black text-white">{tx.amount}</p>
                       </div>
                       <div className="p-2.5 bg-white/5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer hover:bg-white/10">
                          <ArrowUpRight size={18} className="text-indigo-400" />
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>
      </motion.div>
    );
  };


  return (
    <div className={`phleb-dash-wrapper state-${workflowStatus}`}>
      {/* Sidebar Navigation */}
      <aside className="phleb-sidebar">
        <div className="sidebar-logo">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="sidebar-logo-icon"
          >
            <Droplets size={20} />
          </motion.div>
          <h2>MusB Phlebotomy</h2>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item btn-tactical ${activeTab === 'dispatch' ? 'active' : ''} !p-4 !justify-start !border-none`}
            onClick={() => setActiveTab('dispatch')}
          >
            <Navigation size={20} /> Dashboard
          </div>
          <div 
            className={`nav-item btn-tactical ${activeTab === 'case' ? 'active' : ''} !p-4 !justify-start !border-none`}
            onClick={() => setActiveTab('case')}
          >
            <div className="relative">
               <ListChecks size={20} />
               {checkedSpecimens.length > 0 && checkedSpecimens.length < (data?.active_case?.specimens?.length || 0) && (
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
               )}
            </div>
            Appointment Detail
          </div>
          <div 
            className={`nav-item btn-tactical ${activeTab === 'admin' ? 'active' : ''} !p-4 !justify-start !border-none`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldCheck size={20} /> Performance Dossier
          </div>

        </nav>

        <div className="sidebar-footer">
          <div 
             className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-4 border border-white/5 group hover:border-white/20 transition-all cursor-pointer"
             onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black group-hover:scale-105 transition-all">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-white">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-200 uppercase">{user.location || 'Field Unit'}</p>
            </div>
            <Edit3 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
          </div>
          <button 
            onClick={() => { localStorage.removeItem('phleb_token'); localStorage.removeItem('phleb_user'); window.location.reload(); }}
            className="btn-tactical !w-full !p-4 !justify-start !text-rose-400 !border-rose-500/10 hover:!bg-rose-500/5 transition-all"
          >
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Full Log Off</span>
          </button>
        </div>
      </aside>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="phleb-portal-overlay" style={{ zindex: 2000 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="phleb-card !p-10 w-full max-w-md bg-[#0d1117] border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black text-white">Edit Specialist Profile</h2>
                 <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Display Name</label>
                    <input 
                      className="phleb-input !bg-white/5 w-full !p-4"
                      value={profileData.name}
                      onChange={e => setProfileData({...profileData, name: e.target.value})}
                      required
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Operating Zone</label>
                    <input 
                      className="phleb-input !bg-white/5 w-full !p-4"
                      value={profileData.location}
                      placeholder="e.g. Manhattan, NY"
                      onChange={e => setProfileData({...profileData, location: e.target.value})}
                      required
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Contact Phone</label>
                    <input 
                      className="phleb-input !bg-white/5 w-full !p-4"
                      value={profileData.phone}
                      placeholder="+1 (555) 000-0000"
                      onChange={e => setProfileData({...profileData, phone: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Organization / Company</label>
                    <input 
                      className="phleb-input !bg-white/5 w-full !p-4"
                      value={profileData.company}
                      onChange={e => setProfileData({...profileData, company: e.target.value})}
                    />
                 </div>

                 <button type="submit" className="btn-primary !w-full !p-6 mt-4">
                    <Save size={18} /> Sync Account Details
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Specialist Reviews Modal */}
      <AnimatePresence>
        {isReviewsOpen && (
          <div className="phleb-portal-overlay" style={{ zIndex: 10001 }}>
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="phleb-card !p-12 w-full max-w-2xl bg-[#0d1117] border-white/10"
             >
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-white">Specialist Case Reviews</h2>
                   <button onClick={() => setIsReviewsOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                   {[
                      { patient: "J. Doe", rating: 5, date: "2 days ago", comment: "Agent Situn was extremely professional and arrived exactly on time. Minimal pain during collection." },
                      { patient: "A. Smith", rating: 4, date: "5 days ago", comment: "Very quick and efficient. Clean setup." },
                      { patient: "M. Ross", rating: 5, date: "1 week ago", comment: "The most professional mobile service I've used. Detailed briefing provided." }
                   ].map((rev, i) => (
                      <div key={i} className="review-item">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <p className="text-sm font-black text-white mb-1">{rev.patient}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase">{rev.date}</p>
                            </div>
                            <div className="flex gap-1">
                               {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= rev.rating ? "#f59e0b" : "none"} className={s <= rev.rating ? "text-amber-500" : "text-white/10"} />)}
                            </div>
                         </div>
                         <p className="text-xs text-slate-300 italic leading-relaxed">"{rev.comment}"</p>
                      </div>
                   ))}
                </div>
                
                <button 
                  onClick={() => setIsReviewsOpen(false)}
                  className="btn-tactical !w-full !p-6 mt-10"
                >
                   Close Dossier Feedback
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Tactical Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="tactical-notification"
          >
             <div className="tactical-notification-icon">
                <CheckCircle2 size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{notification.label}</p>
                <p className="text-sm font-black text-white">{notification.message}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="phleb-main-content">
        <div className="stellar-mesh-container">
          <div className="mesh-blob" style={{ top: '-10%', right: '-5%' }}></div>
          <div className="mesh-blob" style={{ bottom: '-10%', left: '-5%' }}></div>
          <div className="mesh-blob" style={{ top: '40%', left: '30%', width: '400px', height: '400px', opacity: 0.05 }}></div>
        </div>

        {/* Global Summary Metrics (Visible only in Dispatch) */}
        {activeTab === 'dispatch' && (
          <header className="mb-16 relative z-10 border-b border-white/5 pb-12 flex justify-between items-end">
             <div>
                <h1 className="phleb-title-main">Phlebotomist Dashboard</h1>
                <p className="text-xs text-slate-300 font-black tracking-[0.2em] uppercase mt-4 shadow-text">Active Shift Modules & Tactical Radar</p>
             </div>
             
             {/* Tactical Duty Toggle (Theme-Aligned Control) */}
             <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                minWidth: '280px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
             }}>
                <div style={{
                   background: 'rgba(255, 255, 255, 0.02)',
                   padding: '12px 24px',
                   borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                   <h4 style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3em',
                      color: 'rgba(99, 102, 241, 0.8)',
                      margin: 0
                   }}>Operational Status</h4>
                </div>
                
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div style={{ 
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: isOnline ? '#10b981' : '#f43f5e',
                            boxShadow: isOnline ? '0 0 12px #10b981' : '0 0 12px #f43f5e'
                         }}></div>
                         <span style={{ 
                            fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em',
                            color: isOnline ? 'white' : 'rgba(255,255,255,0.4)'
                         }}>
                            Status: <span style={{ color: isOnline ? '#10b981' : '#f43f5e' }}>{isOnline ? 'ON' : 'OFF'}</span>
                         </span>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                         {isOnline ? 'Satellite Sync Active' : 'System Standby Mode'}
                      </span>
                   </div>
                   
                   {/* Mechanical Switch Toggle */}
                   <div 
                      onClick={handleStatusToggle}
                      style={{
                         width: '64px', height: '32px',
                         background: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                         borderRadius: '100px',
                         border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                         position: 'relative',
                         cursor: 'pointer',
                         transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                   >
                      <div style={{
                         position: 'absolute',
                         top: '3px',
                         left: isOnline ? '35px' : '3px',
                         width: '24px', height: '24px',
                         background: isOnline ? '#10b981' : '#475569',
                         borderRadius: '50%',
                         transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                         boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
                      }}></div>
                   </div>
                </div>
             </div>
          </header>
        )}

        {/* Dynamic Module Render */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dispatch' && renderDispatch()}
            {activeTab === 'case' && renderActiveCase()}
            {activeTab === 'admin' && renderPerformance()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default PhlebotomistDashboard;
