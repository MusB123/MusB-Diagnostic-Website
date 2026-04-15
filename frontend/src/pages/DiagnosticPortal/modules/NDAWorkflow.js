import React from 'react';
import { ShieldCheck, Clock, CheckCircle, Download } from 'lucide-react';

const NDAWorkflow = () => {
    const ndaSteps = [
        { label: 'Drafting', status: 'Completed', date: '2026-04-01' },
        { label: 'Partner Review', status: 'Completed', date: '2026-04-03' },
        { label: 'Legal Verification', status: 'In Progress', date: 'Pending' },
        { label: 'Final Execution', status: 'Pending', date: '-' },
    ];

    return (
        <div className="diag-module-card">
            <h3 className="module-title">NDA Workflow & Compliance</h3>
            <div className="flex items-center gap-4 mb-8 bg-secondary/10 p-4 rounded-2xl border border-secondary/20">
                <ShieldCheck size={32} className="text-secondary" />
                <div>
                    <h4 className="font-bold mb-0">Standard Mutual NDA (v2.4)</h4>
                    <p className="text-xs opacity-60">Status: Active Legal Workflow</p>
                </div>
                <button className="btn btn-sm btn-outline ml-auto flex items-center gap-2">
                    <Download size={14} /> Download Template
                </button>
            </div>

            <div className="workflow-steps">
                {ndaSteps.map((step, idx) => (
                    <div key={idx} className={`workflow-step ${step.status.toLowerCase().replace(' ', '-')}`}>
                        <div className="step-point">
                            {step.status === 'Completed' ? <CheckCircle size={16} /> : 
                             step.status === 'In Progress' ? <Clock size={16} /> : 
                             <div className="point-dot" />}
                        </div>
                        <div className="step-body">
                            <span className="step-label">{step.label}</span>
                            <span className="step-status-text">{step.status} • {step.date}</span>
                        </div>
                        {idx < ndaSteps.length - 1 && <div className="step-connect" />}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .workflow-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding-left: 10px;
                }
                .workflow-step {
                    display: flex;
                    gap: 15px;
                    position: relative;
                }
                .step-point {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .workflow-step.completed .step-point {
                    background: var(--diag-stellar-secondary);
                    color: white;
                    border-color: var(--diag-stellar-secondary);
                }
                .workflow-step.in-progress .step-point {
                    background: var(--diag-stellar-primary);
                    color: white;
                    border-color: var(--diag-stellar-primary);
                }
                .step-body {
                    display: flex;
                    flex-direction: column;
                }
                .step-label {
                    font-weight: 600;
                    font-size: 14px;
                }
                .step-status-text {
                    font-size: 11px;
                    opacity: 0.5;
                }
                .step-connect {
                    position: absolute;
                    top: 32px;
                    left: 15px;
                    width: 2px;
                    height: calc(100% - 12px);
                    background: rgba(255,255,255,0.05);
                }
                .workflow-step.completed .step-connect {
                    background: var(--secondary);
                }
            `}</style>
        </div>
    );
};

export default NDAWorkflow;
