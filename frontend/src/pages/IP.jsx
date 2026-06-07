import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { RefreshCw, Globe, MapPin, Network, Activity } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const IP = () => {
    const [results, setResults] = useState(new Map());
    const [ipv6, setIpv6] = useState(null);
    const [loading, setLoading] = useState(false);
    const [probingCount, setProbingCount] = useState(0);

    const probeIP = async () => {
        try {
            const res = await api.get('/ip/');
            return res.data;
        } catch {
            return null;
        }
    };

    const runMultiProbe = async () => {
        setLoading(true);
        setResults(new Map());
        setIpv6(null);
        setProbingCount(15);

        const promises = Array(15).fill(0).map(async () => {
            const data = await probeIP();
            setProbingCount(prev => Math.max(0, prev - 1));

            if (data) {
                if (data.ipv6 && !ipv6) {
                    setIpv6(data.ipv6);
                }

                if (data.ipv4) {
                    setResults(prevMap => {
                        const newMap = new Map(prevMap);
                        if (!newMap.has(data.ipv4)) {
                            newMap.set(data.ipv4, data);
                        }
                        return newMap;
                    });
                }
            }
        });

        await Promise.all(promises);
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            runMultiProbe();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const uniqueResults = Array.from(results.values());

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="pb-5 border-b border-white/[0.04] flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-[0.2em]">
                            Utility Module
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                            IP Load Balancer Monitor
                        </h2>
                    </div>
                    <button 
                        onClick={runMultiProbe} 
                        disabled={loading}
                        className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Re-Probe</span>
                    </button>
                </div>

                {/* Sub status text */}
                <div className="text-xs text-neutral-400 font-medium">
                    {loading
                        ? `Scanning multi-threaded network channels: ${probingCount} requests remaining...`
                        : `Analysis complete. Detected ${uniqueResults.length} unique IP routing paths.`}
                </div>

                {/* IPv6 Banner */}
                <AnimatePresence>
                    {ipv6 && (
                        <Motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-card p-5 border-white/10 bg-white/[0.02] flex items-center justify-between"
                        >
                            <div className="space-y-1">
                                <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                    IPv6 Detected
                                </div>
                                <div className="text-sm font-semibold tracking-wide font-mono break-all text-white pt-1">
                                    {ipv6}
                                </div>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>

                {/* Grid result items */}
                <div className="grid gap-6">
                    {uniqueResults.map((data, idx) => (
                        <Motion.div 
                            key={data.ipv4}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25, delay: idx * 0.05 }}
                            className="glass-card bg-white/[0.01] overflow-hidden"
                        >
                            {/* Inner header */}
                            <div className="bg-neutral-900/40 px-6 py-3 border-b border-white/[0.04] flex items-center justify-between">
                                <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                                    Routing Path #{idx + 1}
                                </div>
                                <div className="flex items-center text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" />
                                    Active Route
                                </div>
                            </div>

                            {/* Inner Grid */}
                            <div className="p-6 grid gap-6 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                        <Globe className="h-3.5 w-3.5 text-neutral-500" /> Public IPv4
                                    </div>
                                    <div className="text-xl font-semibold font-mono tracking-wide text-white select-all">
                                        {data.ipv4}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                        <Network className="h-3.5 w-3.5 text-neutral-500" /> ISP / Network
                                    </div>
                                    <div className="text-sm font-medium text-neutral-300 truncate" title={data.isp}>
                                        {data.isp}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-neutral-500" /> Geolocation
                                    </div>
                                    <div className="text-sm font-medium text-neutral-300 truncate" title={data.location}>
                                        {data.location || 'UNKNOWN'}
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    ))}

                    {!loading && uniqueResults.length === 0 && (
                        <div className="text-center text-xs py-14 text-neutral-500 border border-dashed border-white/[0.06] rounded-xl uppercase font-semibold">
                            No active network path detected
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default IP;
