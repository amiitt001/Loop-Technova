import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Check, X, Trash2, Mail, Github, GraduationCap, ExternalLink } from 'lucide-react';
import { safeRender } from '../../utils/security';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

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

        const appToDelete = applications.find(a => a.id === id);

        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, "applications", id));

            // 2. Delete from Google Sheet (Fire and Forget)
            if (appToDelete && appToDelete.email && import.meta.env.VITE_GOOGLE_SHEET_URL) {
                const params = new URLSearchParams();
                params.append('action', 'delete');
                params.append('email', appToDelete.email);

                fetch(import.meta.env.VITE_GOOGLE_SHEET_URL, {
                    method: 'POST',
                    body: params,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    mode: 'no-cors'
                }).catch(err => console.error("Sheet delete error:", err));
            }

            // No need to alert success, the real-time listener will update the UI
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("Failed to delete application. Check your permissions.");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "applications", id), {
                status: newStatus
            });

            // Sync Status to Google Sheet (Fire and Forget)
            const app = applications.find(a => a.id === id);
            if (app && app.email && import.meta.env.VITE_GOOGLE_SHEET_URL) {
                const params = new URLSearchParams();
                params.append('action', 'updateStatus');
                params.append('email', app.email);
                params.append('status', newStatus);

                fetch(import.meta.env.VITE_GOOGLE_SHEET_URL, {
                    method: 'POST',
                    body: params,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    mode: 'no-cors'
                }).catch(err => console.error("Sheet status sync error:", err));
            }

            // If approved, add to members collection
            if (newStatus === 'Approved') {
                if (app) {
                    await addDoc(collection(db, "members"), {
                        name: app.name,
                        email: app.email,
                        role: "Member", // This puts them in 'General Members' section
                        branch: app.branch,
                        year: app.year,
                        domain: app.domain,
                        college: app.college,
                        social: {
                            github: app.github || '',
                            linkedin: '',
                        },
                        createdAt: serverTimestamp()
                    });
                    alert("Application Approved! Added to Members list.");
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status. Check your permissions.");
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Membership Applications</h1>
                    <h1 className="text-2xl md:text-3xl font-bold">Membership Applications</h1>
                    {loading && <RefreshCw className="animate-spin text-[var(--neon-violet)]" size={20} />}
                    <a
                        href={import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            if (!import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL) {
                                e.preventDefault();
                                alert("Please set VITE_GOOGLE_SHEET_VIEW_URL in your .env file to the Google Sheet URL.");
                            }
                        }}
                        className="flex items-center gap-2 bg-green-600/20 text-green-500 border border-green-600/50 px-3 py-1.5 rounded-lg hover:bg-green-600/30 transition-colors text-sm font-medium"
                    >
                        <ExternalLink size={16} /> View Sheet
                    </a>
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
                                <h3 className="text-lg font-bold">{safeRender(app.name, "Invalid Name")}</h3>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-[var(--neon-violet)] border border-zinc-700">
                                    {safeRender(app.domain)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} />
                                    <a href={`mailto:${app.email}`} className="hover:text-white transition-colors">
                                        {safeRender(app.email)}
                                    </a>
                                </div>
                                {(app.branch || app.year) && (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={14} />
                                        <span>{safeRender(app.branch)} - {safeRender(app.year)}</span>
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
                                    {safeRender(app.college)}
                                </p>
                            )}

                            <div className="bg-zinc-950 p-4 rounded-lg text-zinc-300 text-sm leading-relaxed border border-zinc-800/50 break-words">
                                {safeRender(app.reason, "Content hidden for security reasons.")}
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
