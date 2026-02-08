import React, { useState, useEffect } from 'react';
import { Plus, Search, Trophy, Trash2, RefreshCw, Edit } from 'lucide-react';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminLeaderboard = () => {
    const navigate = useNavigate();
    const [contestants, setContestants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Real-time Contestants Listener
    useEffect(() => {
        const q = query(collection(db, "contestants"), orderBy("points", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContestants(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching contestants: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    // Delete Contestant
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contestant?")) return;
        try {
            await deleteDoc(doc(db, "contestants", id));
        } catch (error) {
            console.error("Error deleting contestant: ", error);
            alert("Error deleting contestant.");
        }
    };

    const filteredContestants = contestants.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.platformHandle && c.platformHandle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Contestants</h1>
                    {loading && <RefreshCw className="spin" size={20} color="var(--accent)" />}
                </div>
                <button
                    onClick={() => navigate('/admin/contestants/new')}
                    style={{
                        background: 'var(--accent)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}>
                    <Plus size={18} /> Add Contestant
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '2rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                <input
                    type="text"
                    placeholder="Search contestants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        padding: '0.8rem 1rem 0.8rem 3rem',
                        color: '#fff',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Table */}
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#27272a', color: '#a1a1aa', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '1rem' }}>Rank</th>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Handle</th>
                            <th style={{ padding: '1rem' }}>Points</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContestants.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#71717a' }}>
                                    {loading ? "Loading contestants..." : "No contestants found."}
                                </td>
                            </tr>
                        ) : (
                            filteredContestants.map((contestant, index) => (
                                <tr key={contestant.id} style={{ borderBottom: '1px solid #27272a' }}>
                                    <td style={{ padding: '1rem', color: '#a1a1aa' }}>#{index + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{contestant.name}</td>
                                    <td style={{ padding: '1rem', color: '#a1a1aa' }}>@{contestant.platformHandle}</td>
                                    <td style={{ padding: '1rem', color: 'var(--accent)' }}>{contestant.points}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/admin/contestants/edit/${contestant.id}`)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginRight: '1rem' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contestant.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminLeaderboard;
