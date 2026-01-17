import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, MapPin, User, FileText, Globe } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AdminCreateEvent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        description: '',
        registrationLink: '',
        status: 'Upcoming'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "events"), {
                ...formData,
                date: new Date(formData.date), // Convert string to Date
                registrationOpen: formData.status === 'Upcoming',
                createdAt: new Date()
            });
            alert("Event Created Successfully!");
            navigate('/admin/events');
        } catch (error) {
            console.error("Error creating event: ", error);
            alert("Error creating event: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/admin/events')}
                className="bg-transparent border-none text-zinc-400 flex items-center gap-2 mb-8 cursor-pointer text-sm hover:text-white transition-colors"
            >
                <ArrowLeft size={18} /> Back to Events
            </button>

            <h1 className="text-3xl font-bold mb-8 text-white">Create New Event</h1>

            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 flex flex-col gap-6">
                {/* Title */}
                <div className="flex flex-col gap-2">
                    <label className="text-zinc-400 text-sm">Event Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. AI Workshop 2026"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Calendar size={14} /> Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                        />
                    </div>

                    {/* Time */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Clock size={14} /> Time
                        </label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                        />
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <MapPin size={14} /> Venue / Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Main Auditorium"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-sm">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                        >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Active">Active (Live)</option>
                            <option value="Past">Past</option>
                        </select>
                    </div>
                </div>

                {/* Speaker */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <User size={14} /> Speaker (Optional)
                    </label>
                    <input
                        type="text"
                        name="speaker"
                        value={formData.speaker}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Jane Doe"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <FileText size={14} /> Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Project detailed agenda, prerequisites, etc."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors resize-y"
                    />
                </div>

                {/* Registration Link (External) */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Globe size={14} /> External Registration Link (Optional)
                    </label>
                    <input
                        type="url"
                        name="registrationLink"
                        value={formData.registrationLink}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-violet)] transition-colors"
                    />
                </div>

                <div className="pt-6 border-t border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            bg-[var(--neon-violet)] text-white border-none rounded-lg py-3 px-8 text-base font-bold cursor-pointer flex items-center gap-2
                            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--neon-violet)]/80'}
                            transition-all
                        `}
                    >
                        <Save size={18} />
                        {loading ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreateEvent;
