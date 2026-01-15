import React from 'react';
import { ArrowRight, Trophy, Code, Cpu, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
import HomeGallery from '../components/HomeGallery';
import CredibilityStrip from '../components/CredibilityStrip';

import HomeEvents from '../components/HomeEvents';
import HomeTeam from '../components/HomeTeam';
import HomeAbout from '../components/HomeAbout';
import HomeContact from '../components/HomeContact';

const Home = () => {
  const letterContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.3
      }
    }
  };

  const letterItem = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', damping: 10 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        {/* SECTION 1: HERO */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          {/* Advanced Animated Background */}
          <div className="grid-bg"></div>
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  width: Math.random() * 4 + 1 + 'px',
                  height: Math.random() * 4 + 1 + 'px',
                  left: Math.random() * 100 + '%',
                }}
              />
            ))}
          </div>

          <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--neon-cyan)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                border: '1px solid rgba(0, 243, 255, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                background: 'rgba(0, 243, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--neon-cyan)', borderRadius: '50%', boxShadow: '0 0 5px var(--neon-cyan)' }}></span>
                SYSTEM ONLINE: EST. 2026
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={letterContainer}
              initial="hidden"
              animate="show"
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                lineHeight: '1.1',
                margin: '0 0 1rem',
                textShadow: '0 0 40px rgba(0,0,0,0.5)',
                fontWeight: '900',
                letterSpacing: '-2px'
              }}
            >
              {Array.from("ARCHITECTS OF").map((char, i) => (
                <motion.span key={i} variants={letterItem}>{char === ' ' ? '\u00A0' : char}</motion.span>
              ))}
              <br />
              <span className="text-neon-cyan glow-text" style={{ display: 'inline-block' }}>
                {Array.from("THE FUTURE").map((char, i) => (
                  <motion.span key={i} variants={letterItem} style={{ display: 'inline-block' }}>{char === ' ' ? '\u00A0' : char}</motion.span>
                ))}
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.8 }}
              style={{
                maxWidth: '600px',
                margin: '0 auto 2.5rem',
                fontSize: '1.5rem',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Code. Create. <span style={{ color: '#fff' }}>Conquer.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 1 }}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link to="/join">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 243, 255, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  JOIN THE SQUAD <ArrowRight size={20} />
                </motion.button>
              </Link>
              <Link to="/leaderboard">
                <motion.button
                  className="btn-secondary"
                  whileHover={{ scale: 1.05, borderColor: 'var(--neon-violet)', color: 'var(--neon-violet)', boxShadow: '0 0 20px rgba(189, 0, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trophy size={18} /> VIEW LEADERBOARD
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: CREDIBILITY STRIP */}
        <CredibilityStrip />

        {/* SECTION 3: ABOUT */}
        <HomeAbout />

        {/* SECTION 4: GALLERY */}
        <HomeGallery />



        {/* SECTION 6: EVENTS PREVIEW */}
        <HomeEvents />

        {/* SECTION 7: TEAM PREVIEW */}
        <HomeTeam />

        {/* SECTION 8: CONTACT */}
        <HomeContact />

        {/* SECTION 9: FINAL CTA */}
        <div style={{ padding: '8rem 0', textAlign: 'center', background: 'linear-gradient(0deg, var(--bg-card) 0%, transparent 100%)' }}>
          <div className="container">
            <h2 style={{ fontSize: '3rem', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
              READY TO <span style={{ color: 'var(--neon-cyan)' }}>BUILD</span> THE IMPOSSIBLE?
            </h2>
            <Link to="/join">
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.1, boxShadow: '0 0 50px rgba(0,243,255,0.4)' }}
                whileTap={{ scale: 0.9 }}
                style={{ margin: '0 auto' }}
              >
                START YOUR JOURNEY
              </motion.button>
            </Link>
          </div>
        </div>

      </div>

      <style>{`
        .grid-bg {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          background-image: 
            linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          transform: perspective(500px) rotateX(60deg);
          animation: grid-move 20s linear infinite;
          opacity: 0.8;
          pointer-events: none;
          mask-image: radial-gradient(circle, black 40%, transparent 80%);
          z-index: 0;
        }

        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        .particle {
          position: absolute;
          background: var(--neon-cyan);
          border-radius: 50%;
          box-shadow: 0 0 5px var(--neon-cyan);
        }

        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(60px); }
        }

        .btn-primary {
          background: var(--neon-cyan);
          color: #000;
          padding: 1rem 2.5rem;
          font-weight: 800;
          font-family: var(--font-display);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          border-radius: 2px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          letter-spacing: 1px;
        }

        .btn-secondary {
          background: rgba(0,0,0,0.5);
          border: 1px solid var(--border-dim);
          color: #fff;
          padding: 1rem 2.5rem;
          font-weight: 800;
          font-family: var(--font-display);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          border-radius: 2px;
          cursor: pointer;
          font-size: 1rem;
          letter-spacing: 1px;
          backdrop-filter: blur(5px);
        }

        .glow-text {
          text-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
        }

        @media (max-width: 768px) {
            .btn-primary, .btn-secondary {
                width: 100%;
                justify-content: center;
            }
        }
      `}</style>
    </>
  );
};

export default Home;
