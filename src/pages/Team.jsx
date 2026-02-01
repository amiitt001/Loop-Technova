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
        <div>
          {(() => {
            const flat = teamGroups.reduce((acc, g) => acc.concat(g.members), []);
            return (
              <>
                <div className="stack-scroller hide-scrollbar" ref={scrollerRef}>
                  {flat.map((member, idx) => (
                    <section key={member.id || idx} className={`stack-item ${idx === activeIndex ? 'active' : ''}`} data-index={idx}>
                      <div className="stack-card" style={{ borderColor: member.color || 'var(--accent)' }}>
                        <div className="stack-avatar" style={{ borderColor: member.color || 'var(--accent)' }}>
                          {member.img ? <img src={member.img} alt={member.name} /> : <span>{member.name.charAt(0)}</span>}
                        </div>
                        <div className="stack-meta">
                          <h3>{member.name}</h3>
                          <p style={{ color: member.color || 'var(--text-dim)' }}>{member.role}</p>
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
                          {member.social?.twitter && (
                            <a href={member.social.twitter} target="_blank" rel="noopener noreferrer">
                              <Twitter size={20} color="var(--text-dim)" />
                            </a>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
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
  return (
    <motion.div
      className="team-card"
      variants={itemVariants}
      style={{
        width: width,
        height: '350px',
        position: 'relative' // For hover overlay
      }}
    >
      <div className="card-inner">
        {member.img ? (
          <img
            src={member.img}
            alt={member.name}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '2px solid var(--border-dim)',
              objectFit: 'cover',
              marginBottom: '1rem'
            }}
            className="member-avatar"
          />
        ) : (
          <div className="avatar-placeholder" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#555'
          }}>
            {member.name.charAt(0)}
          </div>
        )}
        <h3 style={{ fontSize: '1.2rem', marginTop: '1rem' }}>{member.name}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{member.role === 'Head' ? 'Lead' : member.role}</p>

      </div>

      {/* Hover Overlay */}
      <div className="social-overlay">
        <div style={{ display: 'flex', gap: '1rem' }}>
          {member.social?.github && (
            <a href={member.social.github} target="_blank" rel="noopener noreferrer">
              <Github className="social-icon" />
            </a>
          )}
          {member.social?.linkedin && (
            <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="social-icon" />
            </a>
          )}
          {member.social?.twitter && (
            <a href={member.social.twitter} target="_blank" rel="noopener noreferrer">
              <Twitter className="social-icon" />
            </a>
          )}
        </div>
      </div>

      <style>{`
        .team-card {
          perspective: 1000px;
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
          transition: all 0.4s ease;
          position: relative;
          z-index: 1;
        }

        .avatar-placeholder {
          width: 140px;
          height: 140px;
          background: #222;
          border-radius: 50%;
          border: 2px solid var(--border-dim);
          transition: all 0.4s ease;
        }

        .member-avatar {
             transition: all 0.4s ease;
        }

        .team-card:hover .card-inner {
          transform: translateY(-5px);
          border-color: var(--accent);
          background: rgba(10, 10, 10, 0.9);
        }

        .team-card:hover .avatar-placeholder,
        .team-card:hover .member-avatar {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
        }

        /* Social Reveal */
        .social-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0; /* Hidden by default */
          background: linear-gradient(to top, rgba(0, 243, 255, 0.2), transparent);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 2rem;
          opacity: 0;
          transition: all 0.4s ease;
          border-radius: 0 0 12px 12px;
          pointer-events: none; /* Let clicks pass through if hidden */
          z-index: 2;
        }

        .team-card:hover .social-overlay {
          height: 40%;
          opacity: 1;
          pointer-events: auto;
        }

        .social-icon {
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .social-icon:hover {
          color: var(--accent);
          transform: scale(1.2);
        }
      `}</style>
    </motion.div>
  );
};

export default Team;
