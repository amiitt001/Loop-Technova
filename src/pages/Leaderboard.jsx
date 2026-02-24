import React, { useState, useEffect } from 'react';
import { Crown, Search, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';


const Leaderboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from 'contestants' instead of 'members'
        const q = query(collection(db, "contestants"), orderBy("points", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leaderboard:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter and Sort (already sorted by query, but good to filter)
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const topThree = filteredUsers.slice(0, 3);
    const restUsers = filteredUsers.slice(3);

    return (
        <div className="container" style={{ padding: '8rem 0 4rem' }}>


            <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
                <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>LEADERBOARD</h1>
                <p style={{ color: 'var(--text-dim)' }}>Top contributors driving innovation.</p>
                {loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}><RefreshCw className="spin" /></div>}

                {/* Search Bar */}
                <div style={{
                    margin: '2rem auto 0',
                    maxWidth: '400px',
                    position: 'relative'
                }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        placeholder="Search member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-dim)',
                            color: '#fff',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'var(--font-mono)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-dim)'}
                    />
                </div>
            </div>

            {!loading && users.length === 0 && (
                <p style={{ textAlign: 'center', color: '#71717a' }}>No members found on the leaderboard.</p>
            )}

            {/* Top 3 Podium */}
            <div className="podium-grid">
                {topThree.length > 0 && (
                    <>
                        {/* 2nd Place */}
                        {topThree[1] && <TopCard user={topThree[1]} rank={2} delay="0.2s" />}
                        {/* 1st Place */}
                        {topThree[0] && <TopCard user={topThree[0]} rank={1} delay="0s" />}
                        {/* 3rd Place */}
                        {topThree[2] && <TopCard user={topThree[2]} rank={3} delay="0.4s" />}
                    </>
                )}
            </div>

            {/* List View */}
            <div style={{ marginTop: '4rem', maxWidth: '800px', margin: '4rem auto' }}>
                {restUsers.map((user, index) => (
                    <div key={user.id} className="rank-row animate-fade-in" style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-dim)', width: '30px' }}>
                            #{index + 4}
                        </span>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user.img ? <img src={user.img} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem' }}>{user.name.charAt(0)}</span>}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>@{user.platformHandle || 'contestant'}</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                {user.points}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>PTS</div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .podium-grid {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .rank-row {
          display: flex;
          align-items: center;
          padding: 1rem 2rem;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          margin-bottom: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .rank-row:hover {
          transform: translateX(10px);
          border-color: var(--accent);
          background: var(--bg-card-hover);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

const TopCard = ({ user, rank, delay }) => {
    const isFirst = rank === 1;
    const borderColor = isFirst ? 'var(--accent)' : 'var(--border-dim)';
    const glow = isFirst ? '0 0 30px rgba(0, 243, 255, 0.2)' : 'none';
    const scale = isFirst ? 'scale(1.1)' : 'scale(1)';

    return (
        <div className="animate-fade-in" style={{
            animationDelay: delay,
            background: 'var(--bg-card)',
            border: `1px solid ${borderColor}`,
            padding: '2rem',
            borderRadius: '16px',
            textAlign: 'center',
            width: '280px',
            position: 'relative',
            transform: scale,
            boxShadow: glow,
            zIndex: isFirst ? 2 : 1
        }}>
            {isFirst && <Crown size={32} color="var(--accent)" style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)' }} />}

            <div style={{
                fontSize: '4rem',
                fontFamily: 'var(--font-display)',
                color: isFirst ? 'var(--accent)' : 'var(--text-dim)',
                opacity: 0.2,
                position: 'absolute',
                top: '10px',
                right: '20px'
            }}>
                {rank}
            </div>

            <div style={{ width: '80px', height: '80px', background: '#333', borderRadius: '50%', margin: '0 auto 1rem', border: `2px solid ${isFirst ? 'var(--accent)' : '#555'}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.img ? <img src={user.img} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', color: '#888' }}>{user.name.charAt(0)}</span>}
            </div>

            <h3 style={{ fontSize: '1.4rem' }}>{user.name}</h3>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.9rem' }}>@{user.platformHandle || 'contestant'}</p>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold' }}>{user.points}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '5px' }}>PTS</span>
            </div>
        </div>
    );
};

export default Leaderboard;
