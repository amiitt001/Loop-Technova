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
        const q = query(collection(db, 'events'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEvents = snapshot.docs.map((doc) => {
                const data = doc.data();
                const d = data.date?.toDate ? data.date.toDate() : data.date;

                return {
                    id: doc.id,
                    ...data,
                    dateObj: d,
                    dateDisplay: data.date?.toDate ? data.date.toDate().toLocaleDateString() : (data.date || 'TBD')
                };
            });

            const upcoming = allEvents.filter((event) => event.status !== 'Past');

            upcoming.sort((a, b) => {
                const getSortDate = (event) => {
                    if (event.date?.toDate) return event.date.toDate();
                    if (event.date === 'Announcing soon') return new Date(8640000000000000);
                    return new Date(event.date || 0);
                };

                return getSortDate(a) - getSortDate(b);
            });

            setEvents(upcoming);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching home events:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const displayedEvents = events.slice(0, 2);

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

                {displayedEvents.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                        {displayedEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.08), rgba(5, 10, 20, 0.95))',
                                    border: '1px solid rgba(0, 243, 255, 0.3)',
                                    borderRadius: '12px',
                                    padding: '1.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '340px',
                                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                        <div style={{
                                            background: event.registrationOpen ? 'var(--accent)' : (event.registrationSoon ? '#3b82f6' : '#ef4444'),
                                            color: event.registrationOpen ? '#000' : '#fff',
                                            padding: '0.2rem 0.7rem',
                                            borderRadius: '6px',
                                            fontSize: '0.6rem',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 0 10px ' + (event.registrationOpen ? 'rgba(0, 243, 255, 0.2)' : (event.registrationSoon ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.1)'))
                                        }}>
                                            {event.registrationOpen ? 'REGISTRATION OPEN' : (event.registrationSoon ? 'UPCOMING' : 'REGISTRATION CLOSED')}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', textShadow: '0 0 15px rgba(0, 243, 255, 0.2)', fontWeight: '800', lineHeight: '1.2' }}>
                                        {event.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {event.description ? event.description.substring(0, 140) + (event.description.length > 140 ? '...' : '') : 'No description available.'}
                                    </p>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.75rem', color: '#fff', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} color="var(--accent)" />
                                            <span style={{ fontSize: '0.9rem' }}>{event.dateDisplay}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={16} color="var(--accent)" />
                                            <span style={{ fontSize: '0.9rem' }}>{event.time || event.location || 'TBD'}</span>
                                        </div>
                                    </div>

                                    <Link to="/events" state={{ scrollToTop: true }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 243, 255, 0.3)' }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                background: event.registrationOpen ? 'var(--accent)' : 'transparent',
                                                color: event.registrationOpen ? '#000' : 'var(--accent)',
                                                border: '1px solid var(--accent)',
                                                borderRadius: '10px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {event.registrationOpen ? 'REGISTER NOW' : (event.registrationSoon ? 'COMING SOON' : 'VIEW DETAILS')}
                                        </motion.button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
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
