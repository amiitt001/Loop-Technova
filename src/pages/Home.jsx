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
import ThreeBackground from '../components/ThreeBackground';

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
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          background: 'radial-gradient(circle at 30% center, rgba(0, 243, 255, 0.08), transparent 50%)'
        }}>
          <ThreeBackground />

          <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="hero-grid">

              {/* Left Column: Text */}
              <div style={{ textAlign: 'left' }}>
                <motion.p
                  variants={fadeInUp}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-main)',
                    lineHeight: '1.8',
                    marginBottom: '2.5rem',
                    maxWidth: '540px'
                  }}
                >
                  Welcome to <strong>LOOP</strong> — Galgotias College's premier technical society.
                  We bridge the gap between classroom theory and industry reality through
                  <strong> hackathons, coding bootcamps, and top-tier tech summits</strong>.
                  Join a community of builders, dreamers, and doers.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.6 }}
                  style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                >
                  <Link to="/join">
                    <motion.button
                      className="btn-primary"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 243, 255, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      JOIN THE CLUB <ArrowRight size={20} />
                    </motion.button>
                  </Link>
                  <Link to="/leaderboard">
                    <motion.button
                      className="btn-secondary"
                      whileHover={{ scale: 1.05, borderColor: 'var(--accent)', color: 'var(--accent)', boxShadow: '0 0 25px rgba(0, 243, 255, 0.15)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      VIEW LEADERBOARD
                    </motion.button>
                  </Link>
                </motion.div>
              </div>

              {/* Right Column: Image Gallery */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ position: 'relative', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="hero-gallery"
              >
                {/* Floating Images Collage */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    top: '12%',
                    right: '5%',
                    width: '260px',
                    height: '320px',
                    zIndex: 2,
                    border: '1px solid rgba(0, 243, 255, 0.4)',
                    background: 'var(--bg-card)',
                    padding: '8px',
                    transform: 'rotate(5deg)',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
                  }}
                >
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 2 }}></div>
                    <img src="/mascot.jpg" alt="LOOP Mascot" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'none' }} />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  style={{
                    position: 'absolute',
                    bottom: '8%',
                    left: '8%',
                    width: '280px',
                    height: '200px',
                    zIndex: 3,
                    border: '1px solid rgba(0, 243, 255, 0.6)',
                    background: 'var(--bg-main)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    padding: '6px',
                    transform: 'rotate(-3deg)'
                  }}
                >
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', zIndex: 2 }}></div>
                    <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1000&auto=format&fit=crop" alt="Conference" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(15%) contrast(1.1)' }} />
                  </div>
                </motion.div>

                {/* Ambient Glow Refinement */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '450px',
                  height: '450px',
                  background: 'radial-gradient(circle, rgba(0, 243, 255, 0.15) 0%, transparent 70%)',
                  filter: 'blur(80px)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}></div>
              </motion.div>
            </div>

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
        <div style={{ padding: '8rem 0', textAlign: 'center', background: 'transparent' }}>
          <div className="container">
            <h2 style={{ fontSize: '3rem', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
              READY TO <span style={{ color: 'var(--accent)' }}>BUILD</span> THE IMPOSSIBLE?
            </h2>
            <Link to="/join">
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.1, boxShadow: '0 0 50px rgba(0, 243, 255,0.4)' }}
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
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 5px var(--accent);
        }

        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(60px); }
        }

        .btn-primary {
          background: var(--accent);
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

        . {
          text-shadow: 0 0 30px rgba(0, 243, 255, 0.5);
        }

        @media (max-width: 768px) {
            .btn-primary, .btn-secondary {
                width: 100%;
                justify-content: center;
            }
            .hero-grid {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
                text-align: center;
            }
            .hero-grid > div:first-child {
                text-align: center !important;
            }
            .hero-gallery {
                display: none !important; /* Hide complex gallery on mobile or simplify */
            }
        }
      `}</style>
    </>
  );
};

export default Home;
