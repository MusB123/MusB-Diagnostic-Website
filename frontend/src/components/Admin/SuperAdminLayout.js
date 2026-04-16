import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/Admin.css';

const SuperAdminLayout = () => {
    const { adminUser, logout } = useAdminAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/superadmin/login');
    };

    const navGroups = [
        {
            label: 'Main Control',
            items: [
                { path: '/superadmin/dashboard', label: 'Dashboard', icon: '📊' },
                { path: '/superadmin/identity', label: 'Identity & Access', icon: '🔑' },
                { path: '/superadmin/cms', label: 'Website/CMS', icon: '🌐' },
            ]
        },
        {
            label: 'Commerce & Ops',
            items: [
                { path: '/superadmin/commerce', label: 'Catalog Mgt', icon: '🧪' },
                { path: '/superadmin/offers', label: 'Offers Engine', icon: '🏷️' },
                { path: '/superadmin/phlebotomy', label: 'Phlebotomy Mgt', icon: '🩸' },
            ]
        },
        {
            label: 'System & CRM',
            items: [
                { path: '/superadmin/integrations', label: 'Integrations', icon: '🔌' },
                { path: '/superadmin/crm', label: 'CRM / Marketing', icon: '📈' },
                { path: '/superadmin/portals', label: 'Portals Mgt', icon: '🏢' },
            ]
        }
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    MusB ADMIN
                </div>
                <nav className="admin-nav">
                    {navGroups.map((group, gIdx) => (
                        <div key={gIdx} className="admin-nav-group">
                            <div className="admin-nav-label">{group.label}</div>
                            {group.items.map((item, iIdx) => (
                                <NavLink 
                                    key={iIdx} 
                                    to={item.path} 
                                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <span style={{ marginRight: '12px' }}>{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--admin-border)' }}>
                    <button onClick={handleLogout} className="action-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-search">
                        <input 
                            type="text" 
                            placeholder="Search anything..." 
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--admin-border)',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 1rem',
                                color: 'white',
                                width: '300px'
                            }} 
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="admin-notif" style={{ cursor: 'pointer' }}>🔔</div>
                        <div className="admin-user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{adminUser?.name || 'Admin'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Super Admin</div>
                            </div>
                            <div style={{ width: '36px', height: '36px', background: 'var(--admin-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.2rem' }}>
                                👤
                            </div>
                        </div>
                    </div>
                </header>
                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
