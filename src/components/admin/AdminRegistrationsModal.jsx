import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Download, Search } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const AdminRegistrationsModal = ({ event, onClose }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!event) return;
        // Query registrations for this specific event
        const q = query(
            collection(db, "registrations"),
            where("eventId", "==", event.id)
            // Note: Compound queries with orderBy might require an index. 
            // If it fails, remove orderBy and sort client-side.
            // keeping it simple first.
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by date descending (newest first)
            list.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            setRegistrations(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching registrations:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [event]);

    const filtered = registrations.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = () => {
        // Simple CSV Export
        const headers = ["Name", "Email", "Enrollment ID", "Department", "Team Name", "Registered At"];

        // Prevent CSV/Formula Injection
        const sanitizeCSV = (value) => {
            if (value === null || value === undefined) return "";
            const strVal = String(value);
            if (/^[\s]*[=+\-@\t\r\n]/.test(strVal)) {
                return "'" + strVal;
            }
            return strVal;
        };

        const rows = filtered.map(r => [
            sanitizeCSV(r.name),
            sanitizeCSV(r.email),
            sanitizeCSV(r.enrollmentId),
            sanitizeCSV(r.department),
            sanitizeCSV(r.teamName || "-"),
            sanitizeCSV(r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : "N/A")
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(item => `"${item}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${event.title}_Registrations.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {event && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 10000
                        }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '100%',
                            maxWidth: '800px', // Wider for table
                            height: '100%',
                            background: '#18181b',
                            borderLeft: '1px solid #27272a',
                            zIndex: 10001,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #27272a',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#27272a'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Registrations</h2>
                                <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{event.title}</p>
                            </div>
                            <button onClick={onClose} style={{
                                background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer'
                            }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Controls */}
                        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                                <input
                                    type="text"
                                    placeholder="Search registrations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#09090b',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={filtered.length === 0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    opacity: filtered.length === 0 ? 0.5 : 1
                                }}
                            >
                                <Download size={16} /> Export CSV
                            </button>
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1.5rem' }}>
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                    <RefreshCw className="spin" color="var(--accent)" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>No registrations found.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>Name</th>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>Email</th>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>ID</th>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>Dept</th>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>Team</th>
                                            <th style={{ padding: '0.75rem', fontWeight: '500' }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((reg) => (
                                            <tr key={reg.id} style={{ borderBottom: '1px solid #27272a', color: '#fff' }}>
                                                <td style={{ padding: '0.75rem' }}>{reg.name}</td>
                                                <td style={{ padding: '0.75rem', color: '#a1a1aa' }}>{reg.email}</td>
                                                <td style={{ padding: '0.75rem' }}>{reg.enrollmentId}</td>
                                                <td style={{ padding: '0.75rem', color: '#a1a1aa' }}>{reg.department}</td>
                                                <td style={{ padding: '0.75rem' }}>{reg.teamName || '-'}</td>
                                                <td style={{ padding: '0.75rem', color: '#71717a', fontSize: '0.8rem' }}>
                                                    {reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </AnimatePresence>
    );
};

export default AdminRegistrationsModal;
