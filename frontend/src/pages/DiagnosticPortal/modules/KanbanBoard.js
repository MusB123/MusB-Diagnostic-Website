import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ChevronRight, MoreVertical, Plus, ListFilter } from 'lucide-react';
import { diagnosticAPI } from '../../../services/api';

const KanbanBoard = () => {
    const columns = ['Intake', 'Feasibility', 'Analytical Validation', 'Pilot Clinical Testing'];
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        setLoading(true);
        const res = await diagnosticAPI.getPipeline();
        if (res.ok) setProjects(res.data);
        setLoading(false);
    };

    const handleStatusChange = async (projectId, newStatus) => {
        const res = await diagnosticAPI.updatePipeline({
            project_id: projectId,
            status: newStatus
        });
        if (res.ok) fetchPipeline();
    };

    return (
        <div className="kanban-wrapper">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="module-title mb-1">Project Pipeline</h3>
                    <p className="text-sm opacity-50">Manage validation workflow across all active partners.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-sm btn-outline flex items-center gap-2"><ListFilter size={16} /> Filter</button>
                    <button className="btn btn-sm btn-primary flex items-center gap-2"><Plus size={16} /> New Project</button>
                </div>
            </div>

            <div className="kanban-board">
                {columns.map((col, cIdx) => (
                    <div key={cIdx} className="kanban-column">
                        <div className="column-header">
                            <span className="column-count">{projects.filter(p => p.status === col).length}</span>
                            <h4>{col}</h4>
                        </div>
                        <div className="column-cards">
                            {projects.filter(p => p.status === col).map((project, pIdx) => (
                                <motion.div 
                                    layoutId={project.project_id}
                                    key={project.project_id} 
                                    className="kanban-card glass shadow-xl"
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="project-id">{project.project_id}</span>
                                        <button className="opacity-40 hover:opacity-100"><MoreVertical size={16} /></button>
                                    </div>
                                    <h5 className="project-name">{project.name}</h5>
                                    <div className="progress-mini mt-3">
                                        <div className="flex justify-between text-[10px] mb-1 opacity-60">
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="fill" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="card-footer mt-4 flex justify-between items-center">
                                        <div className="avatar-group flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-primary border border-white/20 text-[10px] flex items-center justify-center">JD</div>
                                        </div>
                                        <select 
                                            className="status-selector"
                                            value={project.status}
                                            onChange={(e) => handleStatusChange(project.project_id, e.target.value)}
                                        >
                                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    overflow-x: auto;
                    min-height: 600px;
                }
                .kanban-column {
                    background: rgba(255,255,255,0.02);
                    border-radius: 16px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    min-width: 250px;
                }
                .column-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 15px;
                }
                .column-count {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .column-header h4 {
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0;
                    opacity: 0.8;
                }
                .kanban-card {
                    padding: 15px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 12px;
                }
                .project-id {
                    font-size: 10px;
                    font-family: monospace;
                    background: var(--diag-stellar-primary);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .project-name {
                    font-size: 15px;
                    font-weight: 600;
                    margin: 0;
                }
                .progress-bar {
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .progress-bar .fill {
                    height: 100%;
                    background: var(--secondary);
                }
                .status-selector {
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    font-size: 10px;
                    border-radius: 4px;
                    padding: 2px 4px;
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default KanbanBoard;
