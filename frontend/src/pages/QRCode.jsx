import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Loader2, Download, QrCode as QrIcon, Crosshair } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const QRCode = () => {
    const [text, setText] = useState('');
    const [qrImage, setQrImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!text) return;

        setLoading(true);
        try {
            const response = await api.get('/qrcode/generate', { params: { text } });
            setQrImage(`data:image/png;base64,${response.data.image_base64}`);
        } catch (error) {
            console.error('Failed to generate QR', error);
        } finally {
            setLoading(false);
        }
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
                        QR Code Generator
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-12 items-start">
                    {/* Left Form Panel */}
                    <div className="glass-card p-6 md:col-span-6 bg-white/[0.01] space-y-6 relative overflow-hidden">
                        <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                            Configure QR payload
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-400 tracking-wide block">
                                    Raw Text / Destination URL
                                </label>
                                <input
                                    placeholder="https://example.com/target-destination"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    required
                                    className="w-full tech-input"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full btn-primary font-medium text-xs tracking-wider uppercase disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <span>Generate QR Code</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Viewport Panel */}
                    <div className="glass-card p-8 md:col-span-6 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden bg-white/[0.01]">
                        <AnimatePresence mode="wait">
                            {qrImage ? (
                                <Motion.div 
                                    key="qr-view"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    className="text-center space-y-6 z-10 flex flex-col items-center"
                                >
                                    {/* QR Code container */}
                                    <div className="p-4 bg-white rounded-2xl border border-white/[0.08] w-fit relative group overflow-hidden shadow-2xl">
                                        <img src={qrImage} alt="QR Code" className="w-44 h-44 rounded-lg" />
                                        {/* Center optical target overlay on image hover */}
                                        <div className="absolute inset-0 bg-neutral-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Crosshair className="h-8 w-8 text-neutral-800" />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = qrImage;
                                            link.download = 'qrcode.png';
                                            link.click();
                                        }}
                                        className="btn-secondary text-xs font-semibold px-5 py-2.5 flex items-center gap-1.5 mx-auto cursor-pointer"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Export PNG</span>
                                    </button>
                                </Motion.div>
                            ) : (
                                <Motion.div 
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-neutral-500 space-y-4 z-10"
                                >
                                    <div className="h-16 w-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto">
                                        <QrIcon className="h-8 w-8 text-neutral-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                                            Waiting for data
                                        </div>
                                        <div className="text-[10px] text-neutral-500 max-w-[200px] mx-auto leading-normal">
                                            Enter target payload text and trigger generation to view QR code.
                                        </div>
                                    </div>
                                </Motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default QRCode;
