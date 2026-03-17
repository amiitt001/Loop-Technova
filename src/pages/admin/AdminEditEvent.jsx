import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, MapPin, User, FileText, Globe } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import FormBuilder from '../../components/admin/FormBuilder';

const AdminEditEvent = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [questions, setQuestions] = useState([]); // Dynamic Form Questions
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        speaker: '',
        description: '',
        registrationLink: '',
        status: 'Upcoming',
        eventType: 'Minor',
        dateSoon: false,
        locationSoon: false,
        registrationSoon: false
    });

    // Fetch Event Data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();

                    // Format date for input type="date"
                    let dateStr = '';
                    if (data.date && data.date.toDate) {
                        dateStr = data.date.toDate().toISOString().split('T')[0];
                    } else if (data.date && typeof data.date === 'string') {
                        // Attempt to handle string date if stored differently
                        dateStr = data.date.split('T')[0];
                    }

                    const isDateSoon = data.date === "Announcing soon";
                    setFormData({
                        title: data.title || '',
                        date: dateStr,
                        time: data.time || '',
                        location: data.location || '',
                        speaker: data.speaker || '',
                        description: data.description || '',
                        registrationLink: data.registrationLink || '',
                        status: data.status || 'Upcoming',
                        eventType: data.eventType || 'Minor',
                        dateSoon: isDateSoon,
                        locationSoon: data.location === "soon" || data.location === "Announcing soon",
                        registrationSoon: data.registrationSoon || false
                    });
                    setQuestions(data.questions || []);
                } else {
                    alert("Event not found!");
                    navigate('/admin/events');
                }
            } catch (error) {
                console.error("Error fetching event: ", error);
                alert("Error loading event.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const eventData = {
                ...formData,
                registrationOpen: formData.status === 'Upcoming',
                registrationSoon: formData.registrationSoon,
                questions: questions,
                updatedAt: new Date()
            };

            // Handle "Announce soon" for date
            if (formData.dateSoon) {
                eventData.date = "Announcing soon";
            } else {
                eventData.date = new Date(formData.date);
            }

            // Handle "Soon" for location
            if (formData.locationSoon) {
                eventData.location = "Announcing soon";
            }

            const docRef = doc(db, "events", id);
            await updateDoc(docRef, eventData);
            alert("Event Updated Successfully!");
            navigate('/admin/events');
        } catch (error) {
            console.error("Error updating event: ", error);
            alert("Error updating event: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-main text-center py-10">Loading event...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/admin/events')}
                className="bg-transparent border-none text-zinc-400 flex items-center gap-2 mb-8 cursor-pointer text-sm hover:text-main transition-colors"
            >
                <ArrowLeft size={18} /> Back to Events
            </button>

            <h1 className="text-3xl font-bold mb-8 text-main">Edit Event</h1>

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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-zinc-400 text-sm">
                                <Calendar size={14} /> Date
                            </label>
                            <label className="flex items-center gap-2 text-zinc-500 text-xs cursor-pointer hover:text-main">
                                <input
                                    type="checkbox"
                                    name="dateSoon"
                                    checked={formData.dateSoon}
                                    onChange={handleChange}
                                />
                                Announce soon
                            </label>
                        </div>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required={!formData.dateSoon}
                            disabled={formData.dateSoon}
                            className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors ${formData.dateSoon ? 'opacity-50 grayscale' : ''}`}
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-zinc-400 text-sm">
                                <MapPin size={14} /> Venue / Location
                            </label>
                            <label className="flex items-center gap-2 text-zinc-500 text-xs cursor-pointer hover:text-main">
                                <input
                                    type="checkbox"
                                    name="locationSoon"
                                    checked={formData.locationSoon}
                                    onChange={handleChange}
                                />
                                Soon
                            </label>
                        </div>
                        <input
                            type="text"
                            name="location"
                            value={formData.locationSoon ? 'soon' : formData.location}
                            onChange={handleChange}
                            required={!formData.locationSoon}
                            disabled={formData.locationSoon}
                            placeholder="e.g. Main Auditorium"
                            className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors ${formData.locationSoon ? 'opacity-50 grayscale' : ''}`}
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-sm">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Active">Active (Live)</option>
                            <option value="Past">Past</option>
                        </select>
                    </div>

                    {/* Event Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-sm">Event Type</label>
                        <select
                            name="eventType"
                            value={formData.eventType}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="Minor">Minor Event (🟡)</option>
                            <option value="Major">Major Event (🔴)</option>
                        </select>
                    </div>
                </div>

                {/* Registration Soon Toggle */}
                <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                    <input
                        type="checkbox"
                        name="registrationSoon"
                        id="registrationSoon"
                        checked={formData.registrationSoon}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <label htmlFor="registrationSoon" className="text-zinc-300 text-sm cursor-pointer select-none">
                        Registration Opening Soon (Show "Open Soon" instead of "Closed")
                    </label>
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors resize-y"
                    />
                </div>

                {/* Dynamic Form Builder */}
                <FormBuilder questions={questions} setQuestions={setQuestions} />

                {/* Registration Link (External) */}
                <div className="flex flex-col gap-2 mt-4">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Globe size={14} /> External Registration Link (Optional)
                    </label>
                    <p className="text-xs text-zinc-500">
                        *If provided, the "Register" button will redirect here and skip the internal form.
                    </p>
                    <input
                        type="url"
                        name="registrationLink"
                        value={formData.registrationLink}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                    />
                </div>

                <div className="pt-6 border-t border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`
                            bg-[var(--accent)] text-main border-none rounded-lg py-3 px-8 text-base font-bold cursor-pointer flex items-center gap-2
                            ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--accent)]/80'}
                            transition-all
                        `}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminEditEvent;
