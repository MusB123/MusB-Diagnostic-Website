import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Shield } from 'lucide-react';
import { diagnosticAPI } from '../../../services/api';

const Messenger = ({ projectId, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [projectId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        const res = await diagnosticAPI.getMessages(projectId);
        if (res.ok) setMessages(res.data);
        setLoading(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const res = await diagnosticAPI.sendMessage({
            project_id: projectId,
            text: newMessage
        });

        if (res.ok) {
            setNewMessage('');
            fetchMessages();
        }
    };

    return (
        <div className="diag-module-card flex flex-col h-[500px]">
            <h3 className="module-title">Messages</h3>
            
            <div className="chat-window flex-1 overflow-y-auto pr-2 mb-4" ref={scrollRef}>
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUser.name;
                    return (
                        <div key={idx} className={`chat-bubble-wrap ${isMe ? 'sent' : 'received'}`}>
                            <div className="bubble-info">
                                <span className="sender">{msg.sender}</span>
                                <span className="time">{msg.created_at?.split('T')[1]?.substring(0, 5)}</span>
                            </div>
                            <div className="chat-bubble shadow-lg">
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} className="chat-input-wrap">
                <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                    <Send size={18} />
                </button>
            </form>

            <style jsx>{`
                .chat-window::-webkit-scrollbar {
                    width: 4px;
                }
                .chat-window::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }
                .chat-bubble-wrap {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 15px;
                    max-width: 80%;
                }
                .chat-bubble-wrap.sent {
                    margin-left: auto;
                    align-items: flex-end;
                }
                .chat-bubble-wrap.received {
                    margin-right: auto;
                    align-items: flex-start;
                }
                .bubble-info {
                    font-size: 10px;
                    margin-bottom: 4px;
                    opacity: 0.5;
                    display: flex;
                    gap: 8px;
                }
                .chat-bubble {
                    padding: 10px 14px;
                    border-radius: 16px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .sent .chat-bubble {
                    background: var(--diag-stellar-primary);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .received .chat-bubble {
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border-bottom-left-radius: 4px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .chat-input-wrap {
                    display: flex;
                    gap: 10px;
                    background: rgba(255,255,255,0.05);
                    padding: 6px;
                    border-radius: 30px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .chat-input-wrap input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    outline: none;
                    font-size: 14px;
                }
                .send-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--secondary);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .send-btn:hover:not(:disabled) {
                    transform: scale(1.1);
                }
                .send-btn:disabled {
                    opacity: 0.3;
                    cursor: default;
                }
            `}</style>
        </div>
    );
};

export default Messenger;
