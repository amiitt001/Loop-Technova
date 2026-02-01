import React from 'react';
import { Github, ExternalLink, Code, Layers, Database, Cpu } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';

const PROJECTS = [
    {
        id: 1,
        title: 'Neon AI Assistant',
        description: 'A voice-activated AI assistant for developers with real-time code analysis.',
        tags: ['Python', 'TensorFlow', 'React'],
        link: '#',
        icon: <Cpu size={40} color="var(--accent)" />
    },
    {
        id: 2,
        title: 'Technova App',
        description: 'Official mobile app for the club, featuring event tracking and QR attendance.',
        tags: ['Flutter', 'Firebase', 'Dart'],
        link: '#',
        icon: <Layers size={40} color="var(--accent)" />
    },
    {
        id: 3,
        title: 'Quantum Ledger',
        description: 'Blockchain-based voting system for student council elections.',
        tags: ['Solidity', 'Web3.js', 'Next.js'],
        link: '#',
        icon: <Database size={40} color="var(--accent)" />
    },
    {
        id: 4,
        title: 'AlgoVisualizer',
        description: 'Interactive visualization tool for sorting and pathfinding algorithms.',
        tags: ['JavaScript', 'D3.js', 'HTML5'],
        link: '#',
        icon: <Code size={40} color="#ff0055" />
    },
    {
        id: 5,
        title: 'Campus Bot',
        description: 'Discord bot that manages server roles and announces college updates.',
        tags: ['Node.js', 'Discord.js', 'MongoDB'],
        link: '#',
        icon: <Layers size={40} color="#ffff00" />
    }
];

const Projects = () => {
    return (
        <div className="container" style={{ padding: '8rem 0 4rem' }}>
            <ThreeBackground variant="projects" />
            <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
                <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>PROJECTS</h1>
                <p style={{ color: 'var(--text-dim)' }}>Pushing the boundaries of what's possible.</p>
            </div>

            <div className="projects-grid">
                {PROJECTS.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
            </div>

            <style>{`
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
      `}</style>
        </div>
    );
};

const ProjectCard = ({ project, index }) => {
    return (
        <div className="project-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', width: 'fit-content', padding: '1rem', borderRadius: '12px' }}>
                {project.icon}
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{project.title}</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {project.description}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {project.tags.map(tag => (
                    <span key={tag} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '20px',
                        color: 'var(--accent)',
                        border: '1px solid rgba(0, 243, 255, 0.1)'
                    }}>
                        {tag}
                    </span>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                <a href={project.link} className="project-link">
                    <Github size={18} /> Source
                </a>
                <a href={project.link} className="project-link">
                    <ExternalLink size={18} /> Demo
                </a>
            </div>

            <style>{`
        .project-card {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          padding: 2rem;
          border-radius: 16px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .project-card:hover {
          transform: translateY(-10px);
          border-color: var(--accent);
          box-shadow: 0 10px 40px -10px rgba(0, 243, 255, 0.15);
        }
        .project-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, var(--accent), var(--accent));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .project-card:hover::before {
          opacity: 1;
        }

        .project-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-dim);
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }
        .project-link:hover {
          color: #fff;
        }
      `}</style>
        </div>
    );
};

export default Projects;
