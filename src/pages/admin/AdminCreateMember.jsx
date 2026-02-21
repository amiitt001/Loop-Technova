import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Shield, Camera, Github, Linkedin, Trophy, Code, Zap, Cpu } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const AdminCreateMember = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: 'Member',
        admissionNo: '',
        branch: '',
        year: '',
        active: true,
        img: '',
        linkedin: '',
        github: '',
        domain: '',
        latestAchievement: '',
        projectCount: '',
        rating: 5,
        techStack: ''
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
                admissionNo: formData.admissionNo,
                branch: formData.branch,
                year: formData.year,
                active: formData.active,
                img: formData.img || '', // Optional photo
                social: { // Nested social links
                    linkedin: formData.linkedin || '',
                    github: formData.github || ''
                },
                domain: formData.domain || 'Member',
                latestAchievement: formData.latestAchievement || '',
                projectCount: formData.projectCount || '',
                rating: Number(formData.rating) || 5,
                techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()) : [],
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
                className="bg-transparent border-none text-zinc-400 flex items-center gap-2 mb-8 cursor-pointer text-sm hover:text-main transition-colors"
            >
                <ArrowLeft size={18} /> Back to Members
            </button>

            <h1 className="text-3xl font-bold mb-8 text-main">Add New Member</h1>

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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="Head">Head</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Coordinator">Coordinator</option>
                            <option value="Member">Member</option>
                        </select>
                    </div>

                    {/* Domain */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield size={14} /> Domain
                        </label>
                        <select
                            name="domain"
                            value={formData.domain}
                            onChange={handleChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="">Select Domain</option>
                            <option value="Full Stack Team">Full Stack Team</option>
                            <option value="Frontend Team">Frontend Team</option>
                            <option value="Backend Team">Backend Team</option>
                            <option value="AI/ML Team">AI/ML Team</option>
                            <option value="Mobile Team">Mobile Team</option>
                            <option value="Design Team">Design Team</option>
                            <option value="DevOps Team">DevOps Team</option>
                        </select>
                    </div>

                    {/* Admission No */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield size={14} /> Admission No.
                        </label>
                        <input
                            type="text"
                            name="admissionNo"
                            value={formData.admissionNo}
                            onChange={handleChange}
                            required
                            placeholder="e.g. 23XXXX"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>

                    {/* Branch */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield size={14} /> Branch
                        </label>
                        <select
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="">Select Branch</option>
                            <option value="CSE">CSE</option>
                            <option value="IT">IT</option>
                            <option value="ECE">ECE</option>
                            <option value="ME">ME</option>
                            <option value="EE">EE</option>
                            <option value="Civil">Civil</option>
                            <option value="Ai&DS">Ai&DS</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Year */}
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield size={14} /> Year
                        </label>
                        <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        >
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                    />
                </div>

                {/* Extended Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Trophy size={14} /> Latest Achievement
                        </label>
                        <input
                            type="text"
                            name="latestAchievement"
                            value={formData.latestAchievement}
                            onChange={handleChange}
                            placeholder="e.g. Won 1st Place at Hackathon"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Code size={14} /> Projects Count
                        </label>
                        <input
                            type="text"
                            name="projectCount"
                            value={formData.projectCount}
                            onChange={handleChange}
                            placeholder="e.g. 15+"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Zap size={14} /> Rating (0-5)
                        </label>
                        <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            min="0"
                            max="5"
                            step="0.5"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Cpu size={14} /> Tech Stack (comma separated)
                        </label>
                        <input
                            type="text"
                            name="techStack"
                            value={formData.techStack}
                            onChange={handleChange}
                            placeholder="e.g. React, Node.js, Python"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-main outline-none focus:border-[var(--accent)] transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            bg-[var(--accent)] text-black border-none rounded-lg py-3 px-8 text-base font-bold cursor-pointer flex items-center gap-2
                            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--accent)]/80'}
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
