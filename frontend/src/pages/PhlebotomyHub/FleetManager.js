import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Search, 
  MoreVertical, ShieldCheck, MapPin
} from 'lucide-react';
import api from '../../api/api';
import './HubPortal.css';

const FleetManager = () => {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSpec, setNewSpec] = useState({ name: '', email: '', phone: '', location: 'Sector 7' });

  const fetchFleet = async () => {
    try {
      const res = await api.get('/api/phleb/hubs/fleet/');
      setFleet(res.data);
    } catch (err) {
      console.error("Failed to fetch fleet", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/phleb/hubs/register-specialist/', newSpec);
      setShowModal(false);
      setNewSpec({ name: '', email: '', phone: '', location: 'Sector 7' });
      fetchFleet();
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  if (loading) return <div style={{ color: '#818cf8', fontWeight: 800, padding: '2rem' }}>UPLOADING FLEET DATA...</div>;

  return (
    <div className="hub-fleet-manager">
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#161625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '3rem', width: '100%', maxWidth: '500px' }}
            >
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem' }}>Register Operative</h2>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input 
                  type="text" placeholder="Full Name" required
                  value={newSpec.name} onChange={e => setNewSpec({...newSpec, name: e.target.value})}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', fontWeight: 600 }}
                />
                <input 
                  type="email" placeholder="Email Address" required
                  value={newSpec.email} onChange={e => setNewSpec({...newSpec, email: e.target.value})}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', fontWeight: 600 }}
                />
                <input 
                  type="text" placeholder="Phone Number" required
                  value={newSpec.phone} onChange={e => setNewSpec({...newSpec, phone: e.target.value})}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', fontWeight: 600 }}
                />
                <select 
                  value={newSpec.location} onChange={e => setNewSpec({...newSpec, location: e.target.value})}
                  style={{ background: '#161625', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', fontWeight: 600 }}
                >
                  <option>Sector 7</option>
                  <option>Sector 4</option>
                  <option>Northern Hub</option>
                  <option>Eastern Sector</option>
                </select>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontWeight: 800 }}>Cancel</button>
                  <button type="submit" style={{ flex: 2, padding: '1rem', borderRadius: '12px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 900 }}>Register Specialist</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-between hub-header-responsive">
        <div>
          <h2 className="hub-heading" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>Active Specialists</h2>
          <p className="hub-subheading" style={{ color: '#94a3b8', fontWeight: 700, marginTop: '8px' }}>Overseeing {fleet.length} Field Operatives</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
             <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
             <input 
                type="text" 
                placeholder="Search fleet..." 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.8rem 1rem 0.8rem 2.5rem', color: '#fff', width: '250px', fontWeight: 600 }}
             />
          </div>
          <button 
            className="hub-btn" 
            onClick={() => setShowModal(true)}
            style={{ background: '#6366f1', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <UserPlus size={18} /> REGISTER OPERATIVE
          </button>
        </div>
      </div>

      <div className="hub-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '1.5rem', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Specialist</th>
              <th style={{ padding: '1.5rem', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '1.5rem', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Deployment</th>
              <th style={{ padding: '1.5rem', fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Success Rate</th>
              <th style={{ padding: '1.5rem', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((phleb, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.9rem' }}>
                      {phleb.name?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{phleb.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={12} /> CERTIFIED OPERATIVE
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '8px', background: phleb.is_online ? '#10b981' : '#f43f5e', borderRadius: '50%', boxShadow: phleb.is_online ? '0 0 10px #10b981' : 'none' }}></div>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800, textTransform: 'uppercase' }}>{phleb.is_online ? 'Active' : 'Offline'}</span>
                  </div>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', opacity: 0.9, fontWeight: 700, fontSize: '0.9rem' }}>
                    <MapPin size={14} color="#6366f1" /> {phleb.location || 'TRI-STATE SECTOR'}
                  </div>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>98.2%</div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>+0.4% GAIN</div>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
};

export default FleetManager;
