import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Calendar, Trophy, Users, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const QuickActionChip = ({ label, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(0, 243, 255, 0.15)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-dim)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: 'var(--text-dim)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'border-color 0.2s',
            fontFamily: 'var(--font-mono)'
        }}
    >
        {label}
    </motion.button>
);

const parseDate = (dateField) => {
    if (!dateField) return new Date();
    if (dateField.toDate) return dateField.toDate(); // Firestore Timestamp
    return new Date(dateField);
};

const EventCard = ({ event }) => (
    <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--accent-glow)',
        borderRadius: '8px',
        padding: '10px',
        marginTop: '8px',
        maxWidth: '100%'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>{event.title}</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(0, 243, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {parseDate(event.date).toLocaleDateString()}
            </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.description || "Join us for this amazing event!"}
        </p>
    </div>
);

const LeaderboardCard = ({ contestant }) => (
    <div style={{
        background: 'linear-gradient(45deg, rgba(255,215,0,0.1), rgba(0,0,0,0.3))',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '8px',
        padding: '10px',
        marginTop: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    }}>
        <div style={{ fontSize: '1.5rem' }}>👑</div>
        <div>
            <h4 style={{ fontSize: '0.9rem', color: '#ffd700', margin: 0 }}>{contestant.name}</h4>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {contestant.points} Points • @{contestant.platformHandle}
            </p>
        </div>
    </div>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "LOOP assistant online. How can I help?", sender: 'bot', type: 'text' }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    // Cache data
    const [dataCache, setDataCache] = useState({ events: [], members: [], contestants: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventsSnap = await getDocs(query(collection(db, "events")));
                const events = eventsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                const contestantsSnap = await getDocs(query(collection(db, "contestants"), orderBy("points", "desc"), limit(5)));
                const contestants = contestantsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                setDataCache({ events, contestants });
            } catch (error) {
                console.error("Chatbot data fetch error:", error);
            }
        };
        if (isOpen && dataCache.events.length === 0) fetchData();
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const processResponse = (input) => {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('join') || lowerInput.includes('recruit')) {
            return {
                text: "To join LOOP, head over to the Join Us page and fill out the application. We recruit every semester!",
                type: 'text'
            };
        }

        if (lowerInput.includes('event') || lowerInput.includes('hackathon') || lowerInput.includes('next')) {
            const nextEvent = dataCache.events
                .filter(e => e.status !== 'Past')
                .sort((a, b) => parseDate(a.date) - parseDate(b.date))[0];

            if (nextEvent) {
                return {
                    text: "Here is our next upcoming event:",
                    type: 'event-card',
                    data: nextEvent
                };
            }
            return { text: "No upcoming events scheduled at the moment, but stay tuned!", type: 'text' };
        }

        if (lowerInput.includes('leaderboard') || lowerInput.includes('top') || lowerInput.includes('rank')) {
            if (dataCache.contestants.length > 0) {
                return {
                    text: "Current top performer on the Leaderboard:",
                    type: 'leaderboard-card',
                    data: dataCache.contestants[0]
                };
            }
            return { text: "Check out the Leaderboard page for the full rankings!", type: 'text' };
        }

        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            return { text: "Hello! detailed queries: 'Next Event', 'Leaderboard', 'Join Team'.", type: 'text' };
        }

        if (lowerInput.includes('about') || lowerInput.includes('loop') || lowerInput.includes('club')) {
            return {
                text: "LOOP (League of Oriented Programmers) is the official coding club of GCET. We foster a community of developers, designers, and innovators through hackathons, workshops, and projects.",
                type: 'text'
            };
        }

        if (lowerInput.includes('contact') || lowerInput.includes('mail') || lowerInput.includes('email') || lowerInput.includes('reach')) {
            return {
                text: "You can reach us at 'loop.gcetclub@gmail.com' or use the 'Get in Touch' form at the bottom of the home page. Connect with us on Instagram @gcetloop!",
                type: 'text'
            };
        }

        return { text: "I can help with Events, Leaderboard, or Joining. Try using the quick actions below!", type: 'text' };
    };

    const handleSend = async (textOverride = null) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
        if (!textToSend.trim()) return;

        // User Message
        const userMessage = { id: Date.now(), text: textToSend, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Process Bot Response
        setTimeout(() => {
            const response = processResponse(textToSend);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: response.text,
                sender: 'bot',
                type: response.type,
                data: response.data
            }]);
            setIsTyping(false);
        }, 800 + Math.random() * 500); // Natural delay
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
                                            src="/mascot_3d.png" // Ensure this path is correct
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
                            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            marginBottom: '1rem',
                                            maxWidth: '85%'
                                        }}
                                    >
                                        <div style={{
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            background: msg.sender === 'user' ? 'var(--accent)' : 'rgba(0, 0, 0, 0.6)',
                                            color: msg.sender === 'user' ? '#000' : '#fff',
                                            border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                            fontSize: '0.9rem',
                                            borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                            borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px'
                                        }}>
                                            {msg.text}
                                            {/* Rich Content Rendering */}
                                            {msg.type === 'event-card' && msg.data && <EventCard event={msg.data} />}
                                            {msg.type === 'leaderboard-card' && msg.data && <LeaderboardCard contestant={msg.data} />}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <motion.div
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{ color: 'var(--accent)', fontSize: '0.8rem' }}
                                        >
                                            typing...
                                        </motion.div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Actions */}
                            <div style={{ padding: '0 1rem 0.5rem 1rem', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
                                <QuickActionChip label="📅 Next Event" onClick={() => handleSend("When is the next event?")} />
                                <QuickActionChip label="🏆 Leaderboard" onClick={() => handleSend("Show me the leaderboard top rank")} />
                                <QuickActionChip label="🤝 Join LOOP" onClick={() => handleSend("How can I join?")} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{
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
