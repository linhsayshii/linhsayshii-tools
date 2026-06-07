import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Button } from '../components/ui/button';
import { Copy, Link as LinkIcon, Loader2, History, ChevronRight } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const Shortener = () => {
    const [url, setUrl] = useState('');
    const [alias, setAlias] = useState('');
    const [shortUrl, setShortUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [recentUrls, setRecentUrls] = useState(() => {
        try {
            const saved = localStorage.getItem('recent_urls');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setShortUrl(null);
        try {
            const payload = { url };
            if (alias && alias.trim() !== '') {
                payload.custom_alias = alias.trim();
            }

            const response = await api.post('/shortener/shorten', payload);
            const newShortUrl = response.data.short_url;
            setShortUrl(newShortUrl);

            // Update local storage history
            const newItem = {
                original_url: url,
                short_url: newShortUrl,
                date: new Date().toLocaleDateString('vi-VN')
            };
            const updatedRecent = [newItem, ...recentUrls.filter(item => item.short_url !== newShortUrl)].slice(0, 5);
            setRecentUrls(updatedRecent);
            localStorage.setItem('recent_urls', JSON.stringify(updatedRecent));
        } catch (err) {
            setError(err.response?.data?.detail || 'Lỗi xử lý API. Vui lòng kiểm tra và thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-[0.2em]">
                        Utility Module
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                        URL Shortener
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-12 items-start">
                    {/* Left Form Panel */}
                    <div className="glass-card p-6 md:col-span-7 bg-white/[0.01] space-y-6 relative overflow-hidden">
                        <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider">
                            Configure URL parameters
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400 tracking-wide block">
                                    Destination URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/very-long-destination-url-here"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    required
                                    className="w-full tech-input text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400 tracking-wide block">
                                    Custom Alias (Optional)
                                </label>
                                <div className="flex items-stretch rounded-lg overflow-hidden">
                                    <span className="text-xs sm:text-sm text-neutral-400 bg-neutral-900 border border-r-0 border-white/[0.06] px-2.5 sm:px-3.5 flex items-center select-none font-medium">
                                        hnglinh.io.vn/
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="custom-path"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value)}
                                        className="flex-1 tech-input rounded-l-none border-l-0 text-sm"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full btn-primary font-semibold text-sm tracking-wider uppercase disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Shortening...</span>
                                    </>
                                ) : (
                                    <span>Shorten URL</span>
                                )}
                            </button>

                            {error && (
                                <div className="text-sm text-red-400 border border-red-500/10 bg-red-500/5 p-3 rounded-lg font-mono">
                                    Error: {error}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Results/History Panel */}
                    <div className="md:col-span-5 space-y-6">
                        {/* Result box */}
                        {shortUrl && (
                            <Motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-6 border-white/10 bg-white/[0.02] space-y-4"
                            >
                                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    Short Link Ready
                                </div>
                                <div className="flex items-center justify-between p-3 bg-black/40 border border-white/[0.06] rounded-lg text-sm font-mono">
                                    <LinkIcon className="h-4 w-4 text-neutral-400 mr-2.5 flex-shrink-0" />
                                    <span className="flex-1 truncate select-all text-neutral-200">{shortUrl}</span>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 hover:bg-white/5 text-neutral-300 ml-2" 
                                        onClick={() => copyToClipboard(shortUrl)}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <AnimatePresence>
                                    {copied && (
                                        <Motion.div 
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-emerald-400 font-medium text-center"
                                        >
                                            Link copied to clipboard
                                        </Motion.div>
                                    )}
                                </AnimatePresence>
                            </Motion.div>
                        )}

                        {/* Recent History list */}
                        <div className="glass-card p-6 bg-white/[0.01] space-y-4">
                            <div className="text-sm text-neutral-400 font-medium uppercase tracking-wider flex items-center gap-2">
                                <History className="h-4 w-4 text-neutral-500" /> History Logs
                            </div>

                            {recentUrls.length > 0 ? (
                                <div className="space-y-3">
                                    {recentUrls.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/[0.04] rounded-lg hover:border-white/[0.08] transition-colors text-sm font-mono">
                                            <div className="flex-1 min-w-0 pr-3 space-y-1">
                                                <p className="font-semibold text-neutral-200 truncate flex items-center gap-1">
                                                    <ChevronRight className="h-3 w-3 text-neutral-500 flex-shrink-0" />
                                                    {item.short_url}
                                                </p>
                                                <p className="text-xs text-neutral-500 truncate pl-4" title={item.original_url}>
                                                    {item.original_url}
                                                </p>
                                            </div>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 hover:bg-white/5 text-neutral-400" 
                                                onClick={() => copyToClipboard(item.short_url)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-neutral-500 text-center py-10 border border-dashed border-white/[0.06] rounded-xl">
                                    No records found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Shortener;
