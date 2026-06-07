import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Link as LinkIcon, Download, QrCode, Globe, ArrowRight, FileCode, Network, Cpu, Clock, Activity } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

// Spotlight Card component that tracks mouse position for premium border glow
const SpotlightCard = ({ children, className = '' }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <Motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`glass-card spotlight-hover p-6 group cursor-pointer relative overflow-hidden ${className}`}
        >
            {children}
        </Motion.div>
    );
};

const Home = () => {
    // Simulated system stats
    const [time, setTime] = useState(new Date().toLocaleTimeString('vi-VN'));
    const [cpu, setCpu] = useState('2.4%');

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('vi-VN'));
            setCpu((Math.random() * 3 + 1).toFixed(1) + '%');
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const tools = [
        {
            title: 'Media Downloader',
            description: 'Tải xuống tệp tin Video/Audio chất lượng cao từ YouTube và các luồng phương tiện trực tuyến.',
            to: '/downloader',
            icon: Download,
            tag: 'DL_01',
            accentColor: 'text-neutral-200'
        },
        {
            title: 'Code Sharebin',
            description: 'Trình lưu trữ và chia sẻ mã nguồn nhanh với Syntax Highlighting trực quan. Tự động xóa sau 7 ngày.',
            to: '/share',
            icon: FileCode,
            tag: 'PASTE_02',
            accentColor: 'text-neutral-200'
        },
        {
            title: 'URL Shortener',
            description: 'Rút gọn liên kết gốc cồng kềnh, hỗ trợ đặt tên viết tắt cá nhân hóa để chia sẻ dễ dàng.',
            to: '/shortener',
            icon: LinkIcon,
            tag: 'URL_03',
            accentColor: 'text-neutral-200'
        },
        {
            title: 'Network Probes',
            description: 'Phân tích đa luồng địa chỉ IP (IPv4/IPv6) đang kết nối, truy vấn ISP và vị trí địa lý tức thời.',
            to: '/ip',
            icon: Network,
            tag: 'NET_04',
            accentColor: 'text-neutral-200'
        },
        {
            title: 'QR Generator',
            description: 'Mã hóa nhanh thông tin văn bản, liên kết liên hệ, hoặc thông số WiFi thành mã QR tĩnh chất lượng cao.',
            to: '/qrcode',
            icon: QrCode,
            tag: 'QR_05',
            accentColor: 'text-neutral-200'
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { 
            opacity: 1, 
            y: 0, 
            transition: { type: "spring", stiffness: 350, damping: 25 } 
        }
    };

    return (
        <Layout>
            <div className="space-y-10">
                {/* Header Section */}
                <div className="pb-6 border-b border-white/[0.04] flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="text-xs text-white/50 font-medium uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            System Overview
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
                            Control Panel
                        </h1>
                    </div>
                    <div className="text-left md:text-right text-xs md:text-sm text-neutral-400 font-medium tracking-wide">
                        SYSTEM TIME: <span className="text-white font-mono">{time}</span>
                    </div>
                </div>

                {/* Diagnostics Panel (System Information Glass Card) */}
                <div className="glass-card p-5 sm:p-6 relative overflow-hidden bg-white/[0.01]">
                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-[0.18em] mb-5">
                        Diagnostics
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
                        <div className="space-y-1">
                            <div className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                <Cpu className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" /> CPU Load
                            </div>
                            <div className="text-xl sm:text-2xl font-semibold text-neutral-100 font-mono">{cpu}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                <Activity className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" /> Ping latency
                            </div>
                            <div className="text-xl sm:text-2xl font-semibold text-emerald-400 font-mono">12ms</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                <Clock className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" /> Uptime
                            </div>
                            <div className="text-xl sm:text-2xl font-semibold text-neutral-200 font-mono">208h 44m</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                <Globe className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" /> Modules
                            </div>
                            <div className="text-xl sm:text-2xl font-semibold text-neutral-200 font-mono">05 / 05</div>
                        </div>
                    </div>
                </div>

                <Motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-6 md:grid-cols-2"
                >
                    {tools.map((tool) => (
                        <Motion.div key={tool.to} variants={itemVariants}>
                            <Link to={tool.to} className="block h-full">
                                <SpotlightCard className="h-full flex flex-col justify-between">
                                    {/* Tool identifier in corner */}
                                    <div className="absolute top-4 right-4 text-[11px] text-neutral-500 font-mono font-medium border border-white/[0.06] px-2 py-0.5 rounded bg-white/[0.02] tracking-wider">
                                        {tool.tag}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3.5">
                                            <div className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white group-hover:bg-white/10 transition-colors">
                                                <tool.icon className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-white tracking-wide group-hover:text-neutral-200 transition-colors">
                                                {tool.title}
                                            </h2>
                                        </div>

                                        <p className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors min-h-[3rem]">
                                            {tool.description}
                                        </p>

                                        <div className="pt-3 flex items-center justify-between border-t border-white/[0.04] border-dashed">
                                            <span className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors font-medium tracking-wide">
                                                Execute Module
                                            </span>
                                            <div className="flex items-center text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                                                <span>Run</span>
                                                <ArrowRight className="ml-2 h-3.5 w-3.5 transform transition-transform duration-300 group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </Link>
                        </Motion.div>
                    ))}
                </Motion.div>
            </div>
        </Layout>
    );
};

export default Home;
