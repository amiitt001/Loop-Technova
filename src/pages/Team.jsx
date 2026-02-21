import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, Twitter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import ThreeBackground from '../components/ThreeBackground';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12
    }
  }
};

const Team = () => {
  const [teamGroups, setTeamGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 768px)').matches;
    }
    return false;
  });
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "members"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure social exists to avoid crashes if missing in DB
        social: doc.data().social || {}
      }));

      // Group by role
      // Group: Mentors, Heads, Coordinators
      const mentors = allMembers.filter(m => /Mentor/i.test(m.role));
      const heads = allMembers.filter(m => /Head|Lead|President|Vice/i.test(m.role) && !/Mentor/i.test(m.role));
      const coordinators = allMembers.filter(m => /Coordinator/i.test(m.role) && !/Head|Lead|President|Vice|Mentor/i.test(m.role));
      // Any other 'Core' members not fitting above categories could land here if needed, 
      // but user strictly requested these 3 categories.

      const groups = [];
      if (mentors.length > 0) groups.push({ title: 'Mentors', width: '300px', members: mentors });
      if (heads.length > 0) groups.push({ title: 'Heads & Leads', width: '280px', members: heads });
      if (coordinators.length > 0) groups.push({ title: 'Coordinators', width: '250px', members: coordinators });

      // General Members hidden per previous request

      setTeamGroups(groups);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching team:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // detect mobile for Team page (<=768px)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    // Initial check removed as it's handled in useState initializer
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Mobile stacked scroller logic
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
  }, [isMobile, teamGroups]);



  return (
    <div className="container" style={{ padding: '8rem 0 4rem' }}>
      <ThreeBackground variant="team" />
      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
        <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>MEET THE SQUAD</h1>
        <p style={{ color: 'var(--text-dim)' }}>The minds behind the machines.</p>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}><RefreshCw className="spin" /></div>}
      </div>

      {!loading && teamGroups.length === 0 && (
        <p style={{ textAlign: 'center', color: '#71717a' }}>No team members found.</p>
      )}


      {isMobile && !loading ? (
        <div style={{ paddingBottom: '2rem' }}>
          {(() => {
            const flat = teamGroups.reduce((acc, g) => acc.concat(g.members), []);
            return (
              <>
                <div className="stack-scroller hide-scrollbar" ref={scrollerRef}>
                  {flat.map((member, idx) => {
                    const [isExpanded, setIsExpanded] = useState(false);
                    const stars = [];
                    const rating = member.rating || 5;
                    for (let i = 0; i < 5; i++) {
                      stars.push(
                        <span key={i} style={{ color: i < Math.floor(rating) ? 'var(--accent)' : '#333', fontSize: '0.8rem' }}>★</span>
                      );
                    }

                    return (
                      <section
                        key={member.id || idx}
                        className={`stack-item ${idx === activeIndex ? 'active' : ''} ${isExpanded ? 'stack-expanded' : ''}`}
                        data-index={idx}
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        <div className="stack-card" style={{ borderColor: member.color || 'var(--accent)' }}>
                          <div className="stack-avatar" style={{ borderColor: member.color || 'var(--accent)' }}>
                            {member.img ? <img src={member.img} alt={member.name} /> : <span>{member.name.charAt(0)}</span>}
                          </div>
                          <div className="stack-meta">
                            <h3>{member.name}</h3>
                            <p style={{ color: member.color || 'var(--text-dim)' }}>{member.role}</p>
                          </div>

                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{ width: '100%', marginTop: '1rem', textAlign: 'left' }}
                            >
                              {member.latestAchievement && (
                                <div style={{ marginBottom: '0.8rem' }}>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 'bold' }}>ACHIEVEMENT</p>
                                  <p style={{ fontSize: '0.8rem', color: '#fff' }}>{member.latestAchievement}</p>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <div>
                                  <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>{member.projectCount || '0'}</p>
                                  <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>PROJECTS</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex' }}>{stars}</div>
                                  <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>RATING</p>
                                </div>
                              </div>

                              {member.techStack && member.techStack.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>TECH STACK</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {member.techStack.map((tech, i) => (
                                      <span key={i} style={{
                                        fontSize: '0.6rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#bbb'
                                      }}>
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}

                          <div className="stack-links">
                            {member.social?.github && (
                              <a href={member.social.github} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <Github size={18} color="var(--text-dim)" />
                              </a>
                            )}
                            {member.social?.linkedin && (
                              <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <Linkedin size={18} color="var(--text-dim)" />
                              </a>
                            )}
                            {member.social?.twitter && (
                              <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <Twitter size={18} color="var(--text-dim)" />
                              </a>
                            )}
                          </div>

                          {!isExpanded && (
                            <div style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '0.5rem', opacity: 0.6 }}>
                              Tap to expand
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>

                <div className="stack-dots" aria-hidden>
                  {flat.map((_, i) => (
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
              </>
            );
          })()}
        </div>
      ) : (
        teamGroups.map((group, groupIndex) => (
          <div key={group.title} style={{ marginBottom: '5rem' }}>
            <h2 style={{
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'var(--accent)',
              fontSize: '2rem',
              position: 'relative',
              display: 'inline-block',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              {group.title}
              <span style={{ position: 'absolute', bottom: '-10px', left: '0', width: '100%', height: '2px', background: 'var(--accent)', opacity: 0.5 }}></span>
            </h2>

            <motion.div
              className="team-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {group.members.map((member, i) => (
                <TeamCard key={member.id || i} member={member} width={group.width} />
              ))}
            </motion.div>
          </div>
        ))
      )}

      <style>{`
        .team-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 2rem;
        }
        @media (max-width: 768px) {
            .team-grid {
                flex-direction: column;
                align-items: center;
            }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const TeamCard = ({ member, width }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Calculate stars
  const stars = [];
  const rating = member.rating || 5;
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span key={i} style={{ color: i < Math.floor(rating) ? 'var(--accent)' : '#333', fontSize: '0.9rem' }}>★</span>
    );
  }

  return (
    <motion.div
      layout
      className={`team-card ${isExpanded ? 'expanded' : ''}`}
      variants={itemVariants}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        width: isExpanded ? '350px' : width,
        minHeight: isExpanded ? 'auto' : '350px',
        position: 'relative',
        cursor: 'pointer',
        zIndex: isExpanded ? 50 : 1
      }}
    >
      <div className="card-inner" style={{ padding: isExpanded ? '2rem' : '1.5rem' }}>
        <motion.div layout="position" className="avatar-container">
          {member.img && !imgError ? (
            <img
              src={member.img}
              alt={member.name}
              onError={() => setImgError(true)}
              style={{
                width: isExpanded ? '80px' : '140px',
                height: isExpanded ? '80px' : '140px',
                borderRadius: '50%',
                border: '2px solid var(--border-dim)',
                objectFit: 'cover',
                transition: 'all 0.3s ease'
              }}
              className="member-avatar"
            />
          ) : (
            <div className="avatar-placeholder" style={{
              width: isExpanded ? '80px' : '140px',
              height: isExpanded ? '80px' : '140px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isExpanded ? '1.5rem' : '2rem', color: '#555'
            }}>
              {member.name.charAt(0)}
            </div>
          )}
        </motion.div>

        <motion.h3 layout="position" style={{ fontSize: isExpanded ? '1.4rem' : '1.2rem', marginTop: isExpanded ? '0.5rem' : '1rem' }}>{member.name}</motion.h3>
        <motion.p layout="position" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: isExpanded ? '1.5rem' : '0' }}>
          {member.role === 'Head' ? 'Lead' : member.role}
        </motion.p>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {/* Achievement */}
            {member.latestAchievement && (
              <div style={{ width: '100%', textAlign: 'left', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Latest Achievement</p>
                <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.4' }}>{member.latestAchievement}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{member.projectCount || '0'}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Projects</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex' }}>{stars}</div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem', textTransform: 'uppercase' }}>Rating</p>
              </div>
            </div>

            {/* Tech Stack */}
            {member.techStack && member.techStack.length > 0 && (
              <div style={{ width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Tech Stack</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {member.techStack.map((tech, i) => (
                    <span key={i} style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-dim)',
                      color: '#ccc'
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Socials - Expanded View */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.2rem',
              width: '100%',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              {member.social?.github && (
                <a href={member.social.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Github size={18} className="social-icon" />
                </a>
              )}
              {member.social?.linkedin && (
                <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Linkedin size={18} className="social-icon" />
                </a>
              )}
              {member.social?.twitter && (
                <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Twitter size={18} className="social-icon" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {!isExpanded && (
          <div className="view-details-hint" style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--accent)', opacity: 0.8 }}>
            Click to view details
          </div>
        )}
      </div>

      <style>{`
        .team-card {
          perspective: 1000px;
          transition: transform 0.3s ease, z-index 0s;
        }
        
        .card-inner {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          border-radius: 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .avatar-placeholder {
          background: #1a1a1a;
          border-radius: 50%;
          border: 2px solid var(--border-dim);
          transition: all 0.3s ease;
        }

        .team-card:hover:not(.expanded) .card-inner {
          transform: translateY(-5px);
          border-color: var(--accent);
          background: rgba(15, 15, 15, 0.95);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .team-card.expanded .card-inner {
          background: rgba(10, 10, 10, 0.98);
          border-color: var(--accent);
          box-shadow: 0 0 40px rgba(0, 243, 255, 0.15);
          justify-content: flex-start;
        }

        .team-card:hover .avatar-placeholder,
        .team-card:hover .member-avatar {
          border-color: var(--accent);
        }

        .social-icon {
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
        }
        .social-icon:hover {
          color: var(--accent);
          transform: translateY(-2px);
        }

        .view-details-hint {
          transition: opacity 0.3s ease;
        }
        .team-card:hover .view-details-hint {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  );
};

export default Team;
