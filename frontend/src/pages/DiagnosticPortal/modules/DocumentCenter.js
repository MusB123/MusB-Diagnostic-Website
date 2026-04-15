import React, { useState, useEffect } from 'react';
import { FileText, Download, Upload, Trash2, FileJson, FilePlus } from 'lucide-react';
import { diagnosticAPI } from '../../../services/api';

const DocumentCenter = ({ projectId }) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocs();
    }, [projectId]);

    const fetchDocs = async () => {
        setLoading(true);
        const res = await diagnosticAPI.getDocuments(projectId);
        if (res.ok) setDocs(res.data);
        setLoading(false);
    };

    return (
        <div className="diag-module-card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="module-title mb-0">Document Repository</h3>
                <button className="btn btn-sm btn-primary flex items-center gap-2" onClick={() => alert('Real upload integration requires backend file handling.')}>
                    <Upload size={16} /> Upload New
                </button>
            </div>

            <div className="docs-grid">
                {loading ? (
                    <div className="flex justify-center p-8 opacity-50">Loading documents...</div>
                ) : docs.length > 0 ? (
                    docs.map((doc, idx) => (
                        <div key={idx} className="doc-card glass">
                            <div className="doc-icon">
                                {doc.type === 'PDF' ? <FileText size={24} className="text-red-400" /> : <FileJson size={24} />}
                            </div>
                            <div className="doc-info">
                                <p className="doc-name">{doc.name}</p>
                                <p className="doc-meta">{doc.size} • by {doc.uploaded_by}</p>
                            </div>
                            <div className="doc-actions">
                                <button className="action-icon" title="Download"><Download size={16} /></button>
                                <button className="action-icon text-red-500" title="Delete"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state p-8 text-center opacity-50 border-dashed border-2 rounded-xl">
                        <FilePlus size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No documents found for this project.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .docs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 12px;
                }
                .doc-card {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .doc-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .doc-info {
                    flex: 1;
                    min-width: 0;
                }
                .doc-name {
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .doc-meta {
                    font-size: 11px;
                    opacity: 0.5;
                }
                .doc-actions {
                    display: flex;
                    gap: 8px;
                }
                .action-icon {
                    background: none;
                    border: none;
                    color: white;
                    opacity: 0.5;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .action-icon:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default DocumentCenter;
