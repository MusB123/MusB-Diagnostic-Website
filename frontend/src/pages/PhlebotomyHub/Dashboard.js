import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ClipboardList, DollarSign, TrendingUp, 
  MapPin, Clock, Search, Filter, ArrowUpRight
} from 'lucide-react';
import api from '../../api/api';
import './HubPortal.css';

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/phleb/hubs/dashboard/');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch hub stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ color: '#818cf8', fontWeight: 800, padding: '2rem' }}>SYNCING OPS DATA...</div>;

  // Filtering Logic
  const filteredPipeline = (stats.pipeline || []).filter(order => {
    const rawStatus = (order.status || '').toUpperCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      (order.patient || '').toLowerCase().includes(searchLower) || 
      (order.location || '').toLowerCase().includes(searchLower) ||
      rawStatus.includes(searchLower);

    let matchesFilter = filterStatus === 'All';
    if (filterStatus === 'Pending') {
      matchesFilter = rawStatus.includes('PENDING');
    } else if (filterStatus === 'In Progress') {
      matchesFilter = rawStatus === 'ASSIGNED' || rawStatus === 'ACTIVE' || rawStatus === 'IN_PROGRESS' || rawStatus === 'IN PROGRESS';
    } else if (filterStatus === 'Completed') {
      matchesFilter = rawStatus === 'COMPLETED' || rawStatus === 'FINISHED';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="hub-dashboard">
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <motion.div className="stat-card-custom" whileHover={{ y: -5 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ClipboardList color="#6366f1" size={24} />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>+12%</span>
          </div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>{stats.metrics.total_orders}</div>
          <div className="stat-label-bold" style={{ color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Active Assignments</div>
        </motion.div>

        <motion.div className="stat-card-custom" whileHover={{ y: -5 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Users color="#a855f7" size={24} />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>LIVE</span>
          </div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>{stats.metrics.active_phlebs}</div>
          <div className="stat-label-bold" style={{ color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Fleet Online</div>
        </motion.div>

        <motion.div className="stat-card-custom" whileHover={{ y: -5 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <DollarSign color="#10b981" size={24} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 900 }}>MTD</span>
          </div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>{stats.metrics.revenue}</div>
          <div className="stat-label-bold" style={{ color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Gross Revenue</div>
        </motion.div>

        <motion.div className="stat-card-custom" whileHover={{ y: -5 }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '1.5rem' }}>
          <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TrendingUp color="#3b82f6" size={24} />
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 900, background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>OPTIMAL</span>
          </div>
          <div className="stat-value-large" style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '15px 0' }}>98.4%</div>
          <div className="stat-label-bold" style={{ color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Success Rate</div>
        </motion.div>
      </div>

      <div className="hub-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="hub-glass-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="hub-heading" style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>Active Pipeline</h3>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', position: 'relative' }}>
              {isSearchOpen && (
                <motion.input 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '180px', opacity: 1 }}
                  type="text"
                  placeholder="Search patient/location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none'
                  }}
                />
              )}
              <div 
                style={{ cursor: 'pointer', padding: '8px', background: isSearchOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', color: isSearchOpen ? '#818cf8' : '#fff' }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search size={18} />
              </div>
              <div 
                style={{ cursor: 'pointer', padding: '8px', background: isFilterOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', color: isFilterOpen ? '#818cf8' : '#fff' }}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
              </div>

              {isFilterOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: '#161625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 10, width: '120px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                  {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
                    <div 
                      key={status}
                      onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '6px', background: filterStatus === status ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: filterStatus === status ? '#818cf8' : '#94a3b8' }}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredPipeline.length > 0 ? (
              filteredPipeline.map((order, idx) => {
                const badgeId = (order.id || '').toString().includes('-') 
                  ? order.id.split('-')[1] 
                  : (order.id || '???').toString().slice(-3).toUpperCase();
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={idx} 
                    className="order-item" 
                    style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                      <div style={{ width: '45px', height: '45px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 900, fontSize: '1rem' }}>
                        {badgeId}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{order.patient || 'Medical Case'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}>
                          <MapPin size={14} color="#6366f1" /> {order.location || 'Remote Zone'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '100px', 
                        fontSize: '0.7rem', 
                        fontWeight: 900, 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        background: (order.status || '').toUpperCase().includes('PENDING') ? 'rgba(245, 158, 11, 0.15)' : 
                                   ['ASSIGNED', 'IN_PROGRESS', 'ACTIVE'].includes((order.status || '').toUpperCase()) ? 'rgba(59, 130, 246, 0.15)' : 
                                   'rgba(16, 185, 129, 0.15)', 
                        color: (order.status || '').toUpperCase().includes('PENDING') ? '#fbbf24' : 
                               ['ASSIGNED', 'IN_PROGRESS', 'ACTIVE'].includes((order.status || '').toUpperCase()) ? '#3b82f6' : 
                               '#34d399' 
                      }}>
                        {(order.status || 'Active').replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginTop: '8px' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} /> 12 MIN AGO
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '0.9rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '18px' }}>
                {searchTerm || filterStatus !== 'All' ? 'NO MATCHING RESULTS' : 'NO ACTIVE PIPELINE TASKS FOUND'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="hub-glass-panel" style={{ height: 'fit-content' }}>
            <h3 className="hub-heading" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Fleet Map Preview</h3>
            <div style={{ height: '200px', background: 'rgba(0,0,0,0.3)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 800, fontSize: '0.8rem', border: '2px dashed rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Real-time Map Stream
            </div>
          </div>

          <div className="hub-glass-panel" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <h3 className="hub-heading" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>AI Dispatch Optimization</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, lineHeight: '1.5' }}>
              Autopilot is optimizing 8 routes to minimize transit time and carbon footprint.
            </p>
            <button 
              className="hub-btn" 
              onClick={() => onNavigate('allocation')}
              style={{ width: '100%', marginTop: '1.5rem', background: '#fff', color: '#0f0f1a', fontWeight: 900, borderRadius: '12px', padding: '0.8rem', cursor: 'pointer' }}
            >
              OPEN COMMAND BRIDGE <ArrowUpRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
