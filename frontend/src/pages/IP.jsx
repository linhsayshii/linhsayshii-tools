import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { RefreshCw, Globe, MapPin, Network, Activity } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const PROBE_TARGETS = [
    {
        url: 'https://api.ipify.org?format=json',
        type: 'ipv4',
        parse: (data) => data.ip
    },
    {
        url: 'https://v4.ident.me/.json',
        type: 'ipv4',
        parse: (data) => data.ip
    },
    {
        url: 'https://ipv4.icanhazip.com',
        type: 'ipv4',
        parse: (data) => typeof data === 'string' ? data.trim() : null
    },
    {
        url: 'https://api6.ipify.org?format=json',
        type: 'ipv6',
        parse: (data) => data.ip
    },
    {
        url: 'https://v6.ident.me/.json',
        type: 'ipv6',
        parse: (data) => data.ip
    },
    {
        url: 'https://ipv6.icanhazip.com',
        type: 'ipv6',
        parse: (data) => typeof data === 'string' ? data.trim() : null
    },
    {
        url: 'https://api64.ipify.org?format=json',
        type: 'dual',
        parse: (data) => data.ip
    },
    {
        url: 'https://ident.me/.json',
        type: 'dual',
        parse: (data) => data.ip
    },
    {
        url: 'https://icanhazip.com',
        type: 'dual',
        parse: (data) => typeof data === 'string' ? data.trim() : null
    },
    {
        url: 'https://freeipapi.com/api/json',
        type: 'dual',
        parse: (data) => data.ipAddress
    }
];

const getBustedUrl = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isValidIP = (ip) => {
    if (!ip) return false;
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    const clean = ip.trim();
    return ipv4Regex.test(clean) || ipv6Regex.test(clean);
};

const IP = () => {
    const [results, setResults] = useState(new Map());
    const [activeRoute, setActiveRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [probingCount, setProbingCount] = useState(0);

    const runMultiProbe = async () => {
        setLoading(true);
        setResults(new Map());
        setActiveRoute(null);
        setProbingCount(15);

        // Build 15 probe configurations
        const ipv4Pool = PROBE_TARGETS.filter(t => t.type === 'ipv4' || t.type === 'dual');
        const ipv6Pool = PROBE_TARGETS.filter(t => t.type === 'ipv6');

        const requestQueue = [];
        // 12 IPv4/dual-stack requests to trigger PCC paths
        for (let i = 0; i < 12; i++) {
            requestQueue.push(ipv4Pool[i % ipv4Pool.length]);
        }
        // 3 IPv6-only requests
        for (let i = 0; i < 3; i++) {
            requestQueue.push(ipv6Pool[i % ipv6Pool.length]);
        }

        const detectedIPs = new Set();

        // Promise to detect the active connection path to backend website
        const activeRoutePromise = (async () => {
            try {
                const res = await api.get('/ip/');
                if (res.data) {
                    setActiveRoute(res.data);
                }
            } catch {
                // Ignore
            }
        })();

        const promises = requestQueue.map(async (target, idx) => {
            // Introduce staggered delay (150ms per step) to bypass browser connection pooling
            // and trigger connection-tracking based router PCC balancing
            await delay(idx * 150);

            try {
                const urlWithCb = getBustedUrl(target.url);
                const isJson = target.url.includes('format=json') || target.url.includes('/json');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                const response = await fetch(urlWithCb, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                let ipResponse = null;
                if (isJson) {
                    const data = await response.json();
                    ipResponse = target.parse(data);
                } else {
                    const text = await response.text();
                    ipResponse = target.parse(text);
                }

                if (ipResponse && isValidIP(ipResponse)) {
                    const cleanIp = ipResponse.trim();
                    
                    if (!detectedIPs.has(cleanIp)) {
                        detectedIPs.add(cleanIp);
                        
                        try {
                            // Fetch ISP and location metadata from backend for this public IP
                            const res = await api.get('/ip/', { params: { ip: cleanIp } });
                            if (res.data) {
                                setResults(prevMap => {
                                    const newMap = new Map(prevMap);
                                    if (!newMap.has(cleanIp)) {
                                        newMap.set(cleanIp, res.data);
                                    }
                                    return newMap;
                                });
                            }
                        } catch {
                            // Backend fail fallback: show IP with unknown details
                            const isV6 = cleanIp.includes(':');
                            const fallbackData = {
                                ipv4: isV6 ? null : cleanIp,
                                ipv6: isV6 ? cleanIp : null,
                                location: 'Unknown',
                                isp: 'Unknown',
                                geo_details: {}
                            };
                            setResults(prevMap => {
                                const newMap = new Map(prevMap);
                                if (!newMap.has(cleanIp)) {
                                    newMap.set(cleanIp, fallbackData);
                                }
                                return newMap;
                            });
                        }
                    }
                }
            } catch {
                // Ignore API timeout/fail, proceed
            } finally {
                setProbingCount(prev => Math.max(0, prev - 1));
            }
        });

        await Promise.all([...promises, activeRoutePromise]);
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            runMultiProbe();
        }, 0);
        return () => clearTimeout(timer);
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

                {/* Active Connection Banner */}
                <AnimatePresence>
                    {activeRoute && (
                        <Motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-card p-5 border-white/10 bg-white/[0.02] flex items-center justify-between"
                        >
                            <div className="space-y-1.5">
                                <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Active Website Connection ({activeRoute.ipv6 ? 'IPv6' : activeRoute.location === 'Local Network' ? 'LAN' : 'IPv4'})
                                </div>
                                <div className="text-sm font-semibold tracking-wide font-mono break-all text-white pt-1">
                                    {activeRoute.ipv6 || activeRoute.ipv4}
                                </div>
                                <div className="text-[10px] text-neutral-500 font-medium">
                                    Routed via: {activeRoute.isp} • {activeRoute.location}
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
                                        <Globe className="h-3.5 w-3.5 text-neutral-500" />
                                        {data.ipv4 ? 'Public IPv4' : 'Public IPv6'}
                                    </div>
                                    <div className="text-xl font-semibold font-mono tracking-wide text-white select-all break-all">
                                        {data.ipv4 || data.ipv6}
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
