import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Clock, MapPin, User, ArrowLeft, Globe } from 'lucide-react';
import RegistrationForm from '../components/RegistrationForm';


const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setEvent({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("Event not found");
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-center">
                <h2 className="text-2xl font-bold text-main mb-4">Event Not Found</h2>
                <button
                    onClick={() => navigate('/events')}
                    className="text-[var(--accent)] hover:underline"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    const scrollToRegistration = () => {
        const element = document.getElementById('registration-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const dateDisplay = event.date?.toDate ? event.date.toDate().toLocaleDateString() : event.date;

    return (
        <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-20 px-4">

            <div className="container max-w-5xl mx-auto">
                <button
                    onClick={() => navigate('/events')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-main transition-colors mb-8"
                >
                    <ArrowLeft size={18} /> Back to Timeline
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column: Event Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent)]/10 text-[var(--accent)] mb-4 border border-[var(--accent)]/20">
                                {event.status || 'UPCOMING'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-main mb-6 leading-tight">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap gap-6 text-zinc-300 mb-8">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[var(--accent)]" />
                                    <span>{dateDisplay}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-[var(--accent)]" />
                                    <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-[var(--accent)]" />
                                    <span>{event.location}</span>
                                </div>
                                {event.speaker && (
                                    <div className="flex items-center gap-2">
                                        <User size={18} className="text-[var(--accent)]" />
                                        <span>{event.speaker}</span>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Only: Jump to Register */}
                            <button
                                onClick={scrollToRegistration}
                                className="w-full md:hidden bg-[var(--accent)] text-black font-bold py-3 px-6 rounded-lg mb-8"
                            >
                                Scroll to Registration ↓
                            </button>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold text-main mb-4">About Event</h3>
                            <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {event.description || "No detailed description available."}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Registration Form */}
                    <div className="lg:col-span-1" id="registration-section">
                        <div className="sticky top-32">
                            <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/50">
                                <h3 className="text-xl font-bold text-main mb-6 border-b border-zinc-800 pb-4">
                                    Register Now
                                </h3>

                                {event.registrationLink ? (
                                    // External Link
                                    <div className="text-center py-6">
                                        <p className="text-zinc-400 mb-6">
                                            Registration for this event is hosted on an external platform.
                                        </p>
                                        <a
                                            href={event.registrationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 w-full bg-[var(--accent)] text-black font-bold py-3 px-6 rounded-lg hover:shadow-[0_0_15px_rgba(0, 243, 255,0.4)] transition-all"
                                        >
                                            Register Externally <Globe size={18} />
                                        </a>
                                    </div>
                                ) : event.registrationOpen ? (
                                    // Internal Form
                                    <RegistrationForm event={event} />
                                ) : (
                                    // Closed
                                    <div className="text-center py-8">
                                        <p className="text-zinc-500 mb-2">Registration is currently</p>
                                        <span className="text-xl font-bold text-red-500">CLOSED</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
