import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import FeaturedCarousel from './FeaturedCarousel';

const HomeTeam = () => {
    const [teamPreview, setTeamPreview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [featuredMembers, setFeaturedMembers] = useState([]);

    useEffect(() => {
        setLoading(true);
        // Maybe fetch top pointed members or just Heads?
        // Let's fetch all and filter/sort to catch "Heads" first.
        const q = query(collection(db, "members"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMembers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter for Core/Leadership roles first
            const leadership = allMembers.filter(m =>
                ['Head', 'President', 'Vice President', 'Lead'].some(role => m.role.includes(role))
            );

            // Fallback: if no leadership, take top 4 sorted by points (already sorted by query)
            let preview = leadership.slice(0, 4);
            if (preview.length < 4) {
                const others = allMembers.filter(m => !leadership.includes(m)).slice(0, 4 - preview.length);
                preview = [...preview, ...others];
            }

            // Assign colors dynamically if needed or random neon colors?
            // The original had specific colors. Let's just cycle through neon colors.
            const neonColors = ['var(--neon-cyan)', 'var(--neon-violet)', '#ff0055', 'var(--neon-green)'];

            const previewWithColors = preview.map((member, index) => ({
                ...member,
                color: neonColors[index % neonColors.length]
            }));

            // Prepare featured members (leadership first). Fallback to first few if no explicit leadership.
            let featured = leadership.slice(0, 6);
            if (featured.length === 0) {
                featured = allMembers.slice(0, Math.min(6, allMembers.length));
            }

            const featuredWithColors = featured.map((member, index) => ({
                ...member,
                color: neonColors[index % neonColors.length]
            }));

            setFeaturedMembers(featuredWithColors);

            setTeamPreview(previewWithColors);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching team preview:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Detect mobile (small screens) to switch layout and animations
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const onChange = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    return (
        <div style={{ padding: '6rem 0', background: 'linear-gradient(180deg, var(--bg-dark) 0%, #050505 100%)' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>CORE <span style={{ color: 'var(--text-dim)' }}>TEAM</span></h2>

                {/* Featured carousel on mobile only; keep desktop cards as the canonical preview */}
                {isMobile && featuredMembers.length > 0 && (
                    <div style={{ margin: '1rem 0' }}>
                        <FeaturedCarousel members={featuredMembers} mobileOnly={false} />
                    </div>
                )}

                {/* Desktop / tablet canonical preview */}
                {!isMobile && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        margin: '3rem 0'
                    }}>
                        {!loading && teamPreview.length === 0 && <p style={{ color: '#71717a' }}>Loading core team...</p>}

                        {teamPreview.map((member, i) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileHover={{ y: -10 }}
                                style={{
                                    width: '200px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-dim)',
                                    borderRadius: '16px',
                                    padding: '2rem 1rem',
                                    textAlign: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: '#111',
                                    border: `2px solid ${member.color}`,
                                    margin: '0 auto 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: member.color,
                                    overflow: 'hidden'
                                }}>
                                    {member.img ? (
                                        <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem' }}>{member.name.charAt(0)}</span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{member.name}</h3>
                                <p style={{ fontSize: '0.85rem', color: member.color, marginBottom: '1rem' }}>{member.role}</p>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <Github size={16} color="var(--text-dim)" style={{ cursor: 'pointer' }} />
                                    <Linkedin size={16} color="var(--text-dim)" style={{ cursor: 'pointer' }} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <Link to="/team">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-dim)',
                            color: '#fff',
                            padding: '0.8rem 2rem',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        MEET THE FULL SQUAD <ArrowRight size={16} />
                    </motion.button>
                </Link>
            </div>
        </div>
    );
};

export default HomeTeam;
