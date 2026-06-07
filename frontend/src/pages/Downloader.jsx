import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Button } from '../components/ui/button';
import { Loader2, Search, Download, FileAudio, FileVideo, Film, ShieldCheck, Clock, User, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import Turnstile from "../components/Turnstile";
import { motion as Motion, AnimatePresence } from 'framer-motion';

const Downloader = () => {
    const [url, setUrl] = useState('');
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('video');

    // Captcha State
    const [captchaOpen, setCaptchaOpen] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [pendingFormatId, setPendingFormatId] = useState(null);

    const fetchInfo = async (e) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setInfo(null);
        setError(null);
        try {
            const response = await api.get('/downloader/info', { params: { url } });
            setInfo(response.data);
        } catch (err) {
            setError('Không thể đọc luồng video: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const initDownload = (formatId) => {
        setPendingFormatId(formatId);
        setCaptchaToken(null);
        setCaptchaOpen(true);
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const handleDownloadConfirm = async (e) => {
        e.preventDefault();
        if (!captchaToken) return;

        const formatId = pendingFormatId;
        setDownloading(true);

        try {
            const response = await api.get('/downloader/download', {
                params: {
                    url,
                    format_id: formatId,
                    turnstile_token: captchaToken
                },
                responseType: 'blob'
            });

            setCaptchaOpen(false);

            let filename = 'video.mp4';
            if (info && info.title) {
                const safeTitle = info.title.replace(/[<>:"/\\|?*]/g, '').trim();
                if (safeTitle) {
                    filename = `${safeTitle}.mp4`;
                }
            }

            const contentType = response.headers['content-type'] || 'video/mp4';
            const blob = new Blob([response.data], { type: contentType });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);

        } catch (err) {
            alert('Lỗi tải tệp tin: ' + (err.response?.data?.detail || 'Lỗi kết nối máy chủ / Hết hạn Captcha.'));
            setCaptchaToken(null);
        } finally {
            setDownloading(false);
            setPendingFormatId(null);
        }
    };

    const getSize = (fmt) => fmt.filesize || fmt.filesize_approx || 0;
    const hasSize = (fmt) => getSize(fmt) > 0;

    const filterFormats = (formats, type) => {
        if (!formats) return [];

        return formats.filter(f => {
            if (!hasSize(f)) return false;

            const hasVideo = f.vcodec && f.vcodec !== 'none';
            const hasAudio = f.acodec && f.acodec !== 'none';

            if (type === 'audio') {
                return !hasVideo && hasAudio;
            } else if (type === 'video') {
                return hasVideo;
            }
            return false;
        });
    };

    const sortFormats = (formats) => {
        return [...formats].sort((a, b) => {
            const getHeight = (res) => {
                if (!res) return 0;
                const match = res.match(/(\d+)p/) || res.match(/x(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };

            const hA = getHeight(a.resolution);
            const hB = getHeight(b.resolution);

            if (hA !== hB) return hB - hA;
            return getSize(b) - getSize(a);
        });
    };

    const FormatTable = ({ formats }) => {
        if (!formats || formats.length === 0) {
            return (
                <div className="text-center text-xs py-10 text-neutral-500 border border-dashed border-white/[0.06] rounded-xl uppercase font-semibold">
                    No compatible formats found
                </div>
            );
        }

        const sorted = sortFormats(formats);

        return (
            <div className="border border-white/[0.06] bg-black/40 rounded-xl overflow-hidden flex flex-col max-h-[350px]">
                {/* Header Table */}
                <div className="bg-neutral-900/40 border-b border-white/[0.06] grid grid-cols-12 px-4 py-3 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider sticky top-0 z-10">
                    <div className="col-span-5">Format / Resolution</div>
                    <div className="col-span-3 sm:col-span-4">Approx Size</div>
                    <div className="col-span-4 sm:col-span-3 text-right">Action</div>
                </div>

                {/* Formats rows */}
                <div className="overflow-y-auto w-full divide-y divide-white/[0.04]">
                    {sorted.map((fmt, idx) => {
                        const isVideoOnly = fmt.acodec === 'none';
                        return (
                            <div key={idx} className="grid grid-cols-12 px-4 py-3 text-xs text-neutral-200 hover:bg-white/[0.02] items-center transition-colors">
                                <div className="col-span-5 font-medium flex items-center gap-2 flex-wrap">
                                    <span className="font-mono">{fmt.resolution || 'AUDIO_ONLY'}</span>
                                    <span className="text-neutral-500 font-mono">(.{fmt.ext})</span>
                                    {isVideoOnly && (
                                        <span className="text-[8px] bg-white/5 text-neutral-300 border border-white/10 px-2 py-0.5 rounded font-medium tracking-wider uppercase">
                                            HQ Video Only
                                        </span>
                                    )}
                                </div>
                                <div className="col-span-3 sm:col-span-4 text-neutral-400 font-mono">
                                    {(getSize(fmt) / 1024 / 1024).toFixed(1)} MB
                                </div>
                                <div className="col-span-4 sm:col-span-3 text-right">
                                    <button
                                        disabled={downloading}
                                        className="bg-white/5 hover:bg-white/10 active:scale-[0.97] border border-white/10 text-white text-[9px] sm:text-[10px] font-medium uppercase tracking-wider px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all cursor-pointer"
                                        onClick={() => initDownload(fmt.format_id)}
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-[0.2em]">
                        Utility Module
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                        Media Stream Downloader
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="glass-card p-6 bg-white/[0.01]">
                        <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-4">
                            Configure destination stream link
                        </div>

                        <form onSubmit={fetchInfo} className="flex flex-col sm:flex-row gap-3">
                            <input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="flex-1 tech-input text-sm"
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-primary text-xs font-semibold px-5 py-2.5 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span>Probe Stream</span>
                            </button>
                        </form>
                        {error && <p className="text-xs text-red-400 mt-4 border border-red-500/10 bg-red-500/5 p-3 rounded-lg font-mono">Error: {error}</p>}
                    </div>

                    {/* Results Container */}
                    <AnimatePresence>
                        {info && (
                            <Motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                className="grid md:grid-cols-12 gap-6"
                            >
                                {/* Left Video Info HUD Card */}
                                <div className="glass-card p-6 bg-white/[0.01] md:col-span-5 h-fit space-y-4">
                                    <div className="aspect-video bg-black rounded-lg border border-white/[0.06] overflow-hidden relative shadow-inner">
                                        <img src={info.thumbnail} alt={info.title} className="w-full h-full object-cover opacity-90" />
                                        <div className="absolute bottom-2.5 right-2.5 bg-black/80 border border-white/10 rounded text-[10px] text-white px-2 py-0.5 font-semibold font-mono">
                                            {Math.floor(info.duration / 60)}:{(info.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-2">
                                        <h3 className="font-semibold text-sm text-white leading-snug line-clamp-2" title={info.title}>{info.title}</h3>
                                        <div className="space-y-1.5 text-xs border-t border-white/[0.06] pt-3">
                                            <div className="text-neutral-400 flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-neutral-500" /> Owner: <span className="text-neutral-200 font-semibold">{info.uploader}</span>
                                            </div>
                                            <div className="text-neutral-400 flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-neutral-500" /> Duration: <span className="text-neutral-200 font-semibold font-mono">{info.duration}s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Formats Card */}
                                <div className="glass-card p-6 bg-white/[0.01] md:col-span-7 space-y-6">
                                    {/* Tabs */}
                                    <div className="flex border-b border-white/[0.06]">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                                activeTab === 'video' 
                                                    ? 'border-white text-white bg-white/[0.02]' 
                                                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                                            }`}
                                            onClick={() => setActiveTab('video')}
                                        >
                                            <Film className="h-3.5 w-3.5" /> Video
                                        </button>
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                                activeTab === 'audio' 
                                                    ? 'border-white text-white bg-white/[0.02]' 
                                                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                                            }`}
                                            onClick={() => setActiveTab('audio')}
                                        >
                                            <FileAudio className="h-3.5 w-3.5" /> Audio Only
                                        </button>
                                    </div>

                                    {/* Tabs content */}
                                    <div>
                                        {activeTab === 'video' ? (
                                            <div className="space-y-4">
                                                <div className="text-[10px] text-neutral-300 bg-white/[0.02] p-3.5 border border-white/10 rounded-lg font-medium leading-normal">
                                                    Note: High quality video streams will be processed and merged automatically on the server. This may take from seconds to minutes.
                                                </div>
                                                <FormatTable formats={filterFormats(info.formats, 'video')} />
                                            </div>
                                        ) : (
                                            <FormatTable formats={filterFormats(info.formats, 'audio')} />
                                        )}
                                    </div>
                                </div>
                            </Motion.div>
                        )}
                    </AnimatePresence>
                </div>

            {/* Captcha Gate Dialog */}
            <Dialog open={captchaOpen} onOpenChange={setCaptchaOpen}>
                <DialogContent className="border border-white/10 bg-neutral-950 text-white rounded-2xl sm:max-w-[420px] font-sans">
                    <DialogHeader className="border-b border-white/[0.04] pb-4">
                        <DialogTitle className="flex items-center gap-2.5 text-md font-semibold text-white">
                            <ShieldCheck className="h-5 w-5 text-neutral-400" />
                            Security Verification
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Please complete the security check to initiate the media stream download.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleDownloadConfirm} className="space-y-5 pt-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-white/[0.04] rounded-xl">
                            <Turnstile
                                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                                onVerify={handleCaptchaChange}
                                theme="dark"
                            />
                            {captchaToken && (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-full justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span>Xác thực thành công</span>
                                </div>
                            )}
                        </div>
                        
                        <DialogFooter className="flex sm:flex-row gap-3 pt-3 border-t border-white/[0.04]">
                            <button
                                type="button"
                                onClick={() => setCaptchaOpen(false)}
                                disabled={downloading}
                                className="flex-1 btn-secondary text-xs font-semibold py-2.5 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={!captchaToken || downloading}
                                className="flex-1 btn-primary text-xs font-semibold py-2.5 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {downloading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Streaming...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Download</span>
                                    </>
                                )}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    </Layout>
);
};

export default Downloader;
