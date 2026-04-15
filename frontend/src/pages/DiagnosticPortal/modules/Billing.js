import React, { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle, Clock, Receipt } from 'lucide-react';
import { diagnosticAPI } from '../../../services/api';

const Billing = ({ projectId }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        const res = await diagnosticAPI.getInvoices(projectId);
        if (res.ok) setInvoices(res.data);
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return (
        <div className="diag-module-card">
            <h3 className="module-title">Milestones & Billing</h3>
            
            <div className="invoices-list">
                {loading ? (
                    <div className="flex justify-center p-8 opacity-50">Loading billing data...</div>
                ) : invoices.length > 0 ? (
                    invoices.map((inv, idx) => (
                        <div key={idx} className="invoice-item glass">
                            <div className={`status-icon ${inv.status.toLowerCase()}`}>
                                {inv.status === 'Paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="invoice-info">
                                <p className="milestone-name">{inv.milestone}</p>
                                <p className="invoice-date">Due: {inv.due_date}</p>
                            </div>
                            <div className="invoice-amount">
                                <span className="amount">{inv.amount}</span>
                                <span className={`status-tag ${inv.status.toLowerCase()}`}>{inv.status}</span>
                            </div>
                            <button className="download-btn" title="Download Invoice">
                                <Download size={16} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="empty-state p-8 text-center opacity-50">No invoices generated yet.</div>
                )}
            </div>

            <div className="billing-summary mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                    <Receipt className="text-primary" />
                    <span className="font-bold">Total Project Value</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold">$15,000.00</span>
                    <span className="text-sm opacity-60">Next Payment: $5,000.00</span>
                </div>
            </div>

            <style jsx>{`
                .invoice-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    margin-bottom: 10px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .status-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .status-icon.paid { background: rgba(var(--secondary-rgb), 0.2); color: var(--secondary); }
                .status-icon.sent { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
                
                .invoice-info { flex: 1; }
                .milestone-name { font-weight: 600; font-size: 15px; }
                .invoice-date { font-size: 12px; opacity: 0.5; }
                
                .invoice-amount { text-align: right; margin-right: 15px; }
                .amount { display: block; font-weight: 700; font-size: 16px; }
                .status-tag { font-size: 10px; text-transform: uppercase; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
                .status-tag.paid { background: var(--secondary); color: white; }
                .status-tag.sent { background: #ffaa00; color: black; }
                
                .download-btn {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .download-btn:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default Billing;
