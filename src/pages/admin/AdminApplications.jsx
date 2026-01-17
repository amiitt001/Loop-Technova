import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Check, X, Trash2, Mail, Github, GraduationCap } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const AdminApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        // Order by date desc
        const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching applications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filtered = applications.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this application?")) return;
        try {
            await deleteDoc(doc(db, "applications", id));
        } catch (error) {
            console.error("Error deleting application:", error);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "applications", id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Membership Applications</h1>
                    {loading && <RefreshCw className="animate-spin text-[var(--neon-violet)]" size={20} />}
                </div>
                <div className="relative w-full md:w-auto">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-[300px] bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-10 pr-4 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {!loading && filtered.length === 0 && <p className="text-zinc-500 text-center py-8">No applications found.</p>}

                {filtered.map((app) => (
                    <div key={app.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.status === 'Approved' ? 'bg-green-500' :
                                app.status === 'Rejected' ? 'bg-red-500' : 'bg-[var(--neon-cyan)]'
                            }`} />

                        <div className="flex-1 pl-2">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold">{app.name}</h3>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-[var(--neon-violet)] border border-zinc-700">
                                    {app.domain}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} />
                                    <a href={`mailto:${app.email}`} className="hover:text-white transition-colors">{app.email}</a>
                                </div>
                                {(app.branch || app.year) && (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={14} />
                                        <span>{app.branch || 'Unknown'} - {app.year || ''}</span>
                                    </div>
                                )}
                                {app.github && (
                                    <div className="flex items-center gap-2">
                                        <Github size={14} />
                                        <a href={app.github} target="_blank" rel="noopener noreferrer" className="text-[var(--neon-cyan)] hover:underline">GitHub Profile</a>
                                    </div>
                                )}
                            </div>

                            {app.college && (
                                <p className="text-sm text-zinc-500 mb-4 font-medium">
                                    {app.college}
                                </p>
                            )}

                            <div className="bg-zinc-950 p-4 rounded-lg text-zinc-300 text-sm leading-relaxed border border-zinc-800/50">
                                {app.reason}
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 md:border-l md:border-zinc-800 md:pl-6 justify-end items-stretch min-w-[120px]">
                            {app.status === 'Pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(app.id, 'Approved')}
                                        title="Approve"
                                        className="flex-1 bg-green-500/10 text-green-500 border border-green-500/20 p-2 rounded-lg hover:bg-green-500/20 transition-colors flex justify-center items-center"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(app.id, 'Rejected')}
                                        title="Reject"
                                        className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 p-2 rounded-lg hover:bg-red-500/20 transition-colors flex justify-center items-center"
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            )}

                            {app.status !== 'Pending' && (
                                <span className={`
                                    text-center text-xs font-bold py-2 px-3 rounded-lg mb-0 md:mb-2
                                    ${app.status === 'Approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                                `}>
                                    {app.status}
                                </span>
                            )}

                            <button
                                onClick={() => handleDelete(app.id)}
                                title="Delete"
                                className="bg-transparent text-zinc-500 border border-zinc-800 p-2 rounded-lg hover:text-white hover:border-zinc-600 transition-colors flex justify-center items-center mt-auto"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminApplications;
