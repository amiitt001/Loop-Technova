import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';



const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "LOOP assistant online. Ask about projects, events, leaderboard, or joining.", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    // Cache data to avoid fetching on every message
    const [dataCache, setDataCache] = useState({ events: [], members: [], contestants: [] });

    useEffect(() => {
        // Fetch data once on mount (or when chat opens)
        const fetchData = async () => {
            try {
                // Events
                const eventsSnap = await getDocs(query(collection(db, "events")));
                const events = eventsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                // Members (Top 5 for context)
                const membersSnap = await getDocs(query(collection(db, "members"), orderBy("name"), limit(5)));
                const members = membersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                // Contestants (Leaderboard)
                const contestantsSnap = await getDocs(query(collection(db, "contestants"), orderBy("points", "desc"), limit(5)));
                const contestants = contestantsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                setDataCache({ events, members, contestants });
            } catch (error) {
                console.error("Chatbot data fetch error:", error);
            }
        };

        fetchData();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userText = inputText.trim();
        const userMessage = { id: Date.now(), text: userText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        // Process input (Simulated AI with Real Data Context)
        const lowerInput = userText.toLowerCase();
        let botResponseText = "";

        if (lowerInput.includes('join') || lowerInput.includes('member') || lowerInput.includes('recruit')) {
            botResponseText = "To join LOOP, fill out the application form on the 'Join Us' page. We recruit new members at the start of every semester based on technical skills and passion.";
        } else if (lowerInput.includes('leaderboard') || lowerInput.includes('rank') || lowerInput.includes('points') || lowerInput.includes('top')) {
            if (dataCache.contestants.length > 0) {
                const top = dataCache.contestants[0];
                botResponseText = `Our current top contestant is ${top.name} (@${top.platformHandle}) with ${top.points} points! The leaderboard tracks external competition performance.`;
            } else {
                botResponseText = "Our Leaderboard tracks contestant performance in our open hackathons and challenges.";
            }
        } else if (lowerInput.includes('project') || lowerInput.includes('work') || lowerInput.includes('tech')) {
            botResponseText = "We work on cutting-edge projects in AI, Web3, and Mobile Dev. Check out the 'Projects' page to see our latest work.";
        } else if (lowerInput.includes('event') || lowerInput.includes('hackathon') || lowerInput.includes('workshop') || lowerInput.includes('next')) {
            const nextEvent = dataCache.events
                .filter(e => e.status !== 'Past')
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

            if (nextEvent) {
                const dateStr = new Date(nextEvent.date).toLocaleDateString();
                botResponseText = `The next big event is '${nextEvent.title}' on ${dateStr}. Don't miss it!`;
            } else {
                botResponseText = "We host monthly hackathons and weekly workshops. Check the Events tab for future updates.";
            }
        } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            botResponseText = "System online. Accessing protocol... Hello! How can I assist you with LOOP today?";
        } else {
            botResponseText = "Command not recognized. I can provide info on: Projects, Events, The Leaderboard, or How to Join.";
        }

        // Delay bot response slightly for realism
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponseText, sender: 'bot' }]);
        }, 600);
    };

    return (
        <>
            <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            style={{
                                width: '350px',
                                height: '500px',
                                background: 'rgba(10, 10, 10, 0.1)',
                                borderRadius: '16px',
                                border: '1px solid var(--accent)',
                                boxShadow: '0 0 30px rgba(0, 243, 255, 0.15)',
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(0, 243, 255, 0.1)',
                                borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--accent)' }}>
                                        <motion.img
                                            src="/mascot_3d.png"
                                            alt="Bot"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            animate={{ y: [0, -2, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '1px' }}>LOOP ASSISTANT</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            marginBottom: '1rem'
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '80%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            background: msg.sender === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                            color: msg.sender === 'user' ? '#000' : '#fff',
                                            border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                            fontSize: '0.9rem',
                                            borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                            borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px'
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSend} style={{
                                padding: '1rem',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a command..."
                                    style={{
                                        flex: 1,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--border-dim)',
                                        borderRadius: '8px',
                                        padding: '0.8rem',
                                        color: '#fff',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-dim)'}
                                />
                                <button type="submit" style={{
                                    background: 'var(--accent)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    width: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#000'
                                }}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Toggle Button */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 20px var(--accent)' }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
                        position: 'absolute',
                        bottom: 0,
                        right: 0
                    }}
                >
                    {isOpen ? (
                        <X size={28} color="#000" />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                            <motion.img
                                src="/mascot_3d.png"
                                alt="Chat"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    )}
                </motion.button>
            </div>
        </>
    );
};

export default Chatbot;
