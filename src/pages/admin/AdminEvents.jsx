import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MoreVertical, RefreshCw, Trash2, Users, Link as LinkIcon } from 'lucide-react';
import { db } from '../../firebase';
import { collection, updateDoc, deleteDoc, doc, query, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminRegistrationsModal from '../../components/admin/AdminRegistrationsModal';

const AdminEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null);

    // Real-time Events Listener
    useEffect(() => {
        const q = query(collection(db, "events"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsList = snapshot.docs.map(doc => {
                const data = doc.data();
                const dateDisplay = data.date?.toDate ? data.date.toDate().toLocaleDateString() : data.date;
                return {
                    id: doc.id,
                    ...data,
                    dateDisplay
                };
            });
            eventsList.sort((a, b) => new Date(b.date) - new Date(a.date));

            setEvents(eventsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Create Event (Navigation)
    const handleCreate = () => {
        navigate('/admin/events/new');
    };

    // Copy Registration Link
    const handleCopyLink = (event) => {
        const link = `${window.location.origin}/events?register=${event.id}`;
        navigator.clipboard.writeText(link).then(() => {
            alert("Registration link copied to clipboard!");
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert("Failed to copy link.");
        });
    };

    // Edit Event
    const handleEdit = (event) => {
        navigate(`/admin/events/edit/${event.id}`);
    };

    // Manage Event (Toggle Registration)
    const handleManage = async (event) => {
        const newStatus = !event.registrationOpen;
        if (!window.confirm(`Turn registration ${newStatus ? "ON" : "OFF"} for "${event.title}"?`)) return;

        try {
            await updateDoc(doc(db, "events", event.id), {
                registrationOpen: newStatus
            });
            alert(`Registration is now ${newStatus ? "OPEN" : "CLOSED"}`);
        } catch (error) {
            console.error("Error managing event: ", error);
        }
    };

    // Delete Event
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        try {
            await deleteDoc(doc(db, "events", id));
        } catch (error) {
            console.error("Error deleting event: ", error);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
                    {loading && <RefreshCw className="animate-spin text-[var(--accent)]" size={20} />}
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[var(--accent)] text-main border-none rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer font-semibold hover:bg-[var(--accent)]/80 transition-colors w-full md:w-auto"
                >
                    <Plus size={18} /> Create Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.length === 0 && !loading && <p className="text-zinc-500 col-span-full text-center py-8">No events found.</p>}

                {events.map((event) => (
                    <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative flex flex-col hover:border-zinc-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`
                                text-xs px-2.5 py-1 rounded-full border
                                ${event.status === 'Active'
                                    ? 'bg-green-500/10 text-green-500 border-green-500'
                                    : event.status === 'Upcoming'
                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]'
                                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                }
                            `}>
                                {event.status}
                            </span>
                            <button
                                onClick={() => handleDelete(event.id)}
                                className="bg-transparent border-none text-red-500 hover:text-red-400 cursor-pointer p-1"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold mb-3 overflow-hidden text-ellipsis line-clamp-2 min-h-[3.5rem]">{event.title}</h3>

                        <div className="flex flex-col gap-2 text-zinc-400 text-sm mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} /> {event.dateDisplay}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} /> {event.location || 'TBD'}
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-medium ${event.registrationOpen ? 'text-green-500' : (event.registrationSoon ? 'text-[var(--accent)]' : 'text-red-500')}`}>
                                {event.registrationOpen ? "• Registration Open" : (event.registrationSoon ? "• Registration Open Soon" : "• Registration Closed")}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-3">
                            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                <button
                                    onClick={() => handleEdit(event)}
                                    className="bg-zinc-800 text-main border-none py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-zinc-700 transition-colors flex justify-center items-center"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleManage(event)}
                                    className="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-[var(--accent)]/20 transition-colors flex justify-center items-center"
                                >
                                    Manage
                                </button>
                                <button
                                    onClick={() => handleCopyLink(event)}
                                    title="Copy Registration Link"
                                    className="bg-zinc-800 text-zinc-400 border-none py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-zinc-700 hover:text-main transition-colors flex items-center justify-center"
                                >
                                    <LinkIcon size={16} />
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedEventForRegistrations(event)}
                                className="w-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-[var(--accent)]/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Users size={16} /> View Registrations
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <AdminRegistrationsModal
                event={selectedEventForRegistrations}
                onClose={() => setSelectedEventForRegistrations(null)}
            />
        </div>
    );
};

export default AdminEvents;
