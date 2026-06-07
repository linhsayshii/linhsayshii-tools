import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { Copy, Check, AlertTriangle, FileCode, Calendar, Clock, Download, ArrowLeft } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

const PasteView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchPaste = async () => {
            try {
                const res = await api.get(`/paste/${id}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.status === 404 ? 'Bản ghi không tồn tại hoặc đã hết hạn.' : 'Lỗi kết nối máy chủ.');
            } finally {
                setLoading(false);
            }
        };
        fetchPaste();
    }, [id]);

    useEffect(() => {
        if (data) {
            Prism.highlightAll();
        }
    }, [data]);

    const copyCode = () => {
        if (data) {
            const text = data.content;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    })
                    .catch(() => {
                        fallbackCopyTextToClipboard(text);
                    });
            } else {
                fallbackCopyTextToClipboard(text);
            }
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    const downloadCode = () => {
        if (data) {
            const blob = new Blob([data.content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.title || 'code'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                    <p className="text-xs text-neutral-500">Fetching share bin stream...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-5 text-center">
                    <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-red-500">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Record Not Found</h2>
                    <p className="text-xs text-neutral-500 max-w-sm">{error}</p>
                    <button 
                        onClick={() => navigate('/share')}
                        className="btn-secondary text-xs font-semibold px-6 py-2.5 flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Editor</span>
                    </button>
                </div>
            </Layout>
        );
    }

    const languageMap = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        csharp: 'cs',
        php: 'php',
        go: 'go',
        rust: 'rs',
        ruby: 'rb',
        css: 'css',
        html: 'html',
        json: 'json',
        sql: 'sql',
        bash: 'sh',
        markdown: 'md',
        plaintext: 'txt',
    };

    const languageClass = data.language === 'plaintext' ? '' : `language-${data.language}`;
    const lines = data.content.split('\n');
    const expiresDate = new Date(data.expires_at);
    const createdDate = new Date(data.created_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiresDate - now) / (1000 * 60 * 60 * 24));

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-white/[0.04] pb-5">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white">
                                <FileCode className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-white">
                                    {data.title || 'untitled.txt'}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-neutral-400 font-medium uppercase tracking-wider mt-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                        Date: {createdDate.toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                                        Expires in: {daysLeft > 0 ? `${daysLeft} days` : 'Expiring today'}
                                    </span>
                                    <span className="bg-white/5 text-neutral-200 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono">
                                        {data.language.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 flex-shrink-0">
                        <button 
                            onClick={copyCode} 
                            className="btn-secondary text-xs font-semibold py-2.5 px-4 flex items-center gap-1.5 cursor-pointer min-w-[90px] justify-center"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button 
                            onClick={downloadCode} 
                            className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                        </button>
                    </div>
                </div>

                {/* Code Display Glass Card */}
                <div className="glass-card bg-white/[0.01] overflow-hidden shadow-2xl">
                    {/* Mock editor header */}
                    <div className="bg-neutral-900/40 border-b border-white/[0.04] px-6 py-2.5 flex items-center justify-between text-[10px] text-neutral-500 font-medium tracking-wider font-mono">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                            </div>
                            <span className="ml-2 text-neutral-400">{data.title || 'untitled'}.{languageMap[data.language] || 'txt'}</span>
                        </div>
                        <div>
                            Lines: {lines.length} &middot; Chars: {data.content.length}
                        </div>
                    </div>
                    
                    {/* Code pre box */}
                    <div className="relative bg-black/20 overflow-x-auto flex">
                        {/* Line Numbers */}
                        <div className="select-none bg-black/30 text-neutral-600 text-right pr-4 py-4 pl-4 sticky left-0 z-10 border-r border-white/[0.04] font-mono">
                            {lines.map((_, idx) => (
                                <div key={idx} className="text-xs leading-6 h-6">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                        
                        {/* Preformatted Content */}
                        <div className="flex-1 overflow-x-auto">
                            <pre className="!bg-transparent !m-0 !p-4 !border-0">
                                <code className={`${languageClass} text-xs leading-6 block font-mono`}>
                                    {data.content}
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Footer Expiry Info */}
                <div className="text-center text-[10px] text-neutral-500 tracking-wide font-mono">
                    Auto-deletion time: {expiresDate.toLocaleString('vi-VN')}
                </div>
            </div>
        </Layout>
    );
};

// Simple loader helper
const Loader2 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default PasteView;
