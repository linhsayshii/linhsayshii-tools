import React, { useEffect, useRef } from "react";

export default function Turnstile({ sitekey, onVerify, theme = "dark" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let script = document.getElementById("cloudflare-turnstile-script");

    const renderTurnstile = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          const widgetId = window.turnstile.render(containerRef.current, {
            sitekey: sitekey,
            theme: theme,
            callback: (token) => {
              if (onVerify) onVerify(token);
            },
            "expired-callback": () => {
              if (onVerify) onVerify(null);
            },
            "error-callback": () => {
              if (onVerify) onVerify(null);
            }
          });
          widgetIdRef.current = widgetId;
        } catch (err) {
          console.error("Cloudflare Turnstile render error:", err);
        }
      }
    };

    const handleScriptLoad = () => {
      renderTurnstile();
    };

    if (!window.turnstile) {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.id = "cloudflare-turnstile-script";
        document.body.appendChild(script);
      }
      script.addEventListener("load", handleScriptLoad);
    } else {
      renderTurnstile();
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
      }
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // ignore error during cleanup
        }
      }
    };
  }, [sitekey, onVerify, theme]);

  return <div ref={containerRef} className="cf-turnstile-container" />;
}
