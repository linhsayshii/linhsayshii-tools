import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Link, Download, QrCode, Globe, Zap, FileCode, X } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

const Sidebar = ({ isMobile = false, onClose }) => {
    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/shortener', label: 'URL Shortener', icon: Link },
        { path: '/downloader', label: 'Media Downloader', icon: Download },
        { path: '/share', label: 'Code Sharebin', icon: FileCode },
        { path: '/qrcode', label: 'QR Generator', icon: QrCode },
        { path: '/ip', label: 'Network Probes', icon: Globe },
    ];

    return (
        <aside className={isMobile 
            ? "w-full h-full flex flex-col bg-neutral-950 font-sans" 
            : "w-64 bg-neutral-950/40 border-r border-white/[0.04] backdrop-blur-md flex flex-col h-screen fixed left-0 top-0 z-20 font-sans hidden md:flex"
        }>
            {/* Header / Brand Logo */}
            <div className="p-6 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                    <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-semibold tracking-wider text-white">linhsayshii</span>
                </div>
                {isMobile && (
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Navigation links */}
            <nav className="flex-grow px-3 py-6 space-y-1">
                <div className="text-xs text-neutral-500 font-medium uppercase tracking-[0.15em] px-4 mb-3">
                    Modules
                </div>
                
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all relative ${
                                isActive
                                    ? 'bg-white/[0.04] border border-white/[0.06] text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active indicator dot */}
                                {isActive && (
                                    <Motion.div 
                                        layoutId="activeDot"
                                        className="absolute left-2.5 h-1.5 w-1.5 rounded-full bg-white"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <item.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-white ml-2' : 'text-neutral-500'}`} />
                                <span className={`flex-1 truncate transition-all ${isActive ? 'ml-3' : 'ml-3'}`}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Minimal Info Footer */}
            <div className="p-5 border-t border-white/[0.04] bg-neutral-950/20 text-xs text-neutral-500 flex justify-between items-center tracking-wide">
                <span>Secure Conn</span>
                <span className="font-mono text-[9px] text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">TLS_1.3</span>
            </div>
        </aside>
    );
};

export default Sidebar;
