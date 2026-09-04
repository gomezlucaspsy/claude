"use client";

import { useState, useEffect } from "react";

/**
 * Floating "install" trigger + modal that renders a QR code linking to this
 * deployment, so the app can be scanned open and added to a phone's home
 * screen (PWA install) — same QR-download pattern as the Native project's
 * QuickShare feature, applied here to app distribution instead of files.
 */
export default function InstallQR({ color = "#4a8fc0" }) {
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPageUrl(window.location.origin);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setInstalled(isStandalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!open || !pageUrl) return;
    let cancelled = false;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(pageUrl, {
          width: 240,
          margin: 1,
          color: { dark: "#08131f", light: "#eaf4ff" },
        })
      )
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, pageUrl]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setOpen(false);
  };

  if (installed) return null;

  return (
    <>
      <button
        className="pfx-install-trigger"
        style={{ "--cc": color }}
        onClick={() => setOpen(true)}
        title="Install / download the app"
      >
        ⬇ INSTALL
      </button>

      {open && (
        <div className="pfx-mo" onClick={() => setOpen(false)}>
          <div
            className="pfx-mb"
            style={{ "--cc": color }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pfx-mt">[ INSTALL ROBOTFORGE ]</div>
            <p className="pfx-hint">
              Scan with your phone's camera to open this app, then add it to
              your home screen — offline access, faster loads, native feel.
            </p>
            <div className="pfx-imgwrap">
              {qrUrl ? (
                <img src={qrUrl} alt="QR code to install RobotForge" />
              ) : (
                <div className="pfx-loading">Generating QR…</div>
              )}
            </div>
            <div className="pfx-url">{pageUrl}</div>
            {deferredPrompt && (
              <button className="pfx-installbtn" onClick={handleInstall}>
                INSTALL ON THIS DEVICE
              </button>
            )}
            <button className="pfx-closebtn" onClick={() => setOpen(false)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pfx-install-trigger{
          position:fixed;top:calc(64px + env(safe-area-inset-top));right:18px;z-index:50;
          background:rgba(10,20,40,.7);border:1px solid var(--cc,#4a8fc0);
          color:var(--cc,#4a8fc0);font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:1.4px;padding:8px 14px;border-radius:999px;
          cursor:pointer;backdrop-filter:blur(6px);transition:all .2s;
        }
        .pfx-install-trigger:hover{background:var(--cc,#4a8fc0);color:#030712;box-shadow:0 0 16px var(--cc,#4a8fc0);}

        .pfx-mo{position:fixed;inset:0;background:rgba(2,6,14,.74);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:20px;}
        .pfx-mb{background:linear-gradient(170deg,rgba(14,29,61,.96),rgba(10,21,42,.97));border:1px solid var(--cc,#4a8fc0);padding:30px;border-radius:28px;max-width:360px;width:100%;box-shadow:0 22px 40px rgba(0,0,0,.45);text-align:center;}
        .pfx-mt{font-family:'Orbitron',sans-serif;font-size:15px;color:#f4f8ff;letter-spacing:1.3px;margin-bottom:12px;}
        .pfx-hint{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(194,228,255,.75);line-height:1.6;margin-bottom:18px;}
        .pfx-imgwrap{background:#eaf4ff;border-radius:16px;padding:12px;display:inline-flex;margin-bottom:12px;}
        .pfx-imgwrap img{display:block;width:200px;height:200px;}
        .pfx-loading{width:200px;height:200px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:#333;}
        .pfx-url{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(194,228,255,.55);word-break:break-all;margin-bottom:16px;}
        .pfx-installbtn{width:100%;background:rgba(74,143,192,.18);border:1px solid var(--cc,#4a8fc0);color:var(--cc,#4a8fc0);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:11px;cursor:pointer;border-radius:999px;transition:all .2s;margin-bottom:10px;}
        .pfx-installbtn:hover{background:var(--cc,#4a8fc0);color:#030712;}
        .pfx-closebtn{width:100%;background:rgba(16,31,63,.72);border:1px solid rgba(132,194,255,.24);color:rgba(194,228,255,.86);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:10px;cursor:pointer;transition:all .2s;border-radius:999px;}
        .pfx-closebtn:hover{border-color:rgba(156,214,255,.45);}

        /* Below 760px, PersonaChat's system chip becomes a full-width bar around
           top:12px — push the install trigger under it so it isn't hidden behind it. */
        @media (max-width: 760px){
          .pfx-install-trigger{top:calc(64px + env(safe-area-inset-top));right:14px;}
        }
        @media (max-width: 480px){
          .pfx-install-trigger{top:calc(68px + env(safe-area-inset-top));right:10px;font-size:9px;padding:7px 11px;}
        }
      `}</style>
    </>
  );
}
