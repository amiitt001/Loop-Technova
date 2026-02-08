import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Trophy, Globe, RefreshCw } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminEditContestant = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        platformHandle: '',
        points: 0,
        contestName: ''
    });

    useEffect(() => {
        const fetchContestant = async () => {
            try {
                const docRef = doc(db, "contestants", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        name: data.name || '',
                        platformHandle: data.platformHandle || '',
                        points: data.points || 0,
                        contestName: data.contestName || ''
                    });
                } else {
                    alert("Contestant not found!");
                    navigate('/admin/contestants');
                }
            } catch (error) {
                console.error("Error fetching contestant:", error);
                alert("Error fetching contestant data.");
            } finally {
                setLoading(false);
            }
        };

        fetchContestant();
    }, [id, navigate]);

    const handleChange = (e) => {
        const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Get Firebase ID token for authentication
            const user = auth.currentUser;
            if (!user) {
                throw new Error('Not authenticated');
            }
            const idToken = await user.getIdToken();

            // Call backend API endpoint
            const response = await fetch(`/api/admin/contestants?id=${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update contestant');
            }

            alert("Contestant Updated Successfully!");
            navigate('/admin/contestants');
        } catch (error) {
            console.error("Error updating contestant: ", error);
            alert("Error updating contestant: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <RefreshCw className="spin" size={40} style={{ color: 'var(--accent)' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/admin/contestants')}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}>
                <ArrowLeft size={18} /> Back to Contestants
            </button>

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#fff' }}>Edit Contestant</h1>

            <form onSubmit={handleSubmit} style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                {/* Name */}
                <div className="form-group">
                    <label style={labelStyle}><User size={14} /> Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Alex Smith"
                        style={inputStyle}
                    />
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Handle */}
                    <div className="form-group">
                        <label style={labelStyle}><Globe size={14} /> Platform Handle (ID)</label>
                        <input
                            type="text"
                            name="platformHandle"
                            value={formData.platformHandle}
                            onChange={handleChange}
                            required
                            placeholder="e.g. alex_code"
                            style={inputStyle}
                        />
                    </div>

                    {/* Points */}
                    <div className="form-group">
                        <label style={labelStyle}><Trophy size={14} /> Points / Score</label>
                        <input
                            type="number"
                            name="points"
                            value={formData.points}
                            onChange={handleChange}
                            required
                            min="0"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Contest Context (Optional) */}
                <div className="form-group">
                    <label style={labelStyle}>Contest Name (Optional)</label>
                    <input
                        type="text"
                        name="contestName"
                        value={formData.contestName}
                        onChange={handleChange}
                        placeholder="e.g. Winter Hackathon 2026"
                        style={inputStyle}
                    />
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'var(--accent)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.8rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    color: '#a1a1aa',
    fontSize: '0.9rem'
};

const inputStyle = {
    width: '100%',
    background: '#09090b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    padding: '0.8rem 1rem',
    color: '#fff',
    outline: 'none',
    fontSize: '0.95rem'
};

export default AdminEditContestant;
