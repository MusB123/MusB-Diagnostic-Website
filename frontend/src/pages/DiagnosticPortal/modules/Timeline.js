import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Timeline = ({ projects }) => {
    const phases = ['Intake', 'Feasibility', 'Analytical Validation', 'Pilot Clinical Testing'];

    return (
        <div className="diag-module-card">
            <h3 className="module-title">Project Status Timeline</h3>
            <div className="timeline-container">
                {projects.map((project, pIdx) => (
                    <div key={pIdx} className="project-timeline-row mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-lg">{project.name}</span>
                            <span className="text-sm opacity-70">Project ID: {project.project_id}</span>
                        </div>
                        <div className="timeline-track">
                            {phases.map((phase, idx) => {
                                const isCompleted = phases.indexOf(project.status) > idx;
                                const isCurrent = project.status === phase;
                                return (
                                    <div key={idx} className={`timeline-step ${isCompleted ? 'completed' : isCurrent ? 'current' : ''}`}>
                                        <div className="step-node shadow-glow">
                                            {isCompleted ? <CheckCircle size={16} /> : 
                                             isCurrent ? <Clock size={16} className="animate-spin-slow" /> : 
                                             <div className="node-dot" />}
                                        </div>
                                        <div className="step-label">{phase}</div>
                                        {idx < phases.length - 1 && <div className="step-connector" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            <style jsx>{`
                .timeline-track {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    padding-top: 20px;
                }
                .timeline-step {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 1;
                }
                .step-node {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 8px;
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: all 0.3s ease;
                }
                .timeline-step.completed .step-node {
                    background: var(--diag-stellar-secondary);
                    color: white;
                    border-color: var(--diag-stellar-secondary);
                }
                .timeline-step.current .step-node {
                    background: var(--diag-stellar-primary);
                    color: white;
                    border-color: var(--diag-stellar-primary);
                }
                .step-label {
                    font-size: 11px;
                    font-weight: 600;
                    text-align: center;
                    opacity: 0.6;
                }
                .timeline-step.current .step-label,
                .timeline-step.completed .step-label {
                    opacity: 1;
                }
                .step-connector {
                    position: absolute;
                    top: 16px;
                    left: 50%;
                    width: 100%;
                    height: 2px;
                    background: rgba(255,255,255,0.1);
                    z-index: -1;
                }
                .timeline-step.completed .step-connector {
                    background: var(--secondary);
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Timeline;
