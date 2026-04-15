import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Plus } from 'lucide-react';
import { diagnosticAPI } from '../../../services/api';

const Tasks = ({ projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        setLoading(true);
        const res = await diagnosticAPI.getTasks(projectId);
        if (res.ok) setTasks(res.data);
        setLoading(false);
    };

    return (
        <div className="diag-module-card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="module-title mb-0">Action Items</h3>
                <button className="btn-icon-sm" onClick={() => alert('Feature coming soon')}>
                    <Plus size={16} />
                </button>
            </div>

            <div className="tasks-list">
                {loading ? (
                    <div className="flex justify-center p-8 opacity-50">Loading tasks...</div>
                ) : tasks.length > 0 ? (
                    tasks.map((task, idx) => (
                        <div key={idx} className={`task-item ${task.status === 'Completed' ? 'done' : ''}`}>
                            <div className="task-status">
                                {task.status === 'Completed' ? 
                                    <CheckCircle2 size={20} className="text-secondary" /> : 
                                    <Circle size={20} className="text-muted" />}
                            </div>
                            <div className="task-info">
                                <p className="task-title">{task.title}</p>
                                <div className="task-meta">
                                    <span className="due-date"><Clock size={12} /> Due: {task.due_date}</span>
                                    {task.project_id && <span className="pid">#{task.project_id}</span>}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state p-8 text-center opacity-50">No pending tasks for this project.</div>
                )}
            </div>

            <style jsx>{`
                .task-item {
                    display: flex;
                    gap: 15px;
                    padding: 12px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                }
                .task-item:hover {
                    background: rgba(255,255,255,0.06);
                }
                .task-item.done {
                    opacity: 0.6;
                }
                .task-item.done .task-title {
                    text-decoration: line-through;
                }
                .task-title {
                    font-weight: 500;
                    margin-bottom: 2px;
                }
                .task-meta {
                    display: flex;
                    gap: 12px;
                    font-size: 11px;
                    opacity: 0.5;
                    align-items: center;
                }
                .due-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .pid {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default Tasks;
