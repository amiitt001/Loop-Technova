import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Twitter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

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

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "members"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure social exists to avoid crashes if missing in DB
        social: doc.data().social || {}
      }));

      // Group by role
      const heads = allMembers.filter(m => m.role === 'Head' || m.role === 'President' || m.role === 'Vice President'); // Adjust based on exact role strings used in Admin
      // In AdminMembers we saw "Head/Coordinator/Member" suggested.
      // Let's broaden 'Head' to include President/VP if they exist, or just filter by 'Head'.
      // Actually, let's look at the hardcoded data: 'President', 'Vice President', 'Head'. 
      // Admin prompt suggests "Head/Coordinator/Member".
      // Let's assume 'Head' covers the leadership for now, or users input 'President' manually.
      // To be safe, let's group anything NOT Coordinator/Member as Leadership/Head?
      // Or just explicit match.

      const leadership = allMembers.filter(m => ['Head', 'President', 'Vice President'].includes(m.role));
      const coordinators = allMembers.filter(m => m.role === 'Coordinator');
      const members = allMembers.filter(m => m.role === 'Member');

      const groups = [];
      if (leadership.length > 0) groups.push({ role: 'Head', width: '300px', members: leadership });
      if (coordinators.length > 0) groups.push({ role: 'Coordinator', width: '250px', members: coordinators });
      if (members.length > 0) groups.push({ role: 'Member', width: '200px', members: members });

      setTeamGroups(groups);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching team:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container" style={{ padding: '8rem 0 4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
        <h1 className="text-neon-cyan" style={{ fontSize: '3rem', marginBottom: '1rem' }}>MEET THE SQUAD</h1>
        <p style={{ color: 'var(--text-dim)' }}>The minds behind the machines.</p>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}><RefreshCw className="spin" /></div>}
      </div>

      {!loading && teamGroups.length === 0 && (
        <p style={{ textAlign: 'center', color: '#71717a' }}>No team members found.</p>
      )}

      {teamGroups.map((group, groupIndex) => (
        <div key={group.role} style={{ marginBottom: '5rem' }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: 'var(--neon-violet)',
            fontSize: group.role === 'Head' ? '2rem' : '1.5rem',
            position: 'relative',
            display: 'inline-block',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            {group.role === 'Head' ? 'Leadership' : group.role + 's'}
            <span style={{ position: 'absolute', bottom: '-10px', left: '0', width: '100%', height: '2px', background: 'var(--neon-violet)', opacity: 0.5 }}></span>
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
      ))}

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
          {member.social?.github && <Github className="social-icon" />}
          {member.social?.linkedin && <Linkedin className="social-icon" />}
          {member.social?.twitter && <Twitter className="social-icon" />}
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
          border-color: var(--neon-cyan);
          background: rgba(10, 10, 10, 0.9);
        }

        .team-card:hover .avatar-placeholder,
        .team-card:hover .member-avatar {
          border-color: var(--neon-cyan);
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
          color: var(--neon-cyan);
          transform: scale(1.2);
        }
      `}</style>
    </motion.div>
  );
};

export default Team;
