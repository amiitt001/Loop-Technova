import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

const Counter = ({ from, to }) => {
    const count = useSpring(from, { stiffness: 50, damping: 20 });
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [displayValue, setDisplayValue] = useState(from);

    useEffect(() => {
        const controls = animate(count, to, { duration: 2 });
        return controls.stop;
    }, [count, to]);

    useEffect(() => {
        const unsub = rounded.on("change", (v) => setDisplayValue(v));
        return unsub;
    }, [rounded]);

    return <span>{displayValue}+</span>;
};

const STATS = [
    { label: 'Hackathons', value: 12 },
    { label: 'Active Members', value: 85 },
    { label: 'Projects Built', value: 40 },
    { label: 'Years Active', value: 4 },
];

const CredibilityStrip = () => {
    return (
        <div style={{
            borderTop: '1px solid var(--border-dim)',
            borderBottom: '1px solid var(--border-dim)',
            background: 'transparent',
            backdropFilter: 'blur(2px)',
            padding: '2rem 0',
            position: 'relative',
            zIndex: 10
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
                {STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        style={{ textAlign: 'center' }}
                    >
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '900',
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-display)',
                            marginBottom: '0.5rem',
                            textShadow: '0 0 15px rgba(0, 243, 255, 0.3)'
                        }}>
                            <Counter from={0} to={stat.value} />
                        </div>
                        <div style={{
                            color: 'var(--text-dim)',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 'bold'
                        }}>
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CredibilityStrip;
