import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { Copy, Check, AlertTriangle, FileCode, Calendar, Clock, Download, ArrowLeft, Loader2 } from 'lucide-react';
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
import { EditorView } from '@codemirror/view';

const getLangExtension = (lang) => {
    switch (lang) {
        case 'javascript': return [javascript({ jsx: true })];
        case 'typescript': return [javascript({ typescript: true, jsx: true })];
        case 'python':     return [python()];
        case 'java':       return [java()];
        case 'cpp':        return [cpp()];
        case 'csharp':     return [cpp()];
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

const languageMap = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
    cpp: 'cpp', csharp: 'cs', php: 'php', go: 'go', rust: 'rs',
    ruby: 'rb', css: 'css', html: 'html', json: 'json',
    sql: 'sql', bash: 'sh', markdown: 'md', plaintext: 'txt',
};

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
                if (res.data?.content) {
                    setData(res.data);
                } else {
                    setError('Dữ liệu trả về không hợp lệ.');
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setError('Bản ghi không tồn tại hoặc đã hết hạn.');
                } else if (err.response?.status === 410) {
                    setError('Bản ghi đã hết hạn và bị xóa.');
                } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                    setError('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    setError(err.response?.data?.detail || 'Lỗi kết nối máy chủ.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPaste();
    }, [id]);

    const copyCode = () => {
        if (!data) return;
        const text = data.content;
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

    const downloadCode = () => {
        if (!data) return;
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.title || 'code'}.${languageMap[data.language] || 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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

    if (error || !data) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-5 text-center">
                    <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-red-500">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Record Not Found</h2>
                    <p className="text-xs text-neutral-500 max-w-sm">{error || 'Không thể tải dữ liệu bản ghi.'}</p>
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

    const language = data.language || 'plaintext';
    const content = data.content || '';
    const title = data.title || 'untitled';
    const expiresDate = data.expires_at ? new Date(data.expires_at) : null;
    const createdDate = data.created_at ? new Date(data.created_at) : null;
    const daysLeft = expiresDate ? Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

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
                                <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                                <div className="flex flex-wrap items-center gap-3.5 text-[10px] text-neutral-400 font-medium uppercase tracking-wider mt-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                        Date: {createdDate ? createdDate.toLocaleDateString('vi-VN') : '—'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-neutral-500" />
                                        Expires in: {daysLeft === null ? '—' : daysLeft > 0 ? `${daysLeft} days` : 'Expiring today'}
                                    </span>
                                    <span className="bg-white/5 text-neutral-200 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono">
                                        {language.toUpperCase()}
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

                {/* Code Viewer Glass Card */}
                <div className="glass-card bg-white/[0.01] overflow-hidden shadow-2xl">
                    {/* Mock IDE header */}
                    <div className="bg-neutral-900/40 border-b border-white/[0.04] px-6 py-2.5 flex items-center justify-between text-[10px] text-neutral-500 font-medium tracking-wider font-mono">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                            </div>
                            <span className="ml-2 text-neutral-400">{title}.{languageMap[language] || 'txt'}</span>
                        </div>
                        <div>Lines: {content.split('\n').length} &middot; Chars: {content.length}</div>
                    </div>

                    {/* Read-only CodeMirror viewer */}
                    <div className="codemirror-wrapper">
                        <CodeMirrorViewer content={content} language={language} />
                    </div>
                </div>

                {/* Footer Expiry Info */}
                <div className="text-center text-[10px] text-neutral-500 tracking-wide font-mono">
                    Auto-deletion time: {expiresDate ? expiresDate.toLocaleString('vi-VN') : '—'}
                </div>
            </div>
        </Layout>
    );
};

// Separate component so useMemo works cleanly with language changes
const CodeMirrorViewer = ({ content, language }) => {
    const extensions = useMemo(() => [
        ...getLangExtension(language),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
    ], [language]);

    return (
        <CodeMirror
            value={content}
            theme={vscodeDark}
            extensions={extensions}
            editable={false}
            basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
                autocompletion: false,
                bracketMatching: true,
            }}
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
            }}
        />
    );
};

export default PasteView;
