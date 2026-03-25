"use client";

import { useEffect, useState } from "react";

/* ── helpers ─────────────────────────────────────────── */
const isInstalled = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true);

const isIOS = () =>
  typeof window !== "undefined" &&
  /ipad|iphone|ipod/i.test(navigator.userAgent) &&
  !window.MSStream;

/* ── component ───────────────────────────────────────── */
export default function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt]         = useState(false);
  const [platform, setPlatform]             = useState(null); // "android" | "ios"

  useEffect(() => {
    // 1. Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.error("SW registration failed:", err));
    }

    // 2. Already running as installed PWA → nothing to do
    if (isInstalled()) return;

    // 3. User chose "Remind me later" recently → respect the snooze
    const snooze = localStorage.getItem("pwa-snooze-until");
    if (snooze && Date.now() < Number(snooze)) return;

    // 4. iOS: no beforeinstallprompt, show manual instructions
    if (isIOS()) {
      setPlatform("ios");
      setShowPrompt(true);
      return;
    }

    // 5. Android/Chrome: capture the native install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.removeItem("pwa-snooze-until");
    }
  };

  const handleSnooze = () => {
    localStorage.setItem("pwa-snooze-until", String(Date.now() + 86_400_000));
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      <style>{`
        @keyframes pwa-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes pwa-pulse {
          0%,100% { box-shadow: 0 0 16px rgba(100,180,255,0.4); }
          50%      { box-shadow: 0 0 32px rgba(100,180,255,0.8); }
        }

        .pwa-overlay {
          position: fixed;
          inset: 0;
          background: rgba(3, 7, 20, 0.88);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: pwa-fade-in 0.4s ease forwards;
        }

        .pwa-card {
          background: #050d1a;
          border: 1px solid rgba(70,130,180,0.35);
          max-width: 420px;
          width: 100%;
          padding: 36px 32px 28px;
          position: relative;
          clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px));
          animation: pwa-slide-up 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .pwa-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(70,130,180,0.06) 0%, transparent 60%);
          pointer-events: none;
        }

        .pwa-eyebrow {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 5px;
          color: #4a8fc0;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .pwa-icon {
          font-size: 52px;
          display: block;
          margin-bottom: 16px;
          filter: drop-shadow(0 0 12px rgba(100,180,255,0.6));
        }

        .pwa-title {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 700;
          color: #e8f4ff;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .pwa-subtitle {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #4a8fc0;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .pwa-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(70,130,180,0.4), transparent);
          margin-bottom: 20px;
        }

        .pwa-body {
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          color: rgba(180,210,240,0.75);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .pwa-steps {
          list-style: none;
          margin: 12px 0 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pwa-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          color: rgba(180,210,240,0.8);
        }
        .pwa-step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid #4a8fc0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #4a8fc0;
          flex-shrink: 0;
        }

        .pwa-install-btn {
          width: 100%;
          padding: 14px;
          background: rgba(10,25,50,0.9);
          border: 1px solid #4a8fc0;
          color: #7ec8ff;
          font-family: 'Cinzel', serif;
          font-size: 13px;
          letter-spacing: 4px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          animation: pwa-pulse 3s ease-in-out infinite;
          margin-bottom: 12px;
        }
        .pwa-install-btn:hover {
          background: #4a8fc0;
          color: #050d1a;
          box-shadow: 0 0 28px rgba(74,143,192,0.6);
        }

        .pwa-snooze-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: none;
          color: rgba(100,160,220,0.35);
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s;
        }
        .pwa-snooze-btn:hover {
          color: rgba(100,160,220,0.6);
        }

        .pwa-corner-tl {
          position: absolute;
          top: 10px; left: 10px;
          width: 16px; height: 16px;
          border-top: 1px solid rgba(70,130,180,0.5);
          border-left: 1px solid rgba(70,130,180,0.5);
        }
        .pwa-corner-br {
          position: absolute;
          bottom: 10px; right: 10px;
          width: 16px; height: 16px;
          border-bottom: 1px solid rgba(70,130,180,0.5);
          border-right: 1px solid rgba(70,130,180,0.5);
        }
      `}</style>

      <div className="pwa-overlay">
        <div className="pwa-card">
          <div className="pwa-corner-tl" />
          <div className="pwa-corner-br" />

          <div className="pwa-eyebrow">[ SYSTEM PROTOCOL ]</div>
          <span className="pwa-icon">⚡</span>
          <div className="pwa-title">Install App</div>
          <div className="pwa-subtitle">Dark Hour Network</div>
          <div className="pwa-divider" />

          {platform === "android" ? (
            <>
              <p className="pwa-body">
                Install PersonaForge directly to your device — no app store required.
                Full offline access, faster load times, and a native app experience.
              </p>
              <button className="pwa-install-btn" onClick={handleInstall}>
                Install Now
              </button>
            </>
          ) : (
            <>
              <p className="pwa-body">
                Add PersonaForge to your home screen for a full native experience.
              </p>
              <ol className="pwa-steps">
                <li className="pwa-step">
                  <span className="pwa-step-num">1</span>
                  Tap the <strong>&nbsp;Share&nbsp;</strong> icon at the bottom of Safari
                </li>
                <li className="pwa-step">
                  <span className="pwa-step-num">2</span>
                  Scroll down and tap <strong>&nbsp;"Add to Home Screen"</strong>
                </li>
                <li className="pwa-step">
                  <span className="pwa-step-num">3</span>
                  Tap <strong>&nbsp;Add</strong> to confirm
                </li>
              </ol>
            </>
          )}

          <button className="pwa-snooze-btn" onClick={handleSnooze}>
            Remind me in 24 hours
          </button>
        </div>
      </div>
    </>
  );
}
