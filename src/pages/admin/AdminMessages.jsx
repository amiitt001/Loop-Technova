import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { Trash2, Mail, MailOpen, AlertCircle, Search } from 'lucide-react';
import { safeRender, safeHref } from '../../utils/security';

const AdminMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            try {
                await deleteDoc(doc(db, "messages", id));
            } catch (error) {
                console.error("Error deleting message:", error);
                alert("Failed to delete message");
            }
        }
    };

    const toggleReadStatus = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, "messages", id), {
                read: !currentStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString() + ' ' +
            new Date(timestamp.seconds * 1000).toLocaleTimeString();
    };

    return (
        <div className="text-main">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--neon-purple)] bg-clip-text text-transparent">
                        Messages ({messages.length})
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage contact form submissions</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)] text-main"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
                </div>
            ) : filteredMessages.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 flex flex-col items-center">
                    <Mail size={48} className="mb-4 opacity-50" />
                    <p>No messages found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-zinc-900/80 border rounded-xl p-6 transition-all duration-300 ${msg.read ? 'border-zinc-800 opacity-75' : 'border-[var(--accent)]/30 shadow-[0_0_15px_rgba(0,255,255,0.05)]'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${msg.read ? 'bg-zinc-800 text-zinc-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                                        {msg.read ? <MailOpen size={20} /> : <Mail size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-main">{safeRender(msg.name, "Invalid Name")}</h3>
                                        <a href={safeHref(`mailto:${msg.email}`)} className="text-[var(--accent)] hover:underline text-sm">
                                            {safeRender(msg.email, "Invalid Email")}
                                        </a>
                                        <div className="text-xs text-zinc-500 mt-1">
                                            {formatDate(msg.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleReadStatus(msg.id, msg.read)}
                                        className="p-2 text-zinc-400 hover:text-main hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                                        title={msg.read ? "Mark as Unread" : "Mark as Read"}
                                    >
                                        {msg.read ? <Mail size={18} /> : <MailOpen size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(msg.id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                        title="Delete Message"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg bg-main/40 border border-zinc-800/50 text-zinc-300 whitespace-pre-wrap ${!msg.read && 'text-zinc-100'}`}>
                                {safeRender(msg.message, "Invalid Content")}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMessages;
