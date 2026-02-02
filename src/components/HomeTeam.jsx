import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Github, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
// FeaturedCarousel removed for mobile stacked scroller implementation

const HomeTeamCard = ({ member, index }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);

        // Spotlight Logic
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            style={{
                width: '200px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-dim)',
                borderRadius: '16px',
                padding: '2rem 1rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                perspective: 1000,
                rotateX,
                rotateY,
                cursor: 'pointer'
            }}
            className="spotlight-card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
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
                overflow: 'hidden',
                pointerEvents: 'none' // Let hover pass through
            }}>
                {member.img ? (
                    <img src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span style={{ fontSize: '2rem' }}>{member.name.charAt(0)}</span>
                )}
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', pointerEvents: 'none' }}>{member.name}</h3>
            <p style={{ fontSize: '0.85rem', color: member.color, marginBottom: '1rem', pointerEvents: 'none' }}>{member.role}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', pointerEvents: 'auto', zIndex: 5 }}>
                {member.social?.github && (
                    <a href={member.social.github} target="_blank" rel="noopener noreferrer" style={{ pointerEvents: 'auto' }}>
                        <Github size={16} color="var(--text-dim)" />
                    </a>
                )}
                {member.social?.linkedin && (
                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" style={{ pointerEvents: 'auto' }}>
                        <Linkedin size={16} color="var(--text-dim)" />
                    </a>
                )}
            </div>
        </motion.div>
    );
};

const HomeTeam = () => {
    const [teamPreview, setTeamPreview] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
    });
    const [featuredMembers, setFeaturedMembers] = useState([]);

    useEffect(() => {
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

            // Strict Filter: Only show Leadership (Heads/Leads) on Home Page
            const preview = leadership.slice(0, 4);

            // Assign colors dynamically if needed or random neon colors?
            // The original had specific colors. Let's just cycle through neon colors.
            const neonColors = ['var(--accent)', 'var(--accent)', '#ff0055', 'var(--accent)'];

            const previewWithColors = preview.map((member, index) => ({
                ...member,
                color: neonColors[index % neonColors.length]
            }));

            // Prepare featured members for mobile (strictly leadership)
            const featured = leadership.slice(0, 6);

            const featuredWithColors = featured.map((member, index) => ({
                ...member,
                color: neonColors[index % neonColors.length]
            }));

            setFeaturedMembers(featuredWithColors);

            // Filter for Mentors
            const mentorsList = allMembers.filter(m => m.role.includes('Mentor'));
            const mentorsWithColors = mentorsList.map((m, i) => ({
                ...m,
                color: neonColors[i % neonColors.length]
            }));
            setMentors(mentorsWithColors);

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
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = (e) => setIsMobile(e.matches);
        // Initial check removed
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);

    // Mobile stacked scroller logic (IntersectionObserver + scroll lock)
    const scrollerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        if (!isMobile) return;
        const scroller = scrollerRef.current;
        if (!scroller) return;

        let lockTimer = null;
        const lockBody = () => {
            document.body.style.overflow = 'hidden';
            if (lockTimer) clearTimeout(lockTimer);
            lockTimer = setTimeout(() => { document.body.style.overflow = ''; }, 420);
        };

        const items = scroller.querySelectorAll('.stack-item');
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.dataset.index);
                    setActiveIndex(idx);
                }
            });
        }, { root: scroller, threshold: [0.5] });

        items.forEach(it => io.observe(it));

        let scrollTimer = null;
        const onScroll = () => {
            lockBody();
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => { document.body.style.overflow = ''; }, 450);
        };

        scroller.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            items.forEach(it => io.unobserve(it));
            io.disconnect();
            scroller.removeEventListener('scroll', onScroll);
            if (lockTimer) clearTimeout(lockTimer);
            document.body.style.overflow = '';
        };
    }, [isMobile, featuredMembers]);

    return (
        <div style={{ padding: '6rem 0', background: 'transparent' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>CORE <span style={{ color: 'var(--text-dim)' }}>TEAM</span></h2>

                {/* Mobile stacked scroller: one focused card at a time */}
                {isMobile && featuredMembers.length > 0 && (
                    <div>
                        <div className="stack-scroller hide-scrollbar" ref={scrollerRef}>
                            {featuredMembers.map((member, idx) => (
                                <section key={member.id} className={`stack-item ${idx === activeIndex ? 'active' : ''}`} data-index={idx}>
                                    <div className="stack-card" style={{ borderColor: member.color }}>
                                        <div className="stack-avatar" style={{ borderColor: member.color }}>
                                            {member.img ? (
                                                <img src={member.img} alt={member.name} />
                                            ) : (
                                                <span>{member.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="stack-meta">
                                            <h3>{member.name}</h3>
                                            <p style={{ color: member.color }}>{member.role}</p>
                                        </div>
                                        <div className="stack-links">
                                            {member.social?.github && (
                                                <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                                                    <Github size={20} color="var(--text-dim)" />
                                                </a>
                                            )}
                                            {member.social?.linkedin && (
                                                <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                                                    <Linkedin size={20} color="var(--text-dim)" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>

                        <div className="stack-dots" aria-hidden>
                            {featuredMembers.map((_, i) => (
                                <button
                                    key={i}
                                    className={`dot ${i === activeIndex ? 'dot-active' : ''}`}
                                    onClick={() => {
                                        const scroller = scrollerRef.current;
                                        const target = scroller.querySelector(`.stack-item[data-index="${i}"]`);
                                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                />
                            ))}
                        </div>
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
                            <HomeTeamCard key={member.id} member={member} index={i} />
                        ))}
                    </div>
                )}

                {/* Mentors Section */}
                {mentors.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', marginTop: '3rem' }}>OUR <span style={{ color: 'var(--accent)' }}>MENTORS</span></h3>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '2rem'
                        }}>
                            {mentors.map((member, i) => (
                                <HomeTeamCard key={member.id} member={member} index={i} />
                            ))}
                        </div>
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
