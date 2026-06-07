import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Button } from '../components/ui/button';
import { Code, Copy, Check, ExternalLink, Clock, Loader2 } from 'lucide-react';
import Select from 'react-select';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { motion as Motion, AnimatePresence } from 'framer-motion';

// Map language value → CodeMirror extension
const getLangExtension = (lang) => {
    switch (lang) {
        case 'javascript': return [javascript({ jsx: true })];
        case 'typescript': return [javascript({ typescript: true, jsx: true })];
        case 'python':     return [python()];
        case 'java':       return [java()];
        case 'cpp':        return [cpp()];
        case 'csharp':     return [cpp()]; // closest available
        case 'php':        return [php()];
        case 'go':         return [go()];
        case 'rust':       return [rust()];
        case 'css':        return [css()];
        case 'html':       return [html()];
        case 'json':       return [json()];
        case 'sql':        return [sql()];
        case 'markdown':   return [markdown()];
        default:           return [];
    }
};

const Pastebin = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('plaintext');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const languageOptions = [
        { value: 'plaintext',   label: 'Plain Text' },
        { value: 'javascript',  label: 'JavaScript' },
        { value: 'typescript',  label: 'TypeScript' },
        { value: 'python',      label: 'Python' },
        { value: 'java',        label: 'Java' },
        { value: 'cpp',         label: 'C++' },
        { value: 'csharp',      label: 'C#' },
        { value: 'php',         label: 'PHP' },
        { value: 'go',          label: 'Go' },
        { value: 'rust',        label: 'Rust' },
        { value: 'css',         label: 'CSS' },
        { value: 'html',        label: 'HTML' },
        { value: 'json',        label: 'JSON' },
        { value: 'sql',         label: 'SQL' },
        { value: 'markdown',    label: 'Markdown' },
    ];

    // Memoize extensions so CodeMirror doesn't re-create on every keystroke
    const extensions = useMemo(() => getLangExtension(language), [language]);

    const handleCreate = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/paste/create', {
                content,
                title: title || 'Untitled',
                language,
            });
            const shareUrl = res.data.share_url || `${window.location.origin}/share/${res.data.id}`;
            setResult(shareUrl);
        } catch (err) {
            alert('Lỗi tạo bản ghi chia sẻ: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        const text = result;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    };

    const fallbackCopy = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        Object.assign(ta.style, { top: '0', left: '0', position: 'fixed' });
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try {
            if (document.execCommand('copy')) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch { /* silent */ }
        document.body.removeChild(ta);
    };

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'rgba(20, 20, 22, 0.6)',
            borderColor: state.isFocused ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
            borderRadius: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            minHeight: '36px',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(255,255,255,0.04)' : 'none',
            '&:hover': { borderColor: 'rgba(255,255,255,0.15)' },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: 'rgba(15,15,17,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? 'rgba(255,255,255,0.08)'
                : state.isFocused ? 'rgba(255,255,255,0.04)' : 'transparent',
            color: state.isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            '&:active': { backgroundColor: 'rgba(255,255,255,0.08)' },
        }),
        singleValue: (base) => ({ ...base, color: '#ffffff' }),
        placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.3)' }),
        input: (base) => ({ ...base, color: '#ffffff' }),
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
                        {/* IDE Header Bar */}
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

                        {/* CodeMirror IDE Editor */}
                        <div className="codemirror-wrapper">
                            <CodeMirror
                                value={content}
                                onChange={(val) => setContent(val)}
                                theme={vscodeDark}
                                extensions={extensions}
                                height="420px"
                                placeholder="// Paste or write your source code here..."
                                basicSetup={{
                                    lineNumbers: true,
                                    foldGutter: true,
                                    highlightActiveLine: true,
                                    highlightActiveLineGutter: true,
                                    autocompletion: false,
                                    bracketMatching: true,
                                    indentOnInput: true,
                                }}
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                }}
                            />
                        </div>

                        {/* Editor footer */}
                        <div className="bg-neutral-900/40 border-t border-white/[0.04] px-6 py-3 flex items-center justify-between text-[10px] text-neutral-500 font-medium tracking-wider font-mono">
                            <div>
                                Lines: {content.split('\n').length} &middot; Chars: {content.length}
                            </div>
                            <div>Retention: 7 Days</div>
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
