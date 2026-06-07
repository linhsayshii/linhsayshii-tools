import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function RedirectHandler() {
    const { shortCode } = useParams();

    useEffect(() => {
        if (shortCode) {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            // Redirect directly to backend redirect endpoint
            window.location.replace(`${apiBase}/shortener/${shortCode}`);
        }
    }, [shortCode]);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white font-sans">
            <svg className="h-8 w-8 animate-spin text-neutral-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs text-neutral-400 font-medium tracking-wide uppercase">Đang chuyển hướng...</p>
        </div>
    );
}
