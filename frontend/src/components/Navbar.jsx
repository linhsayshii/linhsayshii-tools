import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Overview' },
        { path: '/shortener', label: 'URL Shortener' },
        { path: '/downloader', label: 'Media Downloader' },
        { path: '/qrcode', label: 'QR Generator' },
        { path: '/ip', label: 'IP Checker' },
    ];

    return (
        <nav className="bg-neutral-950/40 backdrop-blur-md border-b border-white/[0.04] fixed w-full z-50 top-0 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-md font-semibold text-white tracking-wider uppercase flex items-center gap-1.5 group">
                            <Zap className="h-4.5 w-4.5 text-amber-400 fill-amber-400/10 group-hover:scale-110 transition-transform duration-300" />
                            <span>linhsayshii</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${location.pathname === item.path
                                            ? 'bg-white/[0.04] border border-white/[0.06] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
