import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Users, Calendar, Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
            background: 'rgba(5, 5, 5, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 243, 255, 0.1)',
            height: '70px',
            display: 'flex',
            alignItems: 'center'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                padding: '0 1.5rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* LOGO */}
                <Link to="/" onClick={closeMenu} style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    zIndex: 1002
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <img src="/logo.png" alt="TN" style={{
                            height: '38px',
                            width: '38px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '2px solid var(--neon-cyan)',
                        }} />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2' }}>
                            <span style={{
                                fontSize: '1.2rem',
                                letterSpacing: '2px',
                                fontFamily: 'var(--font-display)',
                                fontWeight: '900',
                                color: '#fff',
                            }}>
                                <span className="text-neon-cyan">TECH</span>NOVA
                            </span>
                        </div>
                    </div>
                </Link>

                {/* DESKTOP NAV */}
                <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <NavLink to="/" icon={Terminal} label="Home" active={location.pathname === '/'} />
                    <NavLink to="/leaderboard" icon={Trophy} label="Leaderboard" active={location.pathname === '/leaderboard'} />
                    <NavLink to="/team" icon={Users} label="Team" active={location.pathname === '/team'} />
                    <NavLink to="/events" icon={Calendar} label="Events" active={location.pathname === '/events'} />

                    <Link to="/join" className="join-btn">JOIN US</Link>
                </div>

                {/* MOBILE TOGGLE */}
                <button className="mobile-toggle" onClick={toggleMenu} style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 1002
                }}>
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* MOBILE MENU OVERLAY */}
            <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', marginTop: '100px' }}>
                    <MobileNavLink to="/" onClick={closeMenu} label="Home" active={location.pathname === '/'} />
                    <MobileNavLink to="/leaderboard" onClick={closeMenu} label="Leaderboard" active={location.pathname === '/leaderboard'} />
                    <MobileNavLink to="/team" onClick={closeMenu} label="Team" active={location.pathname === '/team'} />
                    <MobileNavLink to="/events" onClick={closeMenu} label="Events" active={location.pathname === '/events'} />

                    <Link to="/join" onClick={closeMenu} className="join-btn" style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                        JOIN US
                    </Link>
                </div>
            </div>

            <style>{`
                .desktop-nav { display: flex; }
                .mobile-toggle { display: none; }
                .mobile-menu {
                    position: fixed;
                    top: 0;
                    right: -100%;
                    width: 100%;
                    height: 100vh;
                    background: #050505;
                    transition: 0.3s ease-in-out;
                    z-index: 1001;
                    display: flex;
                    flex-direction: column;
                }
                .mobile-menu.open { right: 0; }

                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-toggle { display: block; }
                }

                .join-btn {
                    background: transparent;
                    border: 1px solid var(--neon-cyan);
                    color: var(--neon-cyan);
                    padding: 0.5rem 1.5rem;
                    font-family: var(--font-mono);
                    font-weight: bold;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }
                .join-btn:hover {
                    background: var(--neon-cyan);
                    color: #000;
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.4);
                }
            `}</style>
        </nav>
    );
};

const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link to={to} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: active ? 'var(--neon-cyan)' : 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        transition: 'color 0.3s ease',
        padding: '0.5rem'
    }}
        onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'}
        onMouseLeave={(e) => e.target.style.color = active ? 'var(--neon-cyan)' : 'var(--text-dim)'}
    >
        <Icon size={16} />
        {label}
    </Link>
);

const MobileNavLink = ({ to, label, onClick, active }) => (
    <Link to={to} onClick={onClick} style={{
        fontSize: '1.5rem',
        fontFamily: 'var(--font-display)',
        color: active ? 'var(--neon-cyan)' : '#fff',
        textDecoration: 'none',
        letterSpacing: '1px'
    }}>
        {label}
    </Link>
);

export default Navbar;
