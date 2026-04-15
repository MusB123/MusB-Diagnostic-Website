import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, FileText, ExternalLink, Calendar } from 'lucide-react';
import { researchAPI } from '../../../services/api';

const SubmissionsInbox = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        // Using existing validation tracker as the inbox source
        const res = await researchAPI.getValidationTracker();
        if (res.ok) setSubmissions(res.data);
        setLoading(false);
    };

    return (
        <div className="diag-module-card">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="module-title mb-1">Submissions Inbox</h3>
                    <p className="text-sm opacity-50">Review incoming technology briefs from prospective partners.</p>
                </div>
                <div className="flex gap-2">
                    <span className="badge badge-primary">{submissions.filter(s => s.status === 'Intake').length} New</span>
                </div>
            </div>

            <div className="inbox-list">
                {loading ? (
                    <div className="p-8 text-center opacity-50">Loading inbox...</div>
                ) : submissions.length > 0 ? (
                    submissions.map((sub, idx) => (
                        <div key={idx} className="inbox-item glass">
                            <div className="inbox-status-line">
                                <span className={`status-dot ${sub.status === 'Intake' ? 'new' : ''}`}></span>
                            </div>
                            <div className="inbox-content">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="tech-name">{sub.name}</h5>
                                    <span className="timestamp flex items-center gap-1">
                                        <Calendar size={12} /> {sub.date || sub.created_at?.split('T')[0] || 'Recently'}
                                    </span>
                                </div>
                                <p className="sender-info">From: {sub.email || 'Dr. Scientist (Lead)'}</p>
                                <div className="inbox-actions mt-4 flex gap-3">
                                    <button className="btn btn-xs btn-primary flex items-center gap-2">
                                        <CheckCircle size={14} /> Approve for Feasibility
                                    </button>
                                    <button className="btn btn-xs btn-outline flex items-center gap-2">
                                        <FileText size={14} /> Review Brief
                                    </button>
                                    <button className="btn btn-xs btn-outline flex items-center gap-2 border-red-500/30 text-red-400">
                                        <XCircle size={14} /> Decline
                                    </button>
                                </div>
                            </div>
                            <button className="external-link-btn" title="View Details">
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="empty-state p-12 text-center opacity-30">
                        <Mail size={48} className="mx-auto mb-4" />
                        <p>No technology briefs in the inbox.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .inbox-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .inbox-item {
                    display: flex;
                    padding: 18px;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                    transition: border 0.3s ease;
                }
                .inbox-item:hover {
                    border-color: var(--diag-stellar-primary);
                }
                .inbox-status-line {
                    width: 20px;
                    display: flex;
                    justify-content: center;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                }
                .status-dot.new {
                    background: var(--diag-stellar-primary);
                    box-shadow: 0 0 10px var(--diag-stellar-primary);
                }
                .inbox-content {
                    flex: 1;
                    padding-left: 10px;
                }
                .tech-name {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0;
                }
                .sender-info {
                    font-size: 13px;
                    opacity: 0.6;
                    margin: 0;
                }
                .timestamp {
                    font-size: 11px;
                    opacity: 0.4;
                }
                .external-link-btn {
                    background: none;
                    border: none;
                    color: white;
                    opacity: 0.2;
                    cursor: pointer;
                    align-self: flex-start;
                }
                .inbox-item:hover .external-link-btn {
                    opacity: 0.7;
                }
                .btn-xs {
                    padding: 4px 10px;
                    font-size: 11px;
                    height: auto;
                }
                .badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default SubmissionsInbox;
