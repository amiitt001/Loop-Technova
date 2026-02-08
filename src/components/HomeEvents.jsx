import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const HomeEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch upcoming/active events.
        // Assuming 'status' != 'Past' means upcoming/active.
        // We can't filter by 'status' != 'Past' AND order by date in one query easily without composite index if we mix inequality with sort.
        // But we can filter client side since dataset is small, OR just fetch all and filter.
        // Let's fetch all events and filter/sort client side for simplicity given likely small event count.
        const q = query(collection(db, "events"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dateObj: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
            }));

            // Filter for upcoming (not past status, and date in future ideally, but rely on status for now)
            const upcoming = allEvents.filter(e => e.status !== 'Past');

            // Sort by Date Ascending (Nearest first)
            upcoming.sort((a, b) => a.dateObj - b.dateObj);

            setEvents(upcoming);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching home events:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const featuredEvent = events.length > 0 ? events[0] : null;
    const secondaryEvents = events.length > 1 ? events.slice(1, 4) : [];

    const getTypeColor = (eventType) => {
        return eventType === 'Major' ? '#ef4444' : '#facc15';
    };

    return (
        <div style={{ padding: '6rem 0', background: 'transparent', borderTop: '1px solid var(--border-dim)' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>UPCOMING <span style={{ color: 'var(--accent)' }}>EVENTS</span></h2>
                        <p style={{ color: 'var(--text-dim)' }}>Join the action. Learn, compete, win.</p>
                        {loading && <div style={{ marginTop: '1rem' }}><RefreshCw className="spin" size={20} color="var(--text-dim)" /></div>}
                    </div>
                    <Link to="/events" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                        VIEW ALL <ArrowRight size={18} />
                    </Link>
                </div>

                {!loading && events.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>No upcoming events scheduled at the moment.</p>
                )}

                {events.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Main Featured Event */}
                        {featuredEvent && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 243, 255,0.1), rgba(0,0,0,0))',
                                    border: '1px solid var(--accent)',
                                    borderRadius: '16px',
                                    padding: '2.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    minHeight: '400px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: getTypeColor(featuredEvent.eventType || 'Minor'),
                                    color: '#000',
                                    padding: '0.2rem 0.8rem',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {featuredEvent.eventType || 'Minor'}
                                </div>

                                <div style={{
                                    display: 'inline-block',
                                    background: 'var(--accent)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    padding: '0.2rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    marginBottom: '1rem',
                                    width: 'fit-content'
                                }}>
                                    FEATURED
                                </div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0, 243, 255,0.3)' }}>{featuredEvent.title}</h3>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', flex: 1 }}>
                                    {featuredEvent.description ? featuredEvent.description.substring(0, 150) + (featuredEvent.description.length > 150 ? '...' : '') : 'No description available.'}
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', color: '#fff', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={16} color="var(--accent)" />
                                        {featuredEvent.dateObj.toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} color="var(--accent)" />
                                        {featuredEvent.time || featuredEvent.location || 'TBD'}
                                    </div>
                                </div>
                                <Link to="/events">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'var(--accent)',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        REGISTER NOW
                                    </motion.button>
                                </Link>
                            </motion.div>
                        )}

                        {/* Secondary Events List */}
                        {secondaryEvents.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {secondaryEvents.map((evt, i) => (
                                    <motion.div
                                        key={evt.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-dim)',
                                            borderRadius: '12px',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flex: 1,
                                            position: 'relative'
                                        }}
                                    >
                                        <div>
                                            <div style={{
                                                display: 'inline-block',
                                                marginBottom: '0.5rem',
                                                background: getTypeColor(evt.eventType || 'Minor'),
                                                color: '#000',
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: '8px',
                                                fontSize: '0.6rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {evt.eventType || 'Minor'}
                                            </div>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{evt.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                {evt.type || 'Event'} • {evt.dateObj.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ArrowRight size={20} color="var(--border-dim)" />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default HomeEvents;
