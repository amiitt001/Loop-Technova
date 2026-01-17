import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Calendar, LogOut, Menu, X, Trophy } from 'lucide-react';

const AdminLayout = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Only auto-close/open if crossing the breakpoint
            if (mobile && !isMobile) {
                setSidebarOpen(false);
            } else if (!mobile && isMobile) {
                setSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    if (!currentUser) {
        return <Navigate to="/admin/login" />;
    }

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/members', icon: Users, label: 'Members' },
        { path: '/admin/contestants', icon: Trophy, label: 'Contestants' },
        { path: '/admin/applications', icon: Calendar, label: 'Applications' },
        { path: '/admin/events', icon: Calendar, label: 'Events' },
    ];

    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
            {/* Mobile Header */}
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-zinc-900 border-b border-zinc-800 z-50 h-16 px-4 flex items-center justify-between">
                <span className="text-lg font-bold tracking-widest text-white">
                    <span className="text-[var(--neon-cyan)]">TECH</span> ADMIN
                </span>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-zinc-400 hover:text-white"
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-40
                    flex flex-col
                    bg-zinc-900 border-zinc-800
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-64 translate-x-0 border-r' : '-translate-x-full w-64 md:w-20 md:translate-x-0 md:border-r'}
                    ${isMobile ? 'top-16 h-[calc(100vh-4rem)] shadow-none border-t border-zinc-800' : ''}
                `}
            >
                {/* Sidebar Header */}
                <div className={`p-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} mb-6`}>
                    {sidebarOpen && (
                        <span className="text-xl font-bold tracking-widest whitespace-nowrap">
                            <span className="text-[var(--neon-cyan)]">TECH</span> ADMIN
                        </span>
                    )}

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`text-zinc-400 hover:text-white hidden md:block ${!sidebarOpen && 'mx-auto'}`}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => isMobile && setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-[var(--neon-cyan)]/10 text-white border border-[var(--neon-cyan)]/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }
                                    ${!sidebarOpen && 'justify-center'}
                                `}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <item.icon size={20} className={isActive ? 'text-[var(--neon-cyan)]' : 'currentColor'} />
                                <span className={`whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-3 mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`
                            flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-500/10 w-full transition-all
                            ${!sidebarOpen ? 'justify-center' : ''}
                        `}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        <span className={`whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-950 p-4 md:p-8 pt-20 md:pt-8 w-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
