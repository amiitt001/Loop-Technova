import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Github, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
// FeaturedCarousel removed for mobile stacked scroller implementation

const HomeTeamCard = ({ member, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Calculate stars
    const stars = [];
    const rating = member.rating || 5;
    for (let i = 0; i < 5; i++) {
        stars.push(
            <span key={i} style={{ color: i < Math.floor(rating) ? '#00f3ff' : '#333', fontSize: '1rem' }}>★</span>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ layout: { duration: 0.3, type: "spring" } }}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                width: '320px',
                background: isExpanded ? 'rgba(10, 10, 10, 0.95)' : 'rgba(20, 20, 20, 0.6)',
                border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border-dim)'}`,
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: isExpanded ? '0 0 30px rgba(0,0,0,0.8)' : '0 0 10px rgba(0,0,0,0.3)',
                position: 'relative',
                zIndex: isExpanded ? 10 : 1
            }}
            className="group"
        >
            <motion.div layout="position" style={{
                width: isExpanded ? '80px' : '100px',
                height: isExpanded ? '80px' : '100px',
                borderRadius: '50%',
                background: '#111',
                border: `2px solid ${member.color}`,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: member.color,
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'all 0.3s ease'
            }}>
                {member.img && !imgError ? (
                    <img
                        src={member.img}
                        alt={member.name}
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        width: '100%',
                        background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                        padding: '5px'
                    }}>
                        <span style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{member.name.charAt(0)}</span>
                        <span style={{
                            fontSize: '0.4rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)',
                            opacity: 0.7,
                            lineHeight: 1,
                            textAlign: 'center'
                        }}>PHOTO COMING SOON</span>
                    </div>
                )}
            </motion.div>

            <motion.h3 layout="position" style={{ fontSize: '1.4rem', marginBottom: '0.2rem', color: '#fff' }}>{member.name}</motion.h3>
            <motion.p layout="position" style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: isExpanded ? '1.5rem' : '0' }}>{member.role}</motion.p>

            {!isExpanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: '1rem', color: 'var(--accent)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    View Details <ArrowRight size={14} />
                </motion.div>
            )}

            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{ width: '100%' }}
                >
                    {/* Achievement */}
                    {member.latestAchievement && (
                        <div style={{ width: '100%', textAlign: 'left', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.3rem' }}>Latest Achievement:</p>
                            <p style={{ fontSize: '0.9rem', color: '#fff' }}>{member.latestAchievement}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{member.projectCount || '0'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Projects</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex' }}>{stars}</div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Rating</p>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    {member.techStack && member.techStack.length > 0 && (
                        <div style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Tech Stack:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {member.techStack.map((tech, i) => (
                                    <span key={i} style={{
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-dim)',
                                        color: '#eee'
                                    }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Socials */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', width: '100%', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {member.social?.github && (
                            <a href={member.social.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Github size={20} color="var(--text-dim)" className="hover:text-white transition-colors" />
                            </a>
                        )}
                        {member.social?.linkedin && (
                            <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Linkedin size={20} color="var(--text-dim)" className="hover:text-white transition-colors" />
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

const HomeTeam = () => {
    const [allMembers, setAllMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDomain, setActiveDomain] = useState('Full Stack Team');
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
    });

    const domains = [
        'Full Stack Team',
        'Frontend Team',
        'Backend Team',
        'AI/ML Team',
        'Mobile Team',
        'Design Team',
        'DevOps Team'
    ];

    useEffect(() => {
        const q = query(collection(db, "members"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const members = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                social: doc.data().social || {}
            }));
            setAllMembers(members);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching team:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (allMembers.length === 0) return;

        // Show specific domain
        const filtered = allMembers.filter(m => m.domain === activeDomain);

        // Assign neon colors cycle
        const neonColors = ['var(--accent)', '#ff0055', '#7000ff', '#00ff9d'];
        const withColors = filtered.map((m, i) => ({
            ...m,
            color: neonColors[i % neonColors.length]
        }));

        setFilteredMembers(withColors);
    }, [activeDomain, allMembers]);

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

    // Mobile 3D Carousel Logic
    const carouselRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!isMobile) return;
        const container = carouselRef.current;
        if (!container) return;

        const options = {
            root: container,
            threshold: 0.6 // Trigger when 60% of card is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(index)) {
                        setActiveIndex(index);
                    }
                }
            });
        }, options);

        const items = container.querySelectorAll('.carousel-item');
        items.forEach(item => observer.observe(item));

        return () => {
            items.forEach(item => observer.unobserve(item));
            observer.disconnect();
        };
    }, [isMobile, filteredMembers]);

    return (
        <div style={{ padding: '6rem 0', background: 'transparent' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>OUR <span style={{ color: 'var(--text-dim)' }}>SQUAD</span></h2>

                <style>{`
                    .glow-active {
                        box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
                        transform: scale(1.05);
                    }
                    .hover-glow:hover {
                        border-color: var(--accent) !important;
                        color: var(--accent) !important;
                        transform: translateY(-2px);
                    }
                    /* Hide Scrollbar */
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>

                {/* MENTORS & HEADS SECTION */}
                {!loading && (
                    <div style={{ marginBottom: '5rem' }}>
                        {/* Mentors */}
                        {allMembers.filter(m => /Mentor/i.test(m.role)).length > 0 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    Our Mentors
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                    {allMembers.filter(m => /Mentor/i.test(m.role)).map((member, i) => (
                                        <HomeTeamCard
                                            key={member.id}
                                            member={{ ...member, color: 'var(--accent)' }}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Heads & Leads */}
                        {allMembers.filter(m => /Head|Lead|President|Vice/i.test(m.role) && !/Mentor/i.test(m.role)).length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.5rem', color: '#ff0055', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    Heads & Leads
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                    {allMembers.filter(m => /Head|Lead|President|Vice/i.test(m.role) && !/Mentor/i.test(m.role)).map((member, i) => (
                                        <HomeTeamCard
                                            key={member.id}
                                            member={{ ...member, color: '#ff0055' }}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ width: '100px', height: '1px', background: 'var(--border-dim)', margin: '4rem auto' }}></div>

                {/* Domain Tabs */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                    marginBottom: '3rem',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {domains.map(domain => (
                        <button
                            key={domain}
                            onClick={() => setActiveIndex(0) || setActiveDomain(domain)}
                            style={{
                                background: activeDomain === domain ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                color: activeDomain === domain ? '#000' : 'var(--text-dim)',
                                border: `1px solid ${activeDomain === domain ? 'var(--accent)' : 'var(--border-dim)'}`,
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                transition: 'all 0.3s ease'
                            }}
                            className={activeDomain === domain ? 'glow-active' : 'hover-glow'}
                        >
                            {domain}
                        </button>
                    ))}
                </div>

                {isMobile ? (
                    // Mobile View - 3D Carousel
                    loading ? <p>Loading...</p> : filteredMembers.length > 0 ? (
                        <div style={{ position: 'relative', minHeight: '500px' }}>
                            <div
                                ref={carouselRef}
                                className="no-scrollbar"
                                style={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    scrollSnapType: 'x mandatory',
                                    padding: '2rem 50vw 2rem 50vw', // Center padding
                                    gap: '1rem', // Gap between items
                                    perspective: '1000px',
                                    alignItems: 'center'
                                }}
                            >
                                {filteredMembers.map((member, i) => {
                                    // Calculate distance from center index
                                    const dist = Math.abs(activeIndex - i);
                                    const isCenter = i === activeIndex;

                                    return (
                                        <div
                                            key={member.id}
                                            className="carousel-item"
                                            data-index={i}
                                            style={{
                                                scrollSnapAlign: 'center',
                                                flexShrink: 0,
                                                transformStyle: 'preserve-3d',
                                                transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                                                transform: isCenter
                                                    ? 'scale(1) translateZ(0)'
                                                    : `scale(0.85) translateZ(-50px) rotateY(${i < activeIndex ? '25deg' : '-25deg'})`,
                                                opacity: isCenter ? 1 : 0.6,
                                                zIndex: isCenter ? 10 : 1,
                                                filter: isCenter ? 'none' : 'blur(2px) grayscale(50%)'
                                            }}
                                        >
                                            <HomeTeamCard member={member} index={i} />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Dots */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                {filteredMembers.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const container = carouselRef.current;
                                            const items = container.querySelectorAll('.carousel-item');
                                            if (items[i]) {
                                                items[i].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                                            }
                                        }}
                                        style={{
                                            width: i === activeIndex ? '24px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: i === activeIndex ? 'var(--accent)' : 'var(--border-dim)',
                                            border: 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-dim)', margin: '2rem 0' }}>No members found in this domain.</p>
                    )
                ) : (
                    // Desktop View - Grid
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '2rem',
                        margin: '3rem 0',
                        minHeight: '300px' // Prevent layout shift
                    }}>
                        {!loading && filteredMembers.length === 0 && (
                            <p style={{ color: 'var(--text-dim)', alignSelf: 'center' }}>No members found in this domain.</p>
                        )}

                        {filteredMembers.map((member, i) => (
                            <HomeTeamCard key={member.id} member={member} index={i} />
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
                            gap: '0.5rem',
                            marginTop: '2rem'
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
