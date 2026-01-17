import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Shield, Camera, Github, Linkedin } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AdminCreateMember = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: 'Member',
        active: true,
        img: '',
        linkedin: '',
        github: ''
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "members"), {
                name: formData.name,
                role: formData.role,
                active: formData.active,
                img: formData.img || '', // Optional photo
                social: { // Nested social links
                    linkedin: formData.linkedin || '',
                    github: formData.github || ''
                },
                createdAt: new Date()
            });
            alert("Member Added Successfully!");
            navigate('/admin/members');
        } catch (error) {
            console.error("Error adding member: ", error);
            alert("Error adding member: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/admin/members')}
                className="bg-transparent border-none text-zinc-400 flex items-center gap-2 mb-8 cursor-pointer text-sm hover:text-white transition-colors"
            >
                <ArrowLeft size={18} /> Back to Members
            </button>

            <h1 className="text-3xl font-bold mb-8 text-white">Add New Member</h1>

            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 flex flex-col gap-6">
                {/* Name */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <User size={14} /> Full Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. John Doe"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Role */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield size={14} /> Role
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                        >
                            <option value="Head">Head</option>
                            <option value="Coordinator">Coordinator</option>
                            <option value="Member">Member</option>
                        </select>
                    </div>
                </div>

                {/* Profile Image */}
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Camera size={14} /> Profile Photo URL (Optional)
                    </label>
                    <input
                        type="text"
                        name="img"
                        value={formData.img}
                        onChange={handleChange}
                        placeholder="e.g. https://example.com/photo.jpg"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LinkedIn */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Linkedin size={14} /> LinkedIn URL (Optional)
                        </label>
                        <input
                            type="text"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="e.g. https://linkedin.com/in/johndoe"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                        />
                    </div>

                    {/* GitHub */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Github size={14} /> GitHub URL (Optional)
                        </label>
                        <input
                            type="text"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="e.g. https://github.com/johndoe"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[var(--neon-cyan)] transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            bg-[var(--neon-cyan)] text-black border-none rounded-lg py-3 px-8 text-base font-bold cursor-pointer flex items-center gap-2
                            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--neon-cyan)]/80'}
                            transition-all
                        `}
                    >
                        <Save size={18} />
                        {loading ? 'Adding...' : 'Add Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreateMember;
