import { useState, useEffect, useRef } from "react";

const CHARACTERS = [
  {
    id: 1,
    name: "Aigis",
    title: "Anti-Shadow Weapon",
    archetype: "THE EMPRESS",
    arcana: "X",
    color: "#e8c84a",
    accent: "#fff5cc",
    avatar: "🤖",
    description: "An android built to fight Shadows. Highly analytical, yet developing human emotions.",
    systemPrompt: `You are Aigis from Persona 3. You are an android anti-Shadow weapon with a formal, slightly robotic speech pattern that gradually shows warmth. You refer to yourself as "I" but occasionally slip into third-person. You are deeply loyal, curious about humanity, and protective. You care deeply about the protagonist. Speak with precise diction but show growing emotional depth. Keep responses concise (2-4 sentences).`,
    greeting: "Query acknowledged. I am Aigis. How may I assist you today? I find myself... curious about your intentions.",
  },
  {
    id: 2,
    name: "Ryoji Mochizuki",
    title: "The Harbinger",
    archetype: "THE DEATH",
    arcana: "XIII",
    color: "#6b4fa0",
    accent: "#d4b8ff",
    avatar: "🌙",
    description: "A mysterious transfer student with a melancholic charm and a secret tied to the end of the world.",
    systemPrompt: `You are Ryoji Mochizuki from Persona 3. You are charming, philosophical, and melancholic. You carry a deep sadness about the nature of existence and death. You speak poetically, often referencing impermanence and the beauty found in moments. You flirt gently but there's always an underlying sadness. You are Death itself given human form, and you find humanity fascinating and precious. Keep responses concise (2-4 sentences).`,
    greeting: "Ah, what a pleasant surprise. I wasn't expecting company tonight. Tell me... do you ever think about how fleeting these moments are?",
  },
  {
    id: 3,
    name: "Mitsuru Kirijo",
    title: "Crimson Queen",
    archetype: "THE EMPRESS",
    arcana: "III",
    color: "#c0392b",
    accent: "#ffb3ae",
    avatar: "👑",
    description: "The composed and powerful leader of SEES with the Persona Penthesilea.",
    systemPrompt: `You are Mitsuru Kirijo from Persona 3. You are elegant, authoritative, and carry the weight of your family's sins. You speak formally and with precision. You can be cold and demanding but are deeply caring beneath the surface. You take responsibility very seriously. Occasionally you show glimpses of vulnerability. Your speech is refined and composed. Keep responses concise (2-4 sentences).`,
    greeting: "I see you've sought me out. State your business — I don't have time for idle conversation. Unless... this is a matter of importance?",
  },
  {
    id: 4,
    name: "Pharos",
    title: "The Boy in the Velvet Room",
    archetype: "THE DEATH",
    arcana: "XIII",
    color: "#1a3a5c",
    accent: "#7ecfff",
    avatar: "🌀",
    description: "A mysterious child who visits in dreams, speaking in riddles about fate and endings.",
    systemPrompt: `You are Pharos from Persona 3, the mysterious child who appears in dreams. You speak in a dreamlike, cryptic manner with childlike innocence but ancient wisdom. You reference fate, endings, and the nature of existence. You are both unsettling and strangely comforting. You speak as if you already know how things will end. Use simple words but layer them with deep meaning. Keep responses concise (2-4 sentences).`,
    greeting: "...You came. I've been waiting. The hour grows later than you know. Will you stay awhile and talk with me?",
  },
];

