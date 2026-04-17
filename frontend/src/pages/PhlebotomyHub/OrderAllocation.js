import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, User, 
  MapPin, Clock, Zap, Target
} from 'lucide-react';
import api from '../../api/api';
import './HubPortal.css';

const OrderAllocation = () => {
  const [orders, setOrders] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, fleetRes] = await Promise.all([
          api.get('/api/phleb/hubs/dashboard/'),
          api.get('/api/phleb/hubs/fleet/')
        ]);
        setOrders(ordersRes.data.pipeline);
        setFleet(fleetRes.data);
      } catch (err) {
        console.error("Failed to fetch data for allocation", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (orderId, phlebId) => {
    try {
      await api.post('/api/phleb/hubs/assign/', { order_id: orderId, phleb_id: phlebId });
      const res = await api.get('/api/phleb/hubs/dashboard/');
      setOrders(res.data.pipeline);
    } catch (err) {
      alert('Assignment failed');
    }
  };

  if (loading) return <div style={{ color: '#818cf8', fontWeight: 800 }}>LOADING OPERATIONAL QUEUE...</div>;

  return (
    <div className="hub-allocation">
      <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 className="hub-heading" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0 }}>Dispatch Center</h2>
          <p className="hub-subheading" style={{ color: '#94a3b8', fontWeight: 700, marginTop: '8px' }}>Allocating Patient Requests to Field Operatives</p>
        </div>
        <button 
          className="hub-btn" 
          onClick={async () => {
            try {
              await api.post('/api/phleb/hubs/auto-allocate/');
              const res = await api.get('/api/phleb/hubs/dashboard/');
              setOrders(res.data.pipeline);
            } catch (err) {
              alert(err.response?.data?.error || 'Auto-allocation failed');
            }
          }}
          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Zap size={18} /> AUTO-ALLOCATE ALL
        </button>
      </div>

      <div className="hub-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Incoming Queue</h3>
          {orders.filter(o => o.status === 'Pending').map((order, idx) => (
            <motion.div 
              key={idx} 
              className="hub-glass-panel" 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              style={{ padding: '2rem' }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900, fontSize: '1.2rem', color: '#fff' }}>
                    {order.id} <span style={{ fontWeight: 500, color: '#64748b' }}>| {order.patient}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 800, marginTop: '6px' }}>CORE BIOMARKER PANEL</div>
                </div>
                <div style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 900, background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  URGENT PRIORITY
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                  <MapPin size={16} color="#6366f1" /> {order.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Clock size={16} color="#6366f1" /> EST: 45 MIN
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Available Specialists:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {fleet.map((phleb, pIdx) => (
                    <button 
                      key={pIdx}
                      className="hub-btn" 
                      onClick={() => handleAssign(order.id, phleb.id)}
                      style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800 }}
                    >
                      {phleb.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {orders.filter(o => o.status === 'Pending').length === 0 && (
            <div className="hub-glass-panel" style={{ textAlign: 'center', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckCircle size={60} color="#10b981" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>ALL CLEAR</div>
              <p style={{ color: '#475569', fontWeight: 700, marginTop: '8px' }}>Queue is empty. Active monitoring engaged.</p>
            </div>
          )}
        </div>

        <div>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Active Logs</h3>
           <div className="hub-glass-panel" style={{ padding: '1.5rem' }}>
            {orders.filter(o => o.status !== 'Pending').map((order, idx) => (
              <div key={idx} style={{ padding: '1.2rem 0', borderBottom: idx !== orders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontWeight: 900, color: '#fff' }}>{order.phlebotomist_name || order.id}</div>
                   <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{order.status}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px', fontWeight: 700 }}>
                  <User size={14} color="#818cf8" /> {order.patient}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px', fontWeight: 700 }}>
                  <Target size={14} color="#818cf8" /> ETA: 14:30 SECTOR 4
                </div>
              </div>
            ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrderAllocation;
