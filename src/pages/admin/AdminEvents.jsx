import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MoreVertical, RefreshCw, Trash2, Users } from 'lucide-react';
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
        setLoading(true);
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

    // Edit Event
    const handleEdit = async (event) => {
        const title = prompt("Edit Title:", event.title);
        if (title === null) return;
        const dateStr = prompt("Edit Date (YYYY-MM-DD):", event.dateDisplay);
        const status = prompt("Edit Status (Upcoming/Active/Past):", event.status);

        try {
            await updateDoc(doc(db, "events", event.id), {
                title: title || event.title,
                date: dateStr ? new Date(dateStr) : event.date,
                status: status || event.status
            });
        } catch (error) {
            console.error("Error updating event: ", error);
            alert("Error updating event.");
        }
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
                    {loading && <RefreshCw className="animate-spin text-[var(--neon-violet)]" size={20} />}
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-[var(--neon-violet)] text-white border-none rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer font-semibold hover:bg-[var(--neon-violet)]/80 transition-colors w-full md:w-auto"
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
                                        ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border-[var(--neon-cyan)]'
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
                            <div className={`flex items-center gap-2 text-xs font-medium ${event.registrationOpen ? 'text-green-500' : 'text-red-500'}`}>
                                {event.registrationOpen ? "• Registration Open" : "• Registration Closed"}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-end gap-2 flex-wrap">
                            <button
                                onClick={() => handleEdit(event)}
                                className="bg-zinc-800 text-white border-none py-1.5 px-3 rounded-md text-sm cursor-pointer hover:bg-zinc-700 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleManage(event)}
                                className="bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/20 py-1.5 px-3 rounded-md text-sm cursor-pointer hover:bg-[var(--neon-cyan)]/20 transition-colors"
                            >
                                Manage
                            </button>
                            <button
                                onClick={() => setSelectedEventForRegistrations(event)}
                                className="bg-[var(--neon-violet)]/10 text-[var(--neon-violet)] border border-[var(--neon-violet)]/20 py-1.5 px-3 rounded-md text-sm cursor-pointer hover:bg-[var(--neon-violet)]/20 transition-colors flex items-center gap-1"
                            >
                                <Users size={14} /> View Reg.
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