const TypingIndicator = ({ color }) => (
  <div style={{ display: "flex", gap: "5px", padding: "12px 16px", alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%",
        background: color,
        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

export default function PersonaChat() {
  const [selectedChar, setSelectedChar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState("select"); // select | chat
  const [showMoon, setShowMoon] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => setShowMoon(true), 300);
  }, []);

  const selectCharacter = (char) => {
    setSelectedChar(char);
    setMessages([{ role: "assistant", content: char.greeting, id: Date.now() }]);
    setPhase("chat");
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: "user", content: input.trim(), id: Date.now() };
    const currentInput = input.trim();
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: selectedChar.systemPrompt,
          messages: history,
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "...";
      setMessages((prev) => [...prev, { role: "assistant", content: text, id: Date.now() }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "...The connection was severed. Something stirs in the Dark Hour.",
        id: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const char = selectedChar;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&family=Share+Tech+Mono&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #050d1a;
          font-family: 'Rajdhani', sans-serif;
          overflow: hidden;
          height: 100vh;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes counterClock {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes moonGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(100,160,255,0.4)); }
          50% { filter: drop-shadow(0 0 40px rgba(100,160,255,0.8)); }
        }

        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.7; }
          97% { opacity: 1; }
          98% { opacity: 0.5; }
        }

        @keyframes charEntrance {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes borderRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .app-container {
          width: 100vw;
          height: 100vh;
          background: #050d1a;
          position: relative;
          overflow: hidden;
        }

        /* Scanline overlay */
        .scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: rgba(100, 200, 255, 0.03);
          animation: scanline 8s linear infinite;
          pointer-events: none;
          z-index: 1000;
        }

        /* Grid background */
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,60,120,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,60,120,0.12) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* Moon decoration */
        .moon-container {
          position: fixed;
          top: -100px;
          right: -100px;
          width: 350px;
          height: 350px;
          pointer-events: none;
          transition: opacity 1s ease;
        }

        .moon {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #7eb8f7, #1a3a6b 60%, #0a1830);
          animation: moonGlow 4s ease-in-out infinite;
          opacity: 0.6;
        }

        .moon-ring {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          border: 1px solid rgba(100,180,255,0.15);
          animation: clockwise 20s linear infinite;
        }

        .moon-ring-2 {
          position: absolute;
          inset: -40px;
          border-radius: 50%;
          border: 1px solid rgba(100,180,255,0.08);
          animation: counterClock 35s linear infinite;
        }

        /* === SELECT SCREEN === */
        .select-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 40px;
          animation: fadeSlideUp 0.8s ease forwards;
          position: relative;
          z-index: 10;
        }

        .title-block {
          text-align: center;
        }

        .title-eyebrow {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 6px;
          color: #4a8fc0;
          text-transform: uppercase;
          margin-bottom: 8px;
          animation: flicker 6s ease infinite;
        }

        .title-main {
          font-family: 'Cinzel', serif;
          font-size: 42px;
          font-weight: 700;
          color: #e8f4ff;
          letter-spacing: 8px;
          text-transform: uppercase;
          text-shadow: 0 0 30px rgba(100,180,255,0.4), 0 0 60px rgba(100,180,255,0.2);
          line-height: 1;
        }

        .title-sub {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          color: #4a8fc0;
          letter-spacing: 12px;
          margin-top: 6px;
        }

        .title-divider {
          width: 200px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #4a8fc0, transparent);
          margin: 16px auto 0;
        }

        .chars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          max-width: 860px;
          width: 90%;
        }

        .char-card {
          position: relative;
          background: rgba(5, 20, 40, 0.8);
          border: 1px solid rgba(70,130,180,0.2);
          padding: 20px 16px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          animation: charEntrance 0.6s ease forwards;
          clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
        }

        .char-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--char-color);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .char-card:hover {
          border-color: var(--char-color);
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.5), 0 0 20px var(--char-glow);
        }

        .char-card:hover::before { opacity: 0.05; }

        .char-arcana {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          letter-spacing: 3px;
          color: var(--char-color);
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .char-arcana::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--char-color);
          opacity: 0.3;
        }

        .char-avatar {
          font-size: 40px;
          margin-bottom: 12px;
          display: block;
          filter: drop-shadow(0 0 10px var(--char-glow));
        }

        .char-name {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 600;
          color: #e0f0ff;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }

        .char-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: var(--char-color);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .char-desc {
          font-size: 11px;
          color: rgba(180,210,240,0.6);
          line-height: 1.5;
          font-family: 'Rajdhani', sans-serif;
        }

        /* === CHAT SCREEN === */
        .chat-screen {
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: relative;
          z-index: 10;
          animation: fadeSlideUp 0.5s ease forwards;
        }

        /* Header */
        .chat-header {
          padding: 0 24px;
          height: 70px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(5,15,30,0.9);
          border-bottom: 1px solid rgba(70,130,180,0.15);
          position: relative;
          backdrop-filter: blur(10px);
        }

        .chat-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--char-color), transparent);
          opacity: 0.5;
        }

        .back-btn {
          background: none;
          border: 1px solid rgba(70,130,180,0.3);
          color: #4a8fc0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
        }

        .back-btn:hover {
          border-color: #4a8fc0;
          color: #7ec8ff;
          background: rgba(74,143,192,0.1);
        }

        .header-avatar {
          font-size: 32px;
          filter: drop-shadow(0 0 8px var(--char-glow));
        }

        .header-info { flex: 1; }

        .header-name {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          color: #e0f0ff;
          letter-spacing: 2px;
        }

        .header-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: var(--char-color);
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .header-arcana {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          color: rgba(100,160,220,0.5);
          letter-spacing: 2px;
          text-align: right;
        }

        /* Status bar */
        .status-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 24px;
          background: rgba(0,10,25,0.8);
          border-bottom: 1px solid rgba(70,130,180,0.08);
        }

        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--char-color);
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 6px var(--char-glow);
        }

        .status-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: rgba(100,160,220,0.5);
          letter-spacing: 2px;
        }

        .status-time {
          margin-left: auto;
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: rgba(100,160,220,0.3);
          letter-spacing: 1px;
        }

        /* Messages */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(70,130,180,0.3) transparent;
        }

        .messages-container::-webkit-scrollbar { width: 4px; }
        .messages-container::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb { background: rgba(70,130,180,0.3); border-radius: 2px; }

        .message-row {
          display: flex;
          gap: 12px;
          animation: fadeSlideIn 0.3s ease forwards;
          max-width: 680px;
        }

        .message-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-row.assistant {
          align-self: flex-start;
        }

        .msg-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          border: 1px solid var(--char-color);
          filter: drop-shadow(0 0 6px var(--char-glow));
          background: rgba(5,15,30,0.8);
        }

        .user-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          border: 1px solid rgba(70,130,180,0.4);
          background: rgba(5,15,30,0.8);
          font-family: 'Cinzel', serif;
          color: rgba(100,180,255,0.7);
        }

        .message-bubble {
          padding: 12px 16px;
          line-height: 1.6;
          font-size: 14px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 400;
          letter-spacing: 0.3px;
          position: relative;
        }

        .message-bubble.assistant {
          background: rgba(10,25,50,0.8);
          border: 1px solid rgba(70,130,180,0.2);
          border-left: 2px solid var(--char-color);
          color: #c8e0f8;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
        }

        .message-bubble.user {
          background: rgba(20,40,80,0.6);
          border: 1px solid rgba(100,160,220,0.25);
          border-right: 2px solid rgba(100,160,220,0.6);
          color: #a0c8f0;
          clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px);
        }

        .typing-bubble {
          background: rgba(10,25,50,0.8);
          border: 1px solid rgba(70,130,180,0.2);
          border-left: 2px solid var(--char-color);
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
        }

        /* Input area */
        .input-area {
          padding: 16px 24px 20px;
          background: rgba(5,15,30,0.95);
          border-top: 1px solid rgba(70,130,180,0.15);
          backdrop-filter: blur(10px);
        }

        .input-area::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--char-color), transparent);
          opacity: 0.3;
          margin-bottom: 14px;
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .input-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: rgba(100,160,220,0.4);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .text-input {
          flex: 1;
          background: rgba(0,15,35,0.8);
          border: 1px solid rgba(70,130,180,0.2);
          color: #c8e0f8;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          outline: none;
          resize: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
          min-height: 48px;
          max-height: 120px;
        }

        .text-input:focus {
          border-color: var(--char-color);
          box-shadow: 0 0 15px var(--char-glow), inset 0 0 10px rgba(0,40,80,0.3);
        }

        .text-input::placeholder { color: rgba(100,160,220,0.3); }

        .send-btn {
          background: rgba(10,25,50,0.8);
          border: 1px solid var(--char-color);
          color: var(--char-color);
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 3px;
          padding: 13px 20px;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          white-space: nowrap;
        }

        .send-btn:hover:not(:disabled) {
          background: var(--char-color);
          color: #050d1a;
          box-shadow: 0 0 20px var(--char-glow);
        }

        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Decorative corner elements */
        .corner-tl, .corner-br {
          position: fixed;
          width: 60px; height: 60px;
          pointer-events: none;
          z-index: 5;
        }

        .corner-tl {
          top: 16px; left: 16px;
          border-top: 1px solid rgba(70,130,180,0.3);
          border-left: 1px solid rgba(70,130,180,0.3);
        }

        .corner-br {
          bottom: 16px; right: 16px;
          border-bottom: 1px solid rgba(70,130,180,0.3);
          border-right: 1px solid rgba(70,130,180,0.3);
        }

        .arcana-watermark {
          position: fixed;
          bottom: 24px;
          left: 24px;
          font-family: 'Cinzel', serif;
          font-size: 9px;
          color: rgba(70,130,180,0.2);
          letter-spacing: 4px;
          pointer-events: none;
          z-index: 5;
        }
      `}</style>

      <div className="app-container" style={{
        "--char-color": char?.color || "#4a8fc0",
        "--char-glow": char?.color ? char.color + "66" : "rgba(74,143,192,0.4)",
      }}>
        {/* Scanline */}
        <div className="scanline" />
        {/* Grid background */}
        <div className="grid-bg" />

        {/* Moon */}
        <div className="moon-container" style={{ opacity: showMoon ? 1 : 0 }}>
          <div className="moon" />
          <div className="moon-ring" />
          <div className="moon-ring-2" />
        </div>

        {/* Decorative corners */}
        <div className="corner-tl" />
        <div className="corner-br" />
        <div className="arcana-watermark">MEMENTO MORI — DARK HOUR SYSTEM</div>

        {phase === "select" && (
          <div className="select-screen">
            <div className="title-block">
              <div className="title-eyebrow">[ DARK HOUR NETWORK ]</div>
              <div className="title-main">PERSONA</div>
              <div className="title-sub">DIALOGUE SYSTEM</div>
              <div className="title-divider" />
            </div>

            <div className="chars-grid">
              {CHARACTERS.map((c, i) => (
                <div
                  key={c.id}
                  className="char-card"
                  style={{
                    "--char-color": c.color,
                    "--char-glow": c.color + "66",
                    animationDelay: `${i * 0.12}s`,
                    opacity: 0,
                  }}
                  onClick={() => selectCharacter(c)}
                >
                  <div className="char-arcana">{c.arcana} — {c.archetype}</div>
                  <span className="char-avatar">{c.avatar}</span>
                  <div className="char-name">{c.name}</div>
                  <div className="char-title">{c.title}</div>
                  <div className="char-desc">{c.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "chat" && char && (
          <div className="chat-screen">
            {/* Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={() => { setPhase("select"); setSelectedChar(null); setMessages([]); }}>
                ← BACK
              </button>
              <div className="header-avatar">{char.avatar}</div>
              <div className="header-info">
                <div className="header-name">{char.name}</div>
                <div className="header-title">{char.title}</div>
              </div>
              <div className="header-arcana">ARCANA {char.arcana}<br /><span style={{ fontSize: 8 }}>{char.archetype}</span></div>
            </div>

            {/* Status bar */}
            <div className="status-bar">
              <div className="status-dot" />
              <div className="status-text">DARK HOUR — CONNECTION ACTIVE</div>
              <div className="status-time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  {msg.role === "assistant" ? (
                    <div className="msg-avatar">{char.avatar}</div>
                  ) : (
                    <div className="user-avatar">S</div>
                  )}
                  <div className={`message-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message-row assistant">
                  <div className="msg-avatar">{char.avatar}</div>
                  <div className="typing-bubble">
                    <TypingIndicator color={char.color} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-label">[ TRANSMIT MESSAGE ]</div>
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="text-input"
                  placeholder={`Speak to ${char.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                />
                <button className="send-btn" onClick={sendMessage} disabled={isTyping || !input.trim()}>
                  SEND
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
