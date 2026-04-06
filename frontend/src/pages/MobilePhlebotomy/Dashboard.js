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
        const resData = await response.json();
        setData(resData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchDashboard();
  }, []);

  const handleWorkflowChange = (status) => {
    setWorkflowStatus(status);
    if (status === 'collected' || status === 'completed') {
      // Simulate live data update
      setSessionYield(prev => prev + 45.00);
      setTotalDrops(prev => prev + 1);
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

  const renderDispatch = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="dash-modules-grid">
        {/* Route Map Module - Dynamic Radar */}
        <section className="phleb-card map-module !p-0">
          <div className="absolute top-6 left-6 z-10 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Tactical Field Radar</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Navigation size={14} className="text-emerald-400 animate-pulse" /> Scanning Core Assets...
            </div>
          </div>
          <div className="map-placeholder">
            <div className="map-grid-overlay"></div>
            <div className="radar-scan-line"></div>
            <div className="radar-ping" style={{ top: '30%', left: '40%' }}></div>
            <div className="radar-ping target" style={{ top: '65%', left: '75%' }}></div>
            <div className="radar-ping" style={{ top: '20%', left: '85%' }}></div>
          </div>
        </section>

        {/* Next Stop Module */}
        <div className="space-y-6">
          <section className="phleb-card next-stop-card">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl"><MapPin size={24} /></div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest">Next Arrival</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-2">{data?.dispatch?.next_stop?.time}</h3>
            <p className="text-sm font-bold text-slate-300 mb-6">{data?.dispatch?.next_stop?.patient} • {data?.dispatch?.next_stop?.address}</p>
            
            <div className="workflow-actions">
              <button 
                className={`workflow-btn ${workflowStatus === 'enroute' ? 'active' : ''}`}
                style={{ '--btn-color': '#0284c7', '--btn-glow': 'rgba(2, 132, 199, 0.3)' }}
                onClick={() => handleWorkflowChange('enroute')}
              >
                <Navigation size={18} /> En Route
              </button>
              <button 
                className={`workflow-btn ${workflowStatus === 'arrived' ? 'active' : ''}`}
                style={{ '--btn-color': '#f59e0b', '--btn-glow': 'rgba(245, 158, 11, 0.3)' }}
                onClick={() => handleWorkflowChange('arrived')}
              >
                <Truck size={18} /> Arrived
              </button>
              <button 
                className={`workflow-btn ${workflowStatus === 'collected' ? 'active' : ''}`}
                style={{ '--btn-color': '#10b981', '--btn-glow': 'rgba(16, 185, 129, 0.3)' }}
                onClick={() => handleWorkflowChange('collected')}
              >
                <Droplets size={18} /> Collected
              </button>
              <button 
                className={`workflow-btn ${workflowStatus === 'completed' ? 'active' : ''}`}
                style={{ '--btn-color': '#6366f1', '--btn-glow': 'rgba(99, 102, 241, 0.3)' }}
                onClick={() => handleWorkflowChange('completed')}
              >
                <CheckCircle2 size={18} /> Completed
              </button>
              <button 
                className={`workflow-btn ${workflowStatus === 'issue' ? 'active' : ''}`}
                style={{ '--btn-color': '#ef4444', '--btn-glow': 'rgba(239, 68, 68, 0.3)' }}
                onClick={() => handleWorkflowChange('issue')}
              >
                <AlertCircle size={18} /> Issue
              </button>
            </div>
          </section>

          <section className="phleb-card !p-6">
            <h2 className="phleb-card-title !mb-6">
              <div className="p-2 bg-slate-500/20 text-slate-200 rounded-lg"><Clock size={20} /></div>
              Today's Field Route
            </h2>
            <div className="space-y-3">
              {data?.dispatch?.today_route?.map((stop, idx) => (
                <div key={idx} className="route-item-grid">
                  <div className="route-time">{stop.time}</div>
                  <div className="route-info">
                    <h5>{stop.id}</h5>
                    <p className="text-slate-300">{stop.addr}</p>
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
        </div>
      </div>
    </motion.div>
  );

  const renderActiveCase = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="case-file-grid">
      <div className="case-profile-sidebar">
        <section className="phleb-card case-profile-card">
          <div className="patient-avatar-container">
            <div className="avatar-ring"></div>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-[30px] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <User size={40} strokeWidth={2.5} />
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-white tracking-tight">{data?.active_case?.initials} • {data?.active_case?.patient_id}</h3>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.1em]">Verified Profile Access</p>
          </div>
          
          <div className="case-profile-stats">
            <div className="stat-box">
              <h6>Age</h6>
              <p>{data?.active_case?.age}Y</p>
            </div>
            <div className="stat-box">
              <h6>Gender</h6>
              <p>{data?.active_case?.gender}</p>
            </div>
            <div className="stat-box">
              <h6>Type</h6>
              <p className="text-amber-400">STAT</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><Info size={14} /></div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Facility</span>
              </div>
              <span className="text-[11px] font-black text-white">{data?.active_case?.associated_facility}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><User size={14} /></div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Clinician</span>
              </div>
              <span className="text-[11px] font-black text-white">{data?.active_case?.doctor}</span>
            </div>
          </div>
        </section>

        <section className="action-stack">
          <button className="hud-action-btn indigo">
            <Calendar size={18} strokeWidth={2.5} />
            Reschedule Mission
          </button>
          <button className="hud-action-btn red">
            <AlertCircle size={18} strokeWidth={2.5} />
            Report Tactical Issue
          </button>
        </section>
      </div>

      <div className="space-y-10">
        {/* Clinical Overview Group */}
        <div className="clinical-group">
          <section className="phleb-card !mb-0">
            <h2 className="phleb-card-title !mb-6">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Info size={20} /></div>
              Instructions
            </h2>
            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative overflow-hidden min-h-[160px] flex items-center">
               <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
              <p className="text-sm font-bold text-amber-200/80 leading-relaxed italic">
                "{data?.active_case?.instructions}"
              </p>
            </div>
          </section>

          <section className="phleb-card !mb-0 flex flex-col">
            <h2 className="phleb-card-title !mb-6">
              <div className="p-2 bg-slate-500/20 text-slate-200 rounded-lg"><Clock size={20} /></div>
              Field Analytics
            </h2>
            <textarea 
              className="flex-1 w-full bg-white/5 border border-white/20 rounded-2xl p-6 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              placeholder="Add tactical collection notes here..."
              defaultValue={data?.active_case?.notes}
            ></textarea>
          </section>
        </div>

        {/* Collection Checklist */}
        <section className="phleb-card">
          <div className="flex justify-between items-center mb-8">
            <h2 className="phleb-card-title !mb-0">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><ListChecks size={20} /></div>
              Collection Protocol
            </h2>
            <div className="flex items-center gap-4">
               <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                  {data?.active_case?.payment_status}
               </div>
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  {checkedSpecimens.length} / {data?.active_case?.specimens?.length} SECURED
               </div>
            </div>
          </div>

          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-10">
             <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(checkedSpecimens.length / (data?.active_case?.specimens?.length || 1)) * 100}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {data?.active_case?.specimens?.map((spec, idx) => (
              <div 
                key={idx} 
                onClick={() => toggleSpecimen(spec)}
                className={`checklist-item group ${checkedSpecimens.includes(spec) ? 'checked' : ''} !p-5`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${checkedSpecimens.includes(spec) ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'}`}>
                  <CheckCircle2 size={14} className={`text-white transition-opacity ${checkedSpecimens.includes(spec) ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold transition-colors ${checkedSpecimens.includes(spec) ? 'text-emerald-400' : 'text-slate-200'}`}>{spec}</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">Vacuum Tube Verified</span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            disabled={checkedSpecimens.length < (data?.active_case?.specimens?.length || 0)}
            className={`w-full mt-10 p-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[12px] transition-all ${checkedSpecimens.length === (data?.active_case?.specimens?.length || 0) ? 'bg-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98]' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
          >
            Finalize & Seal Collection
          </button>
        </section>
      </div>
    </motion.div>
  );


  const renderAdmin = () => {
    const ZoneGasket = ({ label, value, type }) => {
      const radius = 20;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (value / 100) * circumference;
      
      return (
        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
          <div className="zone-gasket">
            <svg className="gasket-svg">
              <circle className="gasket-bg" cx="25" cy="25" r={radius} />
              <circle 
                className={`gasket-progress gasket-${type.toLowerCase()}`} 
                cx="25" cy="25" r={radius} 
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <span className="text-[10px] font-black text-white">{value}%</span>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Region Saturation</p>
            <p className="text-xs font-black text-white">{label}</p>
          </div>
        </div>
      );
    };

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 pb-10">
        {/* Row 1: Deployment Matrix */}
        <div className="admin-grid">
          <section className="phleb-card col-span-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="phleb-card-title !mb-0">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Users size={20} /></div>
                Personnel Deployment Matrix
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">12 Units Tactical Sync</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {data?.admin?.roster?.map((staff, idx) => (
                <div key={idx} className="admin-unit-card">
                  <div className="pulse-line"></div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center font-black text-sm text-indigo-400 border border-indigo-500/20">
                        {staff.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0c12] ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">{staff.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{staff.zone}</p>
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

        {/* Row 2: Logistics Split */}
        <div className="admin-grid">
          <section className="phleb-card col-span-7 !p-8">
            <h2 className="phleb-card-title mb-8">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Map size={20} /></div>
              Regional Saturation Diagnostics
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <ZoneGasket label="Zone 1 (High)" value={85} type="Peak" />
              <ZoneGasket label="Zone 2 (Normal)" value={45} type="Normal" />
              <ZoneGasket label="Zone 5 (Peak)" value={92} type="Peak" />
              <ZoneGasket label="Zone 8 (Normal)" value={30} type="Normal" />
            </div>
          </section>

          <section className="phleb-card fleet-opt-hud col-span-5 !p-8 h-full flex flex-col justify-center">
            <div className="opt-radar-dot" style={{ top: '15%', left: '25%' }}></div>
            <div className="opt-radar-dot" style={{ bottom: '20%', right: '30%', animationDelay: '1s' }}></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-[24px] flex items-center justify-center text-indigo-400 mx-auto mb-8 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <Zap size={36} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white mb-4">Strategic Node</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest opacity-80">
                Synchronizing 12 units. Tactical route recalculation active.
              </p>
              
              <div className="mt-12 grid grid-cols-2 gap-10 border-t border-white/5 pt-10">
                 <div className="text-center">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Live Telemetry</p>
                    <p className="text-4xl font-black text-indigo-400">42</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Tactical Queue</p>
                    <p className="text-4xl font-black text-emerald-400">0</p>
                 </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    );
  };

  const renderPerformance = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <header className="grid grid-cols-4 gap-6">
        <div className="phleb-card !p-6 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Completed Visits</p>
          <h3 className="text-3xl font-black text-emerald-400">{data?.admin?.detailed_metrics?.completed_visits}</h3>
        </div>
        <div className="phleb-card !p-6 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">No-Shows</p>
          <h3 className="text-3xl font-black text-red-400">{data?.admin?.detailed_metrics?.no_shows}</h3>
        </div>
        <div className="phleb-card !p-6 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Collection Issues</p>
          <h3 className="text-3xl font-black text-amber-400">{data?.admin?.detailed_metrics?.collection_issues}</h3>
        </div>
        <div className="phleb-card !p-6 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Avg Time / Visit</p>
          <h3 className="text-3xl font-black text-indigo-400">{data?.admin?.detailed_metrics?.avg_time_per_visit}</h3>
        </div>
      </header>

      <section className="phleb-card">
        <h2 className="phleb-card-title mb-8">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><TrendingUp size={20} /></div>
          Fleet Optimization Trends
        </h2>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.admin?.performance_history}>
              <defs>
                <linearGradient id="colorVisitsBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" fillOpacity={1} fill="url(#colorVisitsBlue)" strokeWidth={3} />
              <Area type="monotone" dataKey="no_shows" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
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
          <h2>MusB Fleet</h2>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatch')}
          >
            <Navigation size={20} /> Dispatch Center
          </div>
          <div 
            className={`nav-item ${activeTab === 'case' ? 'active' : ''}`}
            onClick={() => setActiveTab('case')}
          >
            <div className="relative">
               <ListChecks size={20} />
               {checkedSpecimens.length > 0 && checkedSpecimens.length < (data?.active_case?.specimens?.length || 0) && (
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
               )}
            </div>
            Active Case
          </div>
          <div 
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldCheck size={20} /> Command Admin
          </div>
          <div 
            className={`nav-item ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <TrendingUp size={20} /> Performance
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-4 border border-white/5 group hover:border-white/10 transition-all">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black group-hover:scale-105 transition-all">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-black text-white">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-300 uppercase">Field Unit 01</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={14} /> Full Log Off
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
          <header className="mb-12 flex justify-between items-baseline relative z-10 border-b border-white/5 pb-8">
            <div>
              <h1 className="phleb-title-main">Fleet Dispatch</h1>
              <p className="text-xs text-slate-300 font-black tracking-[0.2em] uppercase mt-2 shadow-text">Active Field Logistics Synchronized</p>
            </div>
            <div className="flex gap-12">
              <div className="text-right">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-2 opacity-80">Session Yield</p>
                <motion.h4 
                  key={sessionYield}
                  initial={{ scale: 1.2, color: '#10b981' }}
                  animate={{ scale: 1, color: '#10b981' }}
                  className="text-3xl font-black tracking-tight"
                >
                  ${sessionYield.toFixed(2)}
                </motion.h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-2 opacity-80">Unit Drops</p>
                <motion.h4 
                  key={totalDrops}
                  initial={{ scale: 1.2, color: '#6366f1' }}
                  animate={{ scale: 1, color: '#6366f1' }}
                  className="text-3xl font-black tracking-tight"
                >
                  {totalDrops}
                </motion.h4>
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Module Render */}
        <div className="relative z-10">
          {activeTab === 'dispatch' && renderDispatch()}
          {activeTab === 'case' && renderActiveCase()}
          {activeTab === 'admin' && renderAdmin()}
          {activeTab === 'performance' && renderPerformance()}
        </div>
      </main>
    </div>
  );
};

export default PhlebotomistDashboard;
