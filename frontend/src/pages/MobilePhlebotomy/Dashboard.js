import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Clock, Droplets, 
  LogOut, MapPin, 
  ShieldCheck, TrendingUp, Truck, AlertCircle,
  Zap,
  Navigation, User, Info, ListChecks,
  Calendar, Users, Map
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import './Portal.css';

const PhlebotomistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dispatch');
  const [data, setData] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState('indigo'); // indigo, enroute, arrived, collected, issue
  const [checkedSpecimens, setCheckedSpecimens] = useState([]);
  const [sessionYield, setSessionYield] = useState(215.00);
  const [totalDrops, setTotalDrops] = useState(142);
  const [user] = useState(JSON.parse(localStorage.getItem('phleb_user')) || { name: 'Demo Specialist', company: 'MUSB Field Ops' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/phleb/dashboard/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('phleb_token')}`
          }
        });

        if (response.status === 401) {
          // Tactical Redirect if session expires
          localStorage.removeItem('phleb_token');
          navigate('/mobile-phlebotomy');
          return;
        }

        const resData = await response.json();
        setData(resData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setTimeout(() => setLoading(false), 1200);
      }
    };
    fetchDashboard();
  }, []);

  const handleWorkflowChange = async (status) => {
    const missionId = data?.dispatch?.next_stop?.id || 'APP-902';
    
    // --- 1. Optimistic UI Update (Snappy Feel) ---
    setWorkflowStatus(status);
    if (status === 'collected' || status === 'completed') {
      setSessionYield(prev => prev + 45.00);
      setTotalDrops(prev => prev + 1);
    }

    // --- 2. Live Backend Sync ---
    try {
      await fetch(`/api/phleb/mission/${missionId}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('phleb_token')}`
        },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Tactical sync failed:', err);
    }
  };

  const toggleSpecimen = (id) => {
    setCheckedSpecimens(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('phleb_token');
    localStorage.removeItem('phleb_user');
    navigate('/mobile-phlebotomy');
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-14">
      {/* 1. Today's Appointments List (Primary) */}
      <section className="phleb-card !p-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="phleb-card-title !mb-0">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><ListChecks size={20} /></div>
            Today's Appointments List
          </h2>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data?.dispatch?.today_route?.length} Field Missions Active</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {data?.dispatch?.today_route?.map((stop, idx) => (
            <div key={idx} className="route-item-grid bg-white/[0.02] hover:bg-white/[0.04] transition-all p-4 rounded-xl border border-white/5">
              <div className="route-time text-indigo-400 font-black">{stop.time}</div>
              <div className="route-info">
                <h5 className="text-white font-black">{stop.id}</h5>
                <p className="text-[10px] text-slate-200 font-bold uppercase">{stop.addr}</p>
              </div>
              <div className="route-status">
                <span className={`status-chip !text-[8px] !px-2 !py-1 ${stop.status === 'Completed' ? 'completed' : 'pending'}`}>
                  {stop.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="dash-modules-grid">
        {/* 2. Route Map and Optimized Route (Radar) */}
        <section className="phleb-card map-module !p-0">
          <div className="absolute top-6 left-6 z-10 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Optimized Route Map</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Navigation size={14} className="text-emerald-400 animate-pulse" /> Radar Sync Active...
            </div>
          </div>
          <div className="map-placeholder">
            <div className="map-grid-overlay"></div>
            <div className="radar-scan-line"></div>
            <div className="radar-ping target" style={{ top: '65%', left: '75%' }}></div>
          </div>
        </section>

        {/* 3. Next Stop Details & 4. Status Buttons */}
        <div className="space-y-6">
          <section className="phleb-card next-stop-card">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><MapPin size={24} /></div>
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Next Stop Details</h5>
            </div>
            <h3 className="text-3xl font-black text-white mb-2">{data?.dispatch?.next_stop?.time}</h3>
            <p className="text-sm font-bold text-slate-300 mb-10">{data?.dispatch?.next_stop?.patient} • {data?.dispatch?.next_stop?.address}</p>
            
            <div className="workflow-actions border-t border-white/5 pt-10">
              <button className={`workflow-btn btn-tactical ${workflowStatus === 'enroute' ? 'active' : ''}`} onClick={() => handleWorkflowChange('enroute')} style={{ '--btn-color-glow': 'rgba(2, 132, 199, 0.4)' }}>
                <Navigation size={18} /> En Route
              </button>
              <button className={`workflow-btn btn-tactical ${workflowStatus === 'arrived' ? 'active' : ''}`} onClick={() => handleWorkflowChange('arrived')} style={{ '--btn-color-glow': 'rgba(245, 158, 11, 0.4)' }}>
                <Truck size={18} /> Arrived
              </button>
              <button className={`workflow-btn btn-tactical ${workflowStatus === 'collected' ? 'active' : ''}`} onClick={() => handleWorkflowChange('collected')} style={{ '--btn-color-glow': 'rgba(16, 185, 129, 0.4)' }}>
                <Droplets size={18} /> Collected
              </button>
              <button className={`workflow-btn btn-tactical ${workflowStatus === 'completed' ? 'active' : ''}`} onClick={() => handleWorkflowChange('completed')} style={{ '--btn-color-glow': 'rgba(99, 102, 241, 0.4)' }}>
                <CheckCircle2 size={18} /> Completed
              </button>
              <button className={`workflow-btn btn-tactical ${workflowStatus === 'issue' ? 'active' : ''}`} onClick={() => handleWorkflowChange('issue')} style={{ '--btn-color-glow': 'rgba(239, 68, 68, 0.4)' }}>
                <AlertCircle size={18} /> Issue
              </button>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );  // --- Phase 2: Appointment Detail (Active Mission) ---
  const renderActiveCase = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="case-file-grid">
      <div className="case-profile-sidebar">
        {/* 1. Patient Profile & 4. Associated Doctor/Facility/Employer */}
        <section className="phleb-card case-profile-card">
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
        </section>

        {/* 6. Reschedule / report issue */}
        <section className="action-stack mt-8">
          <button className="btn-tactical !w-full !p-6">
            <Calendar size={18} /> Reschedule Mission
          </button>
          <button className="btn-danger !w-full !p-6">
            <AlertCircle size={18} /> Report Tactical Issue
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
             <button className="btn-success !px-8 !py-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Collect Payment
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
          
          <button className="btn-primary !w-full !mt-10 !p-8 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
            Finalize & Seal Mission
          </button>
        </section>
      </div>
    </motion.div>
  );

  // --- Phase 3: Phlebotomist Admin (Internal) ---
  const renderAdmin = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-16 pb-16">
      <header className="mb-16 relative z-10 border-b border-white/5 pb-12">
         <h1 className="phleb-title-main">Phlebotomist Admin</h1>
         <p className="text-xs text-slate-300 font-black tracking-[0.2em] uppercase mt-6">Internal Fleet & Operational Logistics</p>
      </header>

      <div className="admin-grid">
        {/* 1. Staff Roster */}
        <section className="phleb-card col-span-12">
          <h2 className="phleb-card-title mb-12">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Users size={20} /></div>
            Staff Roster
          </h2>
          <div className="admin-grid-3">
            {data?.admin?.roster?.map((staff, idx) => (
              <div key={idx} className="admin-unit-card group">
                 <div className="pulse-line"></div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center font-black text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-all">
                     {staff.name.charAt(0)}
                   </div>
                   <div>
                     <h4 className="text-sm font-black text-white tracking-tight">{staff.name}</h4>
                     <p className="text-[10px] text-slate-200 font-bold uppercase tracking-widest">{staff.zone}</p>
                   </div>
                 </div>
                 <div className={`unit-badge ${staff.status.toLowerCase().replace(' ', '')}`}>
                   {staff.status}
                 </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-grid">
         {/* 2. Coverage Areas */}
         <section className="phleb-card col-span-7 !p-14">
           <h2 className="phleb-card-title mb-12">
             <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Map size={20} /></div>
             Coverage Areas
           </h2>
           <div className="grid grid-cols-2 gap-6">
              {[
                { name: 'Manhattan Core', status: 'High Saturation' },
                { name: 'Brooklyn North', status: 'Normal Coverage' },
                { name: 'Queens Central', status: 'Critical Unit Needed' },
                { name: 'Bronx District', status: 'Normal Coverage' }
              ].map((zone, idx) => (
                <div key={idx} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                   <h5 className="text-sm font-black text-white mb-2">{zone.name}</h5>
                   <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{zone.status}</p>
                </div>
              ))}
           </div>
         </section>

         {/* 3. Schedule Availability */}
         <section className="phleb-card col-span-5 !p-14">
           <h2 className="phleb-card-title mb-12">
             <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Calendar size={20} /></div>
             Schedule Availability
           </h2>
           <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                   <span className="text-xs font-bold text-slate-200">{day}</span>
                   <span className="text-[10px] font-black text-emerald-400 uppercase">Available</span>
                </div>
              ))}
           </div>
         </section>
      </div>

      {/* 4. Performance Metrics */}
      <section className="phleb-card !p-12">
         <h2 className="phleb-card-title mb-12">
           <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><TrendingUp size={20} /></div>
           Internal Performance Metrics
         </h2>
         <div className="grid grid-cols-3 gap-8">
           <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-center">
             <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-3">Completed Visits</p>
             <h3 className="text-5xl font-black text-white">{data?.admin?.detailed_metrics?.completed_visits || '0'}</h3>
           </div>
           <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-center">
             <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-3">No-Shows</p>
             <h3 className="text-5xl font-black text-white">{data?.admin?.detailed_metrics?.no_shows || '0'}</h3>
           </div>
           <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-center">
             <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-3">Collection Issues</p>
             <h3 className="text-5xl font-black text-white">{data?.admin?.detailed_metrics?.collection_issues || '0'}</h3>
           </div>
         </div>
      </section>
    </motion.div>
  );


  return (
    <div className={`phleb-dash-wrapper state-${workflowStatus}`}>
      {/* Sidebar Navigation */}
      <aside className="phleb-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Droplets size={20} /></div>
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
            <ShieldCheck size={20} /> Phlebotomist Admin
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-4 border border-white/5 group hover:border-white/10 transition-all">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black group-hover:scale-105 transition-all">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-black text-white">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-200 uppercase">Field Unit 01</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('phleb_token'); window.location.reload(); }}
            className="btn-tactical !w-full !p-4 !justify-start !text-rose-400 !border-rose-500/10 hover:!bg-rose-500/5 transition-all"
          >
            <LogOut size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Full Log Off</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="phleb-main-content">
        <div className="stellar-mesh-container">
          <div className="mesh-blob" style={{ top: '-10%', right: '-5%' }}></div>
          <div className="mesh-blob" style={{ bottom: '-10%', left: '-5%' }}></div>
        </div>

        {/* Global Summary Metrics (Visible only in Dispatch) */}
        {activeTab === 'dispatch' && (
          <header className="mb-16 relative z-10 border-b border-white/5 pb-12">
             <h1 className="phleb-title-main">Phlebotomist Dashboard</h1>
             <p className="text-xs text-slate-300 font-black tracking-[0.2em] uppercase mt-4 shadow-text">Active Shift Modules & Tactical Radar</p>
          </header>
        )}

        {/* Dynamic Module Render */}
        <div className="relative z-10">
          {activeTab === 'dispatch' && renderDispatch()}
          {activeTab === 'case' && renderActiveCase()}
          {activeTab === 'admin' && renderAdmin()}
        </div>
      </main>
    </div>
  );
};

export default PhlebotomistDashboard;
