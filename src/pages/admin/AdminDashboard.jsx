import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Activity, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';

const AdminDashboard = () => {
    const [stats, setStats] = useState([
        { label: 'Total Members', value: '-', icon: Users, color: 'text-[var(--neon-cyan)]', bg: 'bg-[var(--neon-cyan)]/10' },
        { label: 'Upcoming Events', value: '-', icon: Calendar, color: 'text-[var(--neon-violet)]', bg: 'bg-[var(--neon-violet)]/10' },
        { label: 'Total Events', value: '-', icon: Activity, color: 'text-[var(--neon-green)]', bg: 'bg-[var(--neon-green)]/10' },
        { label: 'Top Contestant', value: '-', icon: Trophy, color: 'text-[#ff0055]', bg: 'bg-[#ff0055]/10' },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // 1. Members Listener (Just count)
        const unsubMembers = onSnapshot(collection(db, "members"), (snapshot) => {
            const memberCount = snapshot.size;
            setStats(prev => {
                const newStats = [...prev];
                newStats[0].value = memberCount.toString();
                return newStats;
            });
        });

        // 2. Contestants Listener (For Top Contestant)
        const unsubContestants = onSnapshot(collection(db, "contestants"), (snapshot) => {
            let topContestant = '-';
            if (!snapshot.empty) {
                const contestants = snapshot.docs.map(doc => doc.data());
                contestants.sort((a, b) => (b.points || 0) - (a.points || 0));
                topContestant = contestants[0].name;
            }
            setStats(prev => {
                const newStats = [...prev];
                newStats[3].value = topContestant;
                return newStats;
            });
        });

        // 2. Events Listener
        const unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
            const totalEvents = snapshot.size;
            const upcomingCount = snapshot.docs.filter(doc => {
                const data = doc.data();
                // Check if status is NOT 'Past'
                return data.status !== 'Past';
            }).length;

            setStats(prev => {
                const newStats = [...prev];
                newStats[1].value = upcomingCount.toString();
                newStats[2].value = totalEvents.toString();
                return newStats;
            });
            setLoading(false);
        });

        return () => {
            unsubMembers();
            unsubEvents();
            unsubContestants();
        };
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Dashboard Overview</h1>
                {loading && <RefreshCw className="animate-spin text-zinc-500" size={20} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-4 hover:border-zinc-700 transition-colors">
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-2xl md:text-3xl font-bold leading-none truncate" title={stat.value}>
                                {stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
                <h2 className="text-lg md:text-xl font-semibold mb-4">System Status</h2>
                <div className="flex gap-4 text-zinc-400 text-sm md:text-base">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        Firestore Connected
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                        Auth Service Online
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
