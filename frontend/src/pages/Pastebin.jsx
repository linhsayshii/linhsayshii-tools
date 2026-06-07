import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Button } from '../components/ui/button';
import { Code, Copy, Check, ExternalLink, Clock, Loader2 } from 'lucide-react';
import Select from 'react-select';
import Editor from 'react-simple-code-editor';
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
import { motion as Motion, AnimatePresence } from 'framer-motion';

const Pastebin = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('plaintext');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const languageOptions = [
        { value: 'plaintext', label: 'Plain Text' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'csharp', label: 'C#' },
        { value: 'php', label: 'PHP' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'ruby', label: 'Ruby' },
        { value: 'css', label: 'CSS' },
        { value: 'html', label: 'HTML' },
        { value: 'json', label: 'JSON' },
        { value: 'sql', label: 'SQL' },
        { value: 'bash', label: 'Bash' },
        { value: 'markdown', label: 'Markdown' },
    ];

    const handleCreate = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/paste/create', { 
                content,
                title: title || 'Untitled',
                language 
            });
            const shareUrl = res.data.share_url || `${window.location.origin}/share/${res.data.id}`;
            setResult(shareUrl);
        } catch (err) {
            alert("Lỗi tạo bản ghi chia sẻ: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        const text = result;
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

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'rgba(20, 20, 22, 0.6)',
            borderColor: state.isFocused ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            minHeight: '36px',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.04)' : 'none',
            '&:hover': { borderColor: 'rgba(255, 255, 255, 0.15)' },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: 'rgba(15, 15, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? 'rgba(255, 255, 255, 0.08)' : state.isFocused ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            color: state.isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            '&:active': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
        }),
        singleValue: (base) => ({
            ...base,
            color: '#ffffff',
        }),
        placeholder: (base) => ({
            ...base,
            color: 'rgba(255, 255, 255, 0.3)',
        }),
        input: (base) => ({
            ...base,
            color: '#ffffff',
        }),
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
                        Secure Pastebin Editor
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* Main Editor Panel */}
                    <div className="glass-card bg-white/[0.01] overflow-hidden">
                        {/* Interactive Header Bar */}
                        <div className="bg-neutral-900/40 border-b border-white/[0.04] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="untitled.txt"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-transparent border-b border-white/5 focus:border-white text-xs px-2 py-1 text-white outline-none tracking-wide placeholder-neutral-600 w-48 font-medium transition-colors"
                                />
                            </div>

                            <div className="w-48">
                                <Select
                                    options={languageOptions}
                                    value={languageOptions.find(opt => opt.value === language)}
                                    onChange={(option) => setLanguage(option.value)}
                                    styles={customSelectStyles}
                                    isSearchable
                                />
                            </div>
                        </div>

                        {/* Editor Workspace */}
                        <div className="flex h-[420px] bg-black/20 relative">
                            {/* Line Numbers */}
                            <div className="select-none bg-black/30 text-neutral-600 text-right pr-2 py-4 pl-2 sm:pr-4 sm:pl-4 border-r border-white/[0.04] overflow-y-hidden font-mono">
                                {content.split('\n').map((_, idx) => (
                                    <div key={idx} className="text-xs leading-6 h-6">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Editor Textarea */}
                            <div className="flex-1 overflow-auto">
                                <Editor
                                    value={content}
                                    onValueChange={code => setContent(code)}
                                    highlight={code => {
                                        if (language === 'plaintext') return code;
                                        try {
                                            return Prism.highlight(code, Prism.languages[language] || Prism.languages.plaintext, language);
                                        } catch {
                                            return code;
                                        }
                                    }}
                                    padding={16}
                                    style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 12,
                                        color: '#e5e5e5',
                                        minHeight: '420px',
                                        outline: 'none',
                                    }}
                                    textareaClassName="focus:outline-none"
                                    className="code-editor"
                                    placeholder="// Paste or write your source code here..."
                                />
                            </div>
                        </div>

                        {/* Editor footer */}
                        <div className="bg-neutral-900/40 border-t border-white/[0.04] px-6 py-3 flex items-center justify-between text-[10px] text-neutral-500 font-medium tracking-wider font-mono">
                            <div>
                                Lines: {content.split('\n').length} &middot; Chars: {content.length}
                            </div>
                            <div>
                                Retention: 7 Days
                            </div>
                        </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-start w-full">
                        <button 
                            onClick={handleCreate} 
                            disabled={loading || !content.trim()}
                            className="btn-primary text-xs font-semibold uppercase tracking-wider px-8 py-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Publishing...</span>
                                </>
                            ) : (
                                <>
                                    <Code className="h-4 w-4" />
                                    <span>Publish share</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result details */}
                    <AnimatePresence>
                        {result && (
                            <Motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                className="glass-card p-6 border-white/10 bg-white/[0.02] space-y-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-white flex-shrink-0">
                                        <Check className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-3.5">
                                        <div>
                                            <h3 className="font-semibold text-sm text-white flex items-center gap-2 flex-wrap">
                                                Share Link Generated
                                                <span className="text-[9px] bg-white/5 text-neutral-300 border border-white/10 px-2 py-0.5 rounded font-medium flex items-center gap-1 font-mono">
                                                    <Clock className="h-3 w-3" /> 7 Days Retention
                                                </span>
                                            </h3>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <div className="flex-1 p-3 bg-black/40 border border-white/[0.06] rounded-lg text-xs font-mono truncate text-neutral-300 select-all">
                                                {result}
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button 
                                                    onClick={copyToClipboard}
                                                    className="btn-secondary text-xs font-semibold py-2.5 px-4 flex items-center gap-1.5 cursor-pointer min-w-[90px] justify-center"
                                                >
                                                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                                    <span>{copied ? 'Copied' : 'Copy'}</span>
                                                </button>
                                                <button 
                                                    onClick={() => window.open(result, '_blank')}
                                                    className="btn-primary text-xs font-semibold py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span>Open Link</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
};

export default Pastebin;
