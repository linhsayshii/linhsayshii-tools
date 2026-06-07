import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Menu, Zap } from 'lucide-react';

const Layout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex relative overflow-hidden">
            {/* Dark Tech Ambient Lighting & Overlays */}
            <div className="noise-overlay"></div>
            
            {/* Top-Left Ambient Glow */}
            <div className="bg-glow-spot top-[-10%] left-[-10%]"></div>
            {/* Bottom-Right Ambient Glow */}
            <div className="bg-glow-spot bottom-[-10%] right-[-10%]"></div>

            {/* Mobile Sticky Header */}
            <header className="h-16 flex md:hidden items-center px-6 bg-neutral-950/80 border-b border-white/[0.04] backdrop-blur-md fixed top-0 left-0 w-full z-30 font-sans">
                <div className="flex items-center space-x-3 w-full">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-base font-semibold tracking-wider text-white">linhsayshii</span>
                    </div>
                </div>
            </header>

            {/* Desktop Sidebar (hidden on mobile via CSS inside Sidebar component) */}
            <Sidebar />

            {/* Mobile Drawer Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        {/* Drawer Panel */}
                        <Motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                            className="fixed inset-y-0 left-0 w-64 bg-neutral-950 border-r border-white/[0.04] flex flex-col z-50 md:hidden shadow-2xl"
                        >
                            <Sidebar isMobile onClose={() => setIsMobileOpen(false)} />
                        </Motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 lg:p-12 pt-20 md:pt-8 lg:pt-12 overflow-y-auto h-screen relative z-10">
                <Motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    className="max-w-5xl mx-auto space-y-8"
                >
                    {children}
                </Motion.div>
            </main>
        </div>
    );
};

export default Layout;
