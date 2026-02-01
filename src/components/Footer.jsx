import { Github, Instagram, Linkedin, Heart, Users } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            padding: '4rem 0 2rem',
            textAlign: 'center',
            borderTop: '1px solid var(--border-dim)',
            background: 'transparent'
        }}>
            <div className="container">
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>TECHNOVA</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
                    Innovating the future, one line of code at a time.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                    <SocialLink icon={Github} href="https://github.com/amiitt001/Loop-Technova" />
                    <SocialLink icon={Instagram} href="https://www.instagram.com/gcetloop" />
                    <SocialLink icon={Linkedin} href="https://www.linkedin.com/company/loop-technova" />
                    <SocialLink icon={Users} href="https://chat.whatsapp.com/DorLpvdoaj69wPMnZWhz9N" />
                </div>

                <p style={{ color: '#555', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Built with <Heart size={14} color="var(--accent)" fill="var(--accent)" /> by Technova Team &copy; 2026
                </p>
            </div>
        </footer>
    );
};

const SocialLink = ({ icon: Icon, href }) => (
    <a href={href} style={{
        color: 'var(--text-dim)',
        transition: 'all 0.3s ease',
        padding: '0.5rem',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-dim)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        <Icon size={20} />
    </a>
);

export default Footer;
