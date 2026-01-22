import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Instagram, Linkedin, Github, Send, Users } from 'lucide-react';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const HomeContact = () => {
    const [formState, setFormState] = useState({ name: '', email: '', message: '' });
    const [isSent, setIsSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Spam Protection State
    const [startTime] = useState(Date.now());
    const [honeypot, setHoneypot] = useState('');



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Spam Check 1: Honeypot (Bot Trap)
        if (honeypot) {
            console.log("Bot detected (honeypot)");
            return;
        }

        // Spam Check 2: Time-based (Speed Trap)
        if (Date.now() - startTime < 3000) {
            alert("Please take your time to fill out the form.");
            return;
        }

        try {
            setIsSending(true);
            await addDoc(collection(db, "messages"), {
                ...formState,
                createdAt: serverTimestamp(),
                read: false
            });
            setIsSent(true);
            setFormState({ name: '', email: '', message: '' });
            setFormState({ name: '', email: '', message: '' });
            setTimeout(() => setIsSent(false), 5000);
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div id="contact" style={{
            padding: '4rem 2rem',
            // background: 'var(--bg-dark)', // Assuming global background, can uncomment if needed
            color: 'var(--text-main)',
            display: 'flex',
            justifyContent: 'center',
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4rem',
                maxWidth: '1200px',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Left Side */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ flex: '1 1 300px', maxWidth: '500px' }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--neon-cyan)' }}>Get in Touch</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6', color: 'var(--text-dim)' }}>
                        Have a question or want to collaborate? Connect with us on social media or send us a message!
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                        <a href="https://github.com/amiitt001" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Github style={{ cursor: 'pointer' }} /></a>
                        <a href="https://www.instagram.com/gcetloop" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Instagram style={{ cursor: 'pointer' }} /></a>
                        <a href="https://www.linkedin.com/in/amiitt001" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Linkedin style={{ cursor: 'pointer' }} /></a>
                        <a href="https://chat.whatsapp.com/DorLpvdoaj69wPMnZWhz9N" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Users style={{ cursor: 'pointer' }} /></a>
                    </div>
                </motion.div>

                {/* Form Side */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ flex: '1 1 300px', maxWidth: '500px', width: '100%' }}
                >
                    {!isSent ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    required
                                    value={formState.name}
                                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-dim)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--neon-cyan)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    required
                                    value={formState.email}
                                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-dim)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--neon-cyan)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
                                />
                            </div>
                            <div>
                                <textarea
                                    placeholder="What's on your mind?"
                                    rows="4"
                                    required
                                    value={formState.message}
                                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-dim)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--neon-cyan)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
                                ></textarea>
                            </div>



                            {/* Honeypot Field (Hidden) */}
                            <input
                                type="text"
                                name="website_contact_check"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                style={{ display: 'none', tabindex: '-1', autocomplete: 'off' }}
                            />

                            <button
                                type="submit"
                                disabled={isSending}
                                className="contact-btn"
                                style={{
                                    padding: '1rem',
                                    background: isSending ? 'var(--bg-card)' : 'var(--neon-cyan)',
                                    color: isSending ? 'var(--text-dim)' : '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: isSending ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s ease'
                                }}>
                                {isSending ? 'SENDING...' : 'SEND MESSAGE'} <Send size={18} />
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            border: '1px solid var(--neon-green)',
                            background: 'rgba(0,255,0,0.05)',
                            borderRadius: '16px',
                            padding: '2rem'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--neon-green)' }}>Message Sent!</h3>
                            <p style={{ color: 'var(--text-dim)' }}>We'll get back to you shortly.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default HomeContact;
