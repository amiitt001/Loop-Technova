import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw, Mail, Phone, Linkedin, Github, Shield } from 'lucide-react';
import { safeHref } from '../../utils/security';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminMembers = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Real-time Members Listener
    useEffect(() => {
        const q = query(collection(db, "members"), orderBy("name", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMembers(membersList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching members: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Edit Member
    const handleEdit = (member) => {
        navigate(`/admin/members/edit/${member.id}`);
    };

    // Delete Member
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this member?")) return;
        try {
            await deleteDoc(doc(db, "members", id));
        } catch (error) {
            console.error("Error deleting member: ", error);
            alert("Error deleting member.");
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Organize members by role
    const mentors = filteredMembers.filter(m => /Mentor/i.test(m.role));
    const heads = filteredMembers.filter(m => /Head|Lead|President|Vice/i.test(m.role) && !/Mentor/i.test(m.role));
    const coordinators = filteredMembers.filter(m => /Coordinator/i.test(m.role) && !/Head|Lead|President|Vice|Mentor/i.test(m.role));
    const core = filteredMembers.filter(m => /Core/i.test(m.role) && !/Mentor/i.test(m.role));
    const generalMembers = filteredMembers.filter(m => !/Head|Lead|President|Vice|Coordinator|Core|Mentor/i.test(m.role));

    const renderMemberSection = (title, membersList) => {
        if (membersList.length === 0) return null;
        return (
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 text-[var(--accent)] border-b border-zinc-800 pb-2 inline-block pr-6">{title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {membersList.map((member) => (
                        <div key={member.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
                            <div className="p-6 flex flex-col items-center text-center border-b border-zinc-800">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 mb-4 border-2 border-[var(--accent)]/30">
                                    {member.img ? (
                                        <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-3xl font-bold">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-main mb-1">{member.name}</h3>
                                <p className="text-[var(--accent)] text-sm font-medium uppercase tracking-wider">{member.role}</p>
                            </div>

                            <div className="p-4 flex flex-col gap-3 text-sm text-zinc-400 flex-grow">
                                {member.admissionNo && (
                                    <div className="flex items-center gap-3 w-full">
                                        <Shield size={16} className="min-w-[16px] text-zinc-500" />
                                        <span className="text-zinc-300">{member.admissionNo}</span>
                                    </div>
                                )}
                                {(member.branch || member.year) && (
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] min-w-[16px]">
                                            <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                                        </div>
                                        <span className="text-zinc-400">
                                            {[member.branch, member.year].filter(Boolean).join(' • ')}
                                        </span>
                                    </div>
                                )}
                                {member.email && (
                                    <div className="flex items-center gap-3 overflow-hidden w-full">
                                        <Mail size={16} className="min-w-[16px]" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                )}
                                {member.phone && (
                                    <div className="flex items-center gap-3 w-full">
                                        <Phone size={16} className="min-w-[16px]" />
                                        <span>{member.phone}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-2 justify-center">
                                    {member.social?.linkedin && (
                                        <a href={safeHref(member.social.linkedin)} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#0077b5] transition-colors">
                                            <Linkedin size={20} />
                                        </a>
                                    )}
                                    {member.social?.github && (
                                        <a href={safeHref(member.social.github)} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-main transition-colors">
                                            <Github size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-950/50 flex gap-2">
                                <button
                                    onClick={() => handleEdit(member)}
                                    className="flex-1 bg-zinc-800 text-main border-none py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(member.id)}
                                    className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-2 px-3 rounded-md text-sm cursor-pointer hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Members</h1>
                    {loading && <RefreshCw className="animate-spin text-[var(--accent)]" size={20} />}
                </div>
                <button
                    onClick={() => navigate('/admin/members/new')}
                    className="bg-[var(--accent)] text-black hover:bg-[var(--accent)]/80 transition-colors border-none rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer font-semibold w-full md:w-auto"
                >
                    <Plus size={18} /> Add Member
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-main focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
            </div>

            {/* Member Sections */}
            {filteredMembers.length === 0 && !loading && (
                <div className="p-8 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800">
                    No members found.
                </div>
            )}

            {renderMemberSection("Mentors", mentors)}
            {renderMemberSection("Heads & Leads", heads)}
            {renderMemberSection("Coordinators", coordinators)}
            {renderMemberSection("Core Team", core)}
            {renderMemberSection("Members", generalMembers)}
        </div>
    );
};

export default AdminMembers;
