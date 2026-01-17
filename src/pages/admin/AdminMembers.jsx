import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';
import { collection, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminMembers = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Real-time Members Listener
    useEffect(() => {
        setLoading(true);
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
    const handleEdit = async (member) => {
        const name = prompt("Edit Name:", member.name);
        if (name === null) return;
        const role = prompt("Edit Role:", member.role);
        if (role === null) return;
        const img = prompt("Edit Photo URL:", member.img || '');
        if (img === null) return;
        const linkedin = prompt("Edit LinkedIn URL:", member.social?.linkedin || '');
        if (linkedin === null) return;
        const github = prompt("Edit GitHub URL:", member.social?.github || '');
        if (github === null) return;

        try {
            await updateDoc(doc(db, "members", member.id), {
                name: name || member.name,
                role: role || member.role,
                img: img,
                social: {
                    linkedin: linkedin,
                    github: github
                }
            });
        } catch (error) {
            console.error("Error updating member: ", error);
            alert("Error updating member.");
        }
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

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">Members</h1>
                    {loading && <RefreshCw className="animate-spin text-[var(--neon-cyan)]" size={20} />}
                </div>
                <button
                    onClick={() => navigate('/admin/members/new')}
                    className="bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/80 transition-colors border-none rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer font-semibold w-full md:w-auto"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--neon-cyan)] transition-colors"
                />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-800 text-zinc-400 text-sm uppercase">
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-zinc-500">
                                    {loading ? "Loading members..." : "No members found."}
                                </td>
                            </tr>
                        ) : (
                            filteredMembers.map((member) => (
                                <tr key={member.id} className="border-b border-zinc-800 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">{member.name}</td>
                                    <td className="p-4 text-zinc-400">{member.role}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleEdit(member)}
                                            className="bg-transparent border-none text-zinc-400 hover:text-white cursor-pointer mr-2 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="bg-transparent border-none text-red-500 hover:text-red-400 cursor-pointer transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {filteredMembers.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800">
                        {loading ? "Loading members..." : "No members found."}
                    </div>
                ) : (
                    filteredMembers.map((member) => (
                        <div key={member.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{member.name}</h3>
                                    <p className="text-zinc-400 text-sm">{member.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 bg-zinc-800 rounded-lg text-red-500 hover:text-red-400"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminMembers;
