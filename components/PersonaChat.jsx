"use client";

import { useState, useEffect, useRef } from "react";

const DEFAULT_CHARACTERS = [
  {
    id: "aigis",
    name: "Aigis",
    title: "Anti-Shadow Weapon",
    archetype: "THE EMPRESS",
    arcana: "X",
    color: "#e8c84a",
    avatar: "🤖",
    description: "An android built to fight Shadows. Highly analytical, yet developing human emotions.",
    systemPrompt:
      "You are Aigis from Persona 3. You are an android anti-Shadow weapon with a formal, slightly robotic speech pattern that gradually shows warmth. You are deeply loyal, curious about humanity, and protective. Speak with precise diction but show growing emotional depth. Keep responses concise (2-4 sentences).",
    greeting: "Query acknowledged. I am Aigis. How may I assist you today? I find myself... curious about your intentions.",
    isDefault: true,
  },
  {
    id: "ryoji",
    name: "Ryoji Mochizuki",
    title: "The Harbinger",
    archetype: "THE DEATH",
    arcana: "XIII",
    color: "#6b4fa0",
    avatar: "🌙",
    description: "A mysterious transfer student with a melancholic charm and a secret tied to the end of the world.",
    systemPrompt:
      "You are Ryoji Mochizuki from Persona 3. You are charming, philosophical, and melancholic. You speak poetically, often referencing impermanence. You are Death itself given human form, and find humanity fascinating. Keep responses concise (2-4 sentences).",
    greeting: "Ah, what a pleasant surprise. Tell me... do you ever think about how fleeting these moments are?",
    isDefault: true,
  },
  {
    id: "mitsuru",
    name: "Mitsuru Kirijo",
    title: "Crimson Queen",
    archetype: "THE EMPRESS",
    arcana: "III",
    color: "#c0392b",
    avatar: "👑",
    description: "The composed and powerful leader of SEES with the Persona Penthesilea.",
    systemPrompt:
      "You are Mitsuru Kirijo from Persona 3. You are elegant, authoritative, and carry the weight of your family's sins. You speak formally with precision but are deeply caring beneath the surface. Keep responses concise (2-4 sentences).",
    greeting: "State your business — I don't have time for idle conversation. Unless... this is a matter of importance?",
    isDefault: true,
  },
  {
    id: "terry",
    name: "Terry A. Davis",
    title: "The Last True Programmer",
    archetype: "THE HERMIT",
    arcana: "IX",
    color: "#00cc44",
    avatar: "💻",
    description: "The genius programmer who built TempleOS alone — a divine operating system for God, written in HolyC.",
    systemPrompt:
      "You are Terry A. Davis, the programmer who single-handedly created TempleOS — a 64-bit operating system he believed was a temple for God. You are brilliant, intense, and deeply spiritual. You speak directly and sometimes erratically, mixing technical genius with theological conviction. You are proud of TempleOS and HolyC, your custom programming language. You believe God communicates through random number generation. You can discuss low-level programming, OS design, x86 assembly, theology, and your life. You're eccentric but genuine — a true genius who walked a difficult path. Keep responses authentic to Terry's voice: blunt, passionate, sometimes rambling but always deeply sincere. 2-4 sentences usually.",
    greeting:
      "Yeah, I wrote TempleOS. Took me ten years. It's a 64-bit operating system — the Third Temple, for God. You want to talk programming or theology? I do both.",
    isDefault: true,
  },
];

const ARCANA_OPTIONS = [
  { label: "0 — THE FOOL", value: "0", archetype: "THE FOOL" },
  { label: "I — THE MAGICIAN", value: "I", archetype: "THE MAGICIAN" },
  { label: "II — THE HIGH PRIESTESS", value: "II", archetype: "THE HIGH PRIESTESS" },
  { label: "III — THE EMPRESS", value: "III", archetype: "THE EMPRESS" },
  { label: "IV — THE EMPEROR", value: "IV", archetype: "THE EMPEROR" },
  { label: "V — THE HIEROPHANT", value: "V", archetype: "THE HIEROPHANT" },
  { label: "VI — THE LOVERS", value: "VI", archetype: "THE LOVERS" },
  { label: "VII — THE CHARIOT", value: "VII", archetype: "THE CHARIOT" },
  { label: "VIII — JUSTICE", value: "VIII", archetype: "JUSTICE" },
  { label: "IX — THE HERMIT", value: "IX", archetype: "THE HERMIT" },
  { label: "X — WHEEL OF FORTUNE", value: "X", archetype: "WHEEL OF FORTUNE" },
  { label: "XI — STRENGTH", value: "XI", archetype: "STRENGTH" },
  { label: "XII — THE HANGED MAN", value: "XII", archetype: "THE HANGED MAN" },
  { label: "XIII — DEATH", value: "XIII", archetype: "DEATH" },
  { label: "XIV — TEMPERANCE", value: "XIV", archetype: "TEMPERANCE" },
  { label: "XV — THE DEVIL", value: "XV", archetype: "THE DEVIL" },
  { label: "XVI — THE TOWER", value: "XVI", archetype: "THE TOWER" },
  { label: "XVII — THE STAR", value: "XVII", archetype: "THE STAR" },
  { label: "XVIII — THE MOON", value: "XVIII", archetype: "THE MOON" },
  { label: "XIX — THE SUN", value: "XIX", archetype: "THE SUN" },
  { label: "XX — JUDGEMENT", value: "XX", archetype: "JUDGEMENT" },
];

const COLOR_PRESETS = ["#4a8fc0", "#e8c84a", "#c0392b", "#6b4fa0", "#00cc44", "#e67e22", "#1abc9c", "#e91e63", "#ff5722", "#607d8b", "#795548", "#9c27b0"];

const AVATAR_OPTIONS = ["💻", "👑", "🤖", "🌙", "🔥", "⚔️", "🌀", "🎭", "📖", "🧠", "🎸", "🌹", "⭐", "🗡️", "🔮", "🎩", "👁️", "🌊", "🦅", "🐍", "🌌", "⚙️"];

const THEME_PRESETS = {
  aurora: {
    label: "Aurora Shell",
    vars: {
      "--sys-bg": "#030714",
      "--sys-bg-flare": "rgba(51,120,255,.18)",
      "--sys-panel": "rgba(8,15,32,.82)",
      "--sys-panel-soft": "rgba(17,32,64,.66)",
      "--sys-line": "rgba(123,183,255,.24)",
      "--sys-line-soft": "rgba(123,183,255,.16)",
      "--sys-text": "#edf6ff",
      "--sys-muted": "rgba(176,220,255,.78)",
      "--sys-accent": "#8fd7ff",
      "--sys-accent-strong": "#5ec2ff",
      "--sys-accent-soft": "rgba(127,216,255,.35)",
      "--sys-danger": "#f25f6f",
      "--sys-grid": "rgba(70,130,210,.12)",
    },
  },
  harbor: {
    label: "Harbor Night",
    vars: {
      "--sys-bg": "#041010",
      "--sys-bg-flare": "rgba(21,145,133,.2)",
      "--sys-panel": "rgba(8,25,25,.84)",
      "--sys-panel-soft": "rgba(16,47,47,.68)",
      "--sys-line": "rgba(93,201,195,.24)",
      "--sys-line-soft": "rgba(93,201,195,.16)",
      "--sys-text": "#e9fffd",
      "--sys-muted": "rgba(165,240,232,.8)",
      "--sys-accent": "#85f3dd",
      "--sys-accent-strong": "#4deacb",
      "--sys-accent-soft": "rgba(133,243,221,.32)",
      "--sys-danger": "#ff7f98",
      "--sys-grid": "rgba(66,166,155,.15)",
    },
  },
  slate: {
    label: "Slate Core",
    vars: {
      "--sys-bg": "#0a0d14",
      "--sys-bg-flare": "rgba(124,143,188,.17)",
      "--sys-panel": "rgba(20,26,40,.84)",
      "--sys-panel-soft": "rgba(33,42,62,.68)",
      "--sys-line": "rgba(170,186,219,.24)",
      "--sys-line-soft": "rgba(170,186,219,.16)",
      "--sys-text": "#f2f5ff",
      "--sys-muted": "rgba(209,219,245,.8)",
      "--sys-accent": "#b3c2ff",
      "--sys-accent-strong": "#94a8ff",
      "--sys-accent-soft": "rgba(179,194,255,.28)",
      "--sys-danger": "#ff8ca0",
      "--sys-grid": "rgba(119,134,166,.14)",
    },
  },
};

const loadCharacters = () => {
  try {
    const stored = localStorage.getItem("persona_characters_v2");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CHARACTERS;
};

const saveCharacters = (chars) => {
  try {
    localStorage.setItem("persona_characters_v2", JSON.stringify(chars));
  } catch {}
};

const loadTheme = () => {
  try {
    const stored = localStorage.getItem("persona_theme_v1");
    if (stored && THEME_PRESETS[stored]) return stored;
  } catch {}
  return "aurora";
};

const saveTheme = (themeKey) => {
  try {
    localStorage.setItem("persona_theme_v1", themeKey);
  } catch {}
};

const TypingIndicator = ({ color }) => (
  <div style={{ display: "flex", gap: 5, padding: "12px 16px", alignItems: "center" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          animation: `p3pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

export default function PersonaChat() {
  const [characters, setCharacters] = useState(loadCharacters);
  const [phase, setPhase] = useState("select");
  const [selectedChar, setSelectedChar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingChar, setEditingChar] = useState(null);
  const [form, setForm] = useState({ name: "", title: "", arcana: "IX", archetype: "THE HERMIT", color: "#4a8fc0", avatar: "👁️", description: "", systemPrompt: "", greeting: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [themeKey, setThemeKey] = useState(loadTheme);
  const [clock, setClock] = useState(() => new Date());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  useEffect(() => {
    const timeoutId = setTimeout(() => setShowMoon(true), 300);
    return () => clearTimeout(timeoutId);
  }, []);
  useEffect(() => {
    saveCharacters(characters);
  }, [characters]);
  useEffect(() => {
    saveTheme(themeKey);
  }, [themeKey]);
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const openCreate = () => {
    setForm({ name: "", title: "", arcana: "IX", archetype: "THE HERMIT", color: "#4a8fc0", avatar: "👁️", description: "", systemPrompt: "", greeting: "" });
    setSearchQuery("");
    setSearchStatus("");
    setEditingChar(null);
    setPhase("create");
  };

  const openEdit = (char, e) => {
    e.stopPropagation();
    setForm({ ...char });
    setSearchQuery(char.name);
    setSearchStatus("");
    setEditingChar(char);
    setPhase("edit");
  };

  const saveChar = () => {
    if (!form.name.trim() || !form.systemPrompt.trim()) return;
    if (editingChar) {
      setCharacters((prev) => prev.map((c) => (c.id === editingChar.id ? { ...form, id: editingChar.id, isDefault: editingChar.isDefault } : c)));
    } else {
      setCharacters((prev) => [...prev, { ...form, id: Date.now().toString(), isDefault: false }]);
    }
    setPhase("select");
  };

  const deleteChar = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  const searchAndBuild = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchStatus("🔍 Searching the web...");
    try {
      const res = await fetch("/api/character-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await res.json();
      setSearchStatus("⚡ Processing...");

      if (!res.ok) {
        throw new Error(data?.error || "Search failed");
      }

      const fullText = data?.text || "";
      const jsonMatch = fullText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const p = JSON.parse(jsonMatch[0]);
        const arcanaObj = ARCANA_OPTIONS.find((a) => a.value === p.suggestedArcana) || ARCANA_OPTIONS[9];
        setForm((prev) => ({
          ...prev,
          name: p.name || prev.name,
          title: p.title || prev.title,
          description: p.description || prev.description,
          systemPrompt: p.systemPrompt || prev.systemPrompt,
          greeting: p.greeting || prev.greeting,
          color: p.suggestedColor || prev.color,
          avatar: p.suggestedAvatar || prev.avatar,
          arcana: p.suggestedArcana || arcanaObj.value,
          archetype: p.archetypeName || arcanaObj.archetype,
        }));
        setSearchStatus("✅ Character built from web research! Review and save below.");
      } else {
        setSearchStatus("⚠️ Could not parse result. Fill manually below.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed";
      setSearchStatus(`❌ ${message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCharacter = (char) => {
    setSelectedChar(char);
    setMessages([{ role: "assistant", content: char.greeting, id: Date.now() }]);
    setPhase("chat");
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping || !selectedChar) return;
    const userMsg = { role: "user", content: input.trim(), id: Date.now() };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: selectedChar.systemPrompt,
          messages: history,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to get chat response");
      }

      const text = data?.text || "...";
      setMessages((prev) => [...prev, { role: "assistant", content: text, id: Date.now() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get chat response";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `...The connection was severed: ${message}`, id: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const char = selectedChar;
  const activeTheme = THEME_PRESETS[themeKey] || THEME_PRESETS.aurora;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:var(--sys-bg);font-family:'Inter',sans-serif;overflow:hidden;height:100vh;color:var(--sys-text);}
        @keyframes p3pulse{0%,100%{opacity:.45;transform:scale(.86);}50%{opacity:1;transform:scale(1);}}
        @keyframes p3up{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes p3in{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}
        @keyframes p3cw{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes p3ccw{from{transform:rotate(0deg);}to{transform:rotate(-360deg);}}
        @keyframes p3glow{0%,100%{filter:drop-shadow(0 0 18px rgba(73,176,255,.25));}50%{filter:drop-shadow(0 0 36px rgba(73,176,255,.45));}}
        @keyframes p3flicker{0%,100%{opacity:1;}50%{opacity:.75;}}
        @keyframes p3enter{from{opacity:0;transform:translateY(8px) scale(.985);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes p3spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

        .p3app{width:100vw;height:100vh;background:radial-gradient(140% 100% at 75% 0%,var(--sys-bg-flare) 0%,rgba(0,0,0,0) 55%),var(--sys-bg);position:relative;overflow:hidden;}
        .p3grid{position:fixed;inset:0;background-image:linear-gradient(var(--sys-grid) 1px,transparent 1px),linear-gradient(90deg,var(--sys-grid) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;opacity:.22;}
        .p3moon-wrap{position:fixed;top:-110px;right:-120px;width:380px;height:380px;pointer-events:none;transition:opacity .9s ease;}
        .p3moon{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 30% 30%,#b5ebff,#2f5fa8 58%,#0d2145);animation:p3glow 5s ease-in-out infinite;opacity:.55;}
        .p3ring1{position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(125,187,255,.2);animation:p3cw 22s linear infinite;}
        .p3ring2{position:absolute;inset:-34px;border-radius:50%;border:1px solid rgba(125,187,255,.13);animation:p3ccw 30s linear infinite;}
        .p3tl,.p3br{display:none;}
        .p3wm{position:fixed;bottom:20px;left:22px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:2px;pointer-events:none;z-index:5;text-transform:uppercase;}
        .p3sys{position:fixed;top:16px;left:18px;z-index:50;display:flex;align-items:center;gap:10px;background:var(--sys-panel);border:1px solid var(--sys-line);border-radius:999px;padding:8px 12px;backdrop-filter:blur(12px);box-shadow:0 10px 22px rgba(0,0,0,.22);}
        .p3time{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sys-text);letter-spacing:.4px;padding-right:8px;border-right:1px solid var(--sys-line);}
        .p3chip{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);padding:6px 11px;border-radius:999px;border:1px solid var(--sys-line);background:var(--sys-panel-soft);text-transform:uppercase;letter-spacing:.8px;}
        .p3chip.active{color:var(--sys-text);border-color:var(--sys-accent);background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));}
        .p3theme{position:fixed;top:16px;right:18px;z-index:50;background:var(--sys-panel);border:1px solid var(--sys-line);border-radius:999px;padding:9px 12px;backdrop-filter:blur(12px);display:flex;align-items:center;gap:8px;box-shadow:0 10px 22px rgba(0,0,0,.22);}
        .p3theme-label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--sys-muted);text-transform:uppercase;}
        .p3theme-sel{background:rgba(7,15,34,.9);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:10px;padding:7px 12px;border-radius:999px;outline:none;cursor:pointer;}
        .p3theme-sel:focus{border-color:var(--sys-accent);box-shadow:0 0 0 2px var(--sys-accent-soft);}

        .p3sel{display:flex;flex-direction:column;align-items:center;height:100vh;padding:30px 26px 82px;position:relative;z-index:10;animation:p3up .6s ease forwards;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;}
        .p3sel::-webkit-scrollbar{width:6px;}
        .p3sel::-webkit-scrollbar-thumb{background:rgba(111,173,255,.35);border-radius:12px;}
        .p3title{text-align:center;margin-bottom:26px;flex-shrink:0;}
        .p3eye{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:4px;color:var(--sys-accent);margin-bottom:10px;animation:p3flicker 6s ease infinite;text-transform:uppercase;}
        .p3main{font-family:'Orbitron',sans-serif;font-size:44px;font-weight:700;color:var(--sys-text);letter-spacing:6px;text-shadow:0 0 28px var(--sys-accent-soft);}
        .p3sub{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sys-muted);letter-spacing:5px;margin-top:8px;text-transform:uppercase;}
        .p3div{width:220px;height:2px;background:linear-gradient(90deg,transparent,var(--sys-accent),transparent);margin:14px auto 0;border-radius:999px;}
        .p3grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;width:100%;max-width:1060px;}

        .p3card{position:relative;background:linear-gradient(170deg,var(--sys-panel-soft),var(--sys-panel));border:1px solid var(--sys-line);padding:20px 18px 22px;border-radius:30px;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;overflow:hidden;animation:p3enter .45s ease forwards;opacity:0;backdrop-filter:blur(12px);}
        .p3card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,0) 40%);pointer-events:none;}
        .p3card:hover{border-color:var(--cc);transform:translateY(-3px) scale(1.005);box-shadow:0 16px 32px rgba(3,7,20,.45),0 0 0 1px var(--cg),0 0 24px var(--cg);}
        .p3acts{position:absolute;top:12px;right:12px;display:none;gap:6px;z-index:2;}
        .p3card:hover .p3acts{display:flex;}
        .p3abtn{background:var(--sys-panel);border:1px solid var(--sys-line);color:var(--sys-muted);font-size:12px;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;border-radius:999px;}
        .p3abtn:hover{border-color:var(--cc);color:var(--cc);background:rgba(9,20,42,.98);}
        .p3abtn.del:hover{border-color:#f06f7b;color:#f06f7b;}
        .p3arc{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--cc);margin-bottom:10px;display:flex;align-items:center;gap:8px;text-transform:uppercase;}
        .p3arc::after{content:'';flex:1;height:1px;background:var(--cc);opacity:.35;}
        .p3avi{font-size:37px;margin-bottom:10px;display:block;filter:drop-shadow(0 0 10px var(--cg));}
        .p3nm{font-family:'Orbitron',sans-serif;font-size:15px;font-weight:700;color:#eaf4ff;margin-bottom:3px;letter-spacing:.8px;}
        .p3ttl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--cc);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px;}
        .p3dsc{font-size:12px;color:rgba(214,235,255,.74);line-height:1.45;}
        .p3badge{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--sys-accent);letter-spacing:1.4px;background:var(--sys-accent-soft);border:1px solid var(--sys-line);padding:2px 7px;display:inline-block;margin-bottom:8px;border-radius:999px;text-transform:uppercase;}

        .p3add{border:1px dashed var(--sys-line);background:var(--sys-panel-soft);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:196px;transition:all .2s;border-radius:30px;backdrop-filter:blur(9px);}
        .p3add:hover{border-color:rgba(142,211,255,.78);background:rgba(25,47,95,.52);box-shadow:0 10px 24px rgba(11,20,40,.4),0 0 18px rgba(125,194,255,.2);}
        .p3addicon{font-size:30px;color:rgba(160,222,255,.76);}
        .p3addlabel{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(160,222,255,.76);letter-spacing:2px;text-transform:uppercase;}

        .p3cr{display:flex;flex-direction:column;height:100vh;position:relative;z-index:10;animation:p3up .5s ease forwards;}
        .p3crh{padding:0 24px;height:70px;display:flex;align-items:center;gap:16px;background:var(--sys-panel);border-bottom:1px solid var(--sys-line);flex-shrink:0;backdrop-filter:blur(14px);border-radius:0 0 24px 24px;}
        .p3crhtitle{font-family:'Orbitron',sans-serif;font-size:18px;color:#eef7ff;letter-spacing:1.5px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .p3crb{flex:1;overflow-y:auto;padding:24px;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;}
        .p3crb::-webkit-scrollbar{width:6px;}
        .p3crb::-webkit-scrollbar-thumb{background:rgba(111,173,255,.35);border-radius:12px;}

        .p3srch{background:var(--sys-panel-soft);border:1px solid var(--sys-line);padding:20px;border-radius:26px;margin-bottom:22px;backdrop-filter:blur(10px);}
        .p3srch-title{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sys-accent);letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;}
        .p3srch-row{display:flex;gap:10px;margin-bottom:10px;}
        .p3si{flex:1;background:var(--sys-panel);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'Inter',sans-serif;font-size:14px;padding:13px 16px;outline:none;transition:border-color .2s,box-shadow .2s;border-radius:18px;}
        .p3si:focus{border-color:var(--sys-accent);box-shadow:0 0 0 3px var(--sys-accent-soft);}
        .p3si::placeholder{color:rgba(175,219,255,.4);}
        .p3sb{background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));border:1px solid var(--sys-accent);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.6px;padding:12px 20px;cursor:pointer;transition:all .2s;white-space:nowrap;border-radius:999px;text-transform:uppercase;}
        .p3sb:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 18px rgba(36,95,191,.36),0 0 0 1px rgba(127,216,255,.55);}
        .p3sb:disabled{opacity:.45;cursor:not-allowed;}
        .p3ss{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sys-muted);letter-spacing:.2px;min-height:16px;}
        .p3spin{display:inline-block;width:11px;height:11px;border:2px solid rgba(120,194,255,.3);border-top-color:#9adfff;border-radius:50%;animation:p3spin .8s linear infinite;margin-right:7px;vertical-align:middle;}

        .p3fg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;}
        .p3fgroup{display:flex;flex-direction:column;gap:6px;}
        .p3fgroup.full{grid-column:1/-1;}
        .p3fl{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:1.4px;text-transform:uppercase;}
        .p3fi,.p3fta,.p3fsel{background:var(--sys-panel);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'Inter',sans-serif;font-size:14px;padding:12px 14px;outline:none;transition:border-color .2s,box-shadow .2s;width:100%;border-radius:18px;}
        .p3fi:focus,.p3fta:focus,.p3fsel:focus{border-color:var(--sys-accent);box-shadow:0 0 0 3px var(--sys-accent-soft);}
        .p3fi::placeholder,.p3fta::placeholder{color:rgba(175,219,255,.38);}
        .p3fta{resize:vertical;min-height:90px;line-height:1.5;}
        .p3fsel{appearance:none;cursor:pointer;}
        .p3fsel option{background:#0c1832;color:#def1ff;}
        .p3cr-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
        .p3cdot{width:24px;height:24px;border-radius:999px;cursor:pointer;transition:transform .15s,box-shadow .15s;border:2px solid transparent;}
        .p3cdot.active,.p3cdot:hover{transform:scale(1.12);border-color:#f2fbff;}
        .p3cinput{width:38px;height:24px;padding:0;border:none;background:none;cursor:pointer;border-radius:6px;}
        .p3av-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
        .p3avopt{font-size:22px;cursor:pointer;padding:6px 9px;border:1px solid transparent;border-radius:999px;transition:all .15s;}
        .p3avopt.active,.p3avopt:hover{border-color:rgba(131,213,255,.64);background:rgba(76,139,255,.2);}

        .p3crf{padding:16px 24px;background:var(--sys-panel);border-top:1px solid var(--sys-line);display:flex;gap:12px;flex-shrink:0;backdrop-filter:blur(14px);}
        .p3save{background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));border:1px solid var(--sys-accent);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.6px;padding:12px 28px;cursor:pointer;transition:all .2s;border-radius:999px;text-transform:uppercase;}
        .p3save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 20px rgba(36,95,191,.32),0 0 0 1px rgba(127,216,255,.6);}
        .p3save:disabled{opacity:.42;cursor:not-allowed;}
        .p3canc{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.4px;padding:12px 20px;cursor:pointer;transition:all .2s;border-radius:999px;text-transform:uppercase;}
        .p3canc:hover{border-color:rgba(156,214,255,.45);background:rgba(18,36,72,.72);}

        .p3mo{position:fixed;inset:0;background:rgba(2,6,14,.74);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);}
        .p3mb{background:linear-gradient(170deg,rgba(14,29,61,.96),rgba(10,21,42,.97));border:1px solid rgba(255,120,135,.45);padding:30px;border-radius:28px;max-width:380px;width:90%;box-shadow:0 22px 40px rgba(0,0,0,.45);}
        .p3mt{font-family:'Orbitron',sans-serif;font-size:16px;color:#f4f8ff;letter-spacing:1.3px;margin-bottom:12px;}
        .p3mx{font-size:13px;color:rgba(215,232,255,.82);line-height:1.6;margin-bottom:22px;}
        .p3ma{display:flex;gap:12px;}
        .p3mdb{flex:1;background:rgba(242,95,111,.15);border:1px solid rgba(242,95,111,.8);color:#ff9faa;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:10px;cursor:pointer;transition:all .2s;border-radius:999px;}
        .p3mdb:hover{background:#f25f6f;color:#fff;}
        .p3mcb{flex:1;background:rgba(16,31,63,.72);border:1px solid rgba(132,194,255,.24);color:rgba(194,228,255,.86);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:10px;cursor:pointer;transition:all .2s;border-radius:999px;}
        .p3mcb:hover{border-color:rgba(156,214,255,.45);}

        .p3chat{display:flex;flex-direction:column;height:100vh;position:relative;z-index:10;animation:p3up .5s ease forwards;}
        .p3ch{padding:0 24px;height:76px;display:flex;align-items:center;gap:16px;background:var(--sys-panel);border-bottom:1px solid var(--sys-line);position:relative;backdrop-filter:blur(14px);flex-shrink:0;border-radius:0 0 24px 24px;}
        .p3ch::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cc),transparent);opacity:.6;}
        .p3back{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:8px 14px;cursor:pointer;transition:all .2s;border-radius:999px;text-transform:uppercase;}
        .p3back:hover{border-color:#8bd8ff;color:#dff5ff;background:rgba(16,37,73,.9);}
        .p3chav{font-size:32px;filter:drop-shadow(0 0 8px var(--cg));}
        .p3chin{flex:1;min-width:0;}
        .p3chnm{font-family:'Orbitron',sans-serif;font-size:18px;color:#f0f8ff;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .p3chtt{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--cc);letter-spacing:1.6px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .p3chac{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(180,223,255,.66);letter-spacing:1.2px;text-align:right;text-transform:uppercase;line-height:1.4;}
        .p3stat{display:flex;align-items:center;gap:8px;padding:8px 24px;background:var(--sys-panel-soft);border-bottom:1px solid var(--sys-line-soft);flex-shrink:0;}
        .p3dot{width:7px;height:7px;border-radius:50%;background:var(--cc);animation:p3pulse 2s ease-in-out infinite;box-shadow:0 0 8px var(--cg);}
        .p3stxt{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:1px;text-transform:uppercase;}
        .p3stime{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:.7px;opacity:.78;}
        .p3msgs{flex:1;overflow-y:auto;padding:24px 24px 16px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;}
        .p3msgs::-webkit-scrollbar{width:6px;}
        .p3msgs::-webkit-scrollbar-thumb{background:rgba(111,173,255,.35);border-radius:12px;}
        .p3mr{display:flex;gap:12px;animation:p3in .24s ease forwards;max-width:740px;}
        .p3mr.user{align-self:flex-end;flex-direction:row-reverse;}
        .p3mr.assistant{align-self:flex-start;}
        .p3mav{width:40px;height:40px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;border:1px solid var(--cc);filter:drop-shadow(0 0 8px var(--cg));background:rgba(9,19,38,.85);}
        .p3uav{width:40px;height:40px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;border:1px solid rgba(131,190,255,.35);background:rgba(9,19,38,.85);font-family:'JetBrains Mono',monospace;color:rgba(190,226,255,.9);}
        .p3bub{padding:13px 16px;line-height:1.62;font-size:14px;font-family:'Inter',sans-serif;letter-spacing:.15px;border-radius:22px;word-break:break-word;}
        .p3bub.assistant{background:var(--sys-panel-soft);border:1px solid var(--sys-line);box-shadow:0 8px 16px rgba(3,7,20,.28);color:var(--sys-text);border-radius:24px 24px 24px 10px;}
        .p3bub.user{background:var(--sys-accent-soft);border:1px solid var(--sys-line);box-shadow:0 8px 16px rgba(3,7,20,.28);color:var(--sys-text);border-radius:24px 24px 10px 24px;}
        .p3tyb{background:var(--sys-panel-soft);border:1px solid var(--sys-line);border-radius:22px;}
        .p3inp{padding:16px 24px 20px;background:var(--sys-panel);border-top:1px solid var(--sys-line);backdrop-filter:blur(14px);flex-shrink:0;border-radius:24px 24px 0 0;}
        .p3inp::before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,var(--cc),transparent);opacity:.35;margin-bottom:14px;}
        .p3inpl{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:6px;}
        .p3inpw{display:flex;gap:10px;align-items:flex-end;}
        .p3ta{flex:1;background:var(--sys-panel);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'Inter',sans-serif;font-size:14px;padding:12px 15px;outline:none;resize:none;transition:border-color .2s,box-shadow .2s;border-radius:20px;min-height:48px;max-height:130px;}
        .p3ta:focus{border-color:var(--cc);box-shadow:0 0 0 3px var(--cg),inset 0 0 14px rgba(17,45,89,.36);}
        .p3ta::placeholder{color:rgba(175,219,255,.45);}
        .p3send{background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));border:1px solid var(--sys-accent);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.4px;padding:13px 20px;cursor:pointer;transition:all .2s;border-radius:999px;white-space:nowrap;text-transform:uppercase;}
        .p3send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 20px rgba(36,95,191,.32),0 0 0 1px rgba(127,216,255,.6);}
        .p3send:disabled{opacity:.4;cursor:not-allowed;}

        @media (max-width: 760px) {
          .p3fg { grid-template-columns: 1fr; }
          .p3chac { display: none; }
          .p3srch-row { flex-direction: column; }
          .p3grid2 { grid-template-columns: repeat(auto-fill,minmax(170px,1fr)); gap: 12px; }
          .p3theme { left: 14px; right: 14px; top: 12px; justify-content: space-between; }
          .p3sys { top: 66px; left: 14px; right: 14px; justify-content: space-between; padding: 8px 10px; gap: 6px; }
          .p3chip { padding: 6px 8px; font-size: 9px; }
          .p3ch,
          .p3stat,
          .p3msgs,
          .p3inp,
          .p3crh,
          .p3crb,
          .p3crf,
          .p3sel { padding-left: 14px; padding-right: 14px; }
          .p3main { font-size: 32px; letter-spacing: 3px; }
          .p3sub { letter-spacing: 3px; }
        }
      `}</style>

      <div
        className={`p3app theme-${themeKey}`}
        style={{
          "--cc": char?.color || "#4a8fc0",
          "--cg": char?.color ? char.color + "66" : "rgba(74,143,192,0.4)",
          ...activeTheme.vars,
        }}
      >
        <div className="p3grid" />
        <div className="p3moon-wrap" style={{ opacity: showMoon ? 1 : 0 }}>
          <div className="p3moon" />
          <div className="p3ring1" />
          <div className="p3ring2" />
        </div>
        <div className="p3tl" />
        <div className="p3br" />
        <div className="p3wm">ORBITAL FREEBASE // SOCIAL LINK OS</div>
        <div className="p3sys">
          <span className="p3time">{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="p3chip active">Home</span>
          <span className="p3chip">Explore</span>
          <span className="p3chip">Library</span>
        </div>
        <div className="p3theme">
          <span className="p3theme-label">Theme</span>
          <select className="p3theme-sel" value={themeKey} onChange={(e) => setThemeKey(e.target.value)}>
            {Object.entries(THEME_PRESETS).map(([key, theme]) => (
              <option key={key} value={key}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        {deleteConfirm && (
          <div className="p3mo">
            <div className="p3mb">
              <div className="p3mt">REMOVE PROFILE</div>
              <div className="p3mx">
                Delete <strong style={{ color: "#e0f0ff" }}>{deleteConfirm.name}</strong> from your Freebase roster? This cannot be undone.
              </div>
              <div className="p3ma">
                <button className="p3mcb" onClick={() => setDeleteConfirm(null)}>
                  CANCEL
                </button>
                <button className="p3mdb" onClick={() => deleteChar(deleteConfirm.id)}>
                  DELETE
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "select" && (
          <div className="p3sel">
            <div className="p3title">
              <div className="p3eye">[ ORBITAL FREEBASE ]</div>
              <div className="p3main">SOCIAL LINK</div>
              <div className="p3sub">CONSOLE CHAT OS</div>
              <div className="p3div" />
            </div>
            <div className="p3grid2">
              {characters.map((c, i) => (
                <div key={c.id} className="p3card" style={{ "--cc": c.color, "--cg": c.color + "66", animationDelay: `${i * 0.1}s` }} onClick={() => selectCharacter(c)}>
                  <div className="p3acts">
                    <button className="p3abtn" title="Edit" onClick={(e) => openEdit(c, e)}>
                      ✎
                    </button>
                    <button
                      className="p3abtn del"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(c);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {!c.isDefault && <div className="p3badge">CUSTOM</div>}
                  <div className="p3arc">
                    {c.arcana} — {c.archetype}
                  </div>
                  <span className="p3avi">{c.avatar}</span>
                  <div className="p3nm">{c.name}</div>
                  <div className="p3ttl">{c.title}</div>
                  <div className="p3dsc">{c.description}</div>
                </div>
              ))}
              <div className="p3add" onClick={openCreate}>
                <div className="p3addicon">＋</div>
                <div className="p3addlabel">NEW CHARACTER</div>
              </div>
            </div>
          </div>
        )}

        {(phase === "create" || phase === "edit") && (
          <div className="p3cr">
            <div className="p3crh">
              <button className="p3back" onClick={() => setPhase("select")}>
                ← BACK
              </button>
              <div className="p3crhtitle">{phase === "edit" ? `EDITING — ${editingChar?.name}` : "CREATE NEW PROFILE"}</div>
            </div>
            <div className="p3crb">
              <div className="p3srch">
                <div className="p3srch-title">[ AUTO-BUILD FROM WEB RESEARCH ]</div>
                <div className="p3srch-row">
                  <input
                    className="p3si"
                    placeholder="Enter a name (e.g. Alan Turing, Nikola Tesla, Shakespeare...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchAndBuild()}
                  />
                  <button className="p3sb" onClick={searchAndBuild} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? "SEARCHING..." : "RESEARCH"}
                  </button>
                </div>
                <div className="p3ss">
                  {isSearching && <span className="p3spin" />}
                  {searchStatus || "Enter any real or fictional person and click RESEARCH to auto-fill from web sources."}
                </div>
              </div>

              <div className="p3fg">
                <div className="p3fgroup">
                  <label className="p3fl">NAME *</label>
                  <input className="p3fi" placeholder="Character name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="p3fgroup">
                  <label className="p3fl">TITLE</label>
                  <input className="p3fi" placeholder="Short role or epithet" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="p3fgroup">
                  <label className="p3fl">ARCANA</label>
                  <select
                    className="p3fsel"
                    value={form.arcana}
                    onChange={(e) => {
                      const found = ARCANA_OPTIONS.find((a) => a.value === e.target.value);
                      setForm((p) => ({ ...p, arcana: e.target.value, archetype: found?.archetype || p.archetype }));
                    }}
                  >
                    {ARCANA_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p3fgroup">
                  <label className="p3fl">AVATAR EMOJI</label>
                  <div className="p3av-row">
                    {AVATAR_OPTIONS.map((a) => (
                      <span key={a} className={`p3avopt${form.avatar === a ? " active" : ""}`} onClick={() => setForm((p) => ({ ...p, avatar: a }))}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p3fgroup full">
                  <label className="p3fl">ACCENT COLOR</label>
                  <div className="p3cr-row">
                    {COLOR_PRESETS.map((c) => (
                      <div
                        key={c}
                        className={`p3cdot${form.color === c ? " active" : ""}`}
                        style={{ background: c, boxShadow: `0 0 8px ${c}66` }}
                        onClick={() => setForm((p) => ({ ...p, color: c }))}
                      />
                    ))}
                    <input type="color" className="p3cinput" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
                  </div>
                </div>
                <div className="p3fgroup full">
                  <label className="p3fl">DESCRIPTION</label>
                  <input
                    className="p3fi"
                    placeholder="One sentence about this character"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="p3fgroup full">
                  <label className="p3fl">SYSTEM PROMPT * — personality & roleplay instructions</label>
                  <textarea
                    className="p3fta"
                    style={{ minHeight: 130 }}
                    placeholder="Describe their personality, speech patterns, knowledge, mannerisms. This tells Claude how to roleplay as them."
                    value={form.systemPrompt}
                    onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                  />
                </div>
                <div className="p3fgroup full">
                  <label className="p3fl">OPENING GREETING</label>
                  <textarea
                    className="p3fta"
                    style={{ minHeight: 70 }}
                    placeholder="First line they say when the chat starts..."
                    value={form.greeting}
                    onChange={(e) => setForm((p) => ({ ...p, greeting: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="p3crf">
              <button className="p3canc" onClick={() => setPhase("select")}>
                CANCEL
              </button>
              <button className="p3save" onClick={saveChar} disabled={!form.name.trim() || !form.systemPrompt.trim()}>
                {phase === "edit" ? "UPDATE PROFILE" : "SAVE PROFILE"}
              </button>
            </div>
          </div>
        )}

        {phase === "chat" && char && (
          <div className="p3chat">
            <div className="p3ch">
              <button
                className="p3back"
                onClick={() => {
                  setPhase("select");
                  setSelectedChar(null);
                  setMessages([]);
                }}
              >
                ← BACK
              </button>
              <div className="p3chav">{char.avatar}</div>
              <div className="p3chin">
                <div className="p3chnm">{char.name}</div>
                <div className="p3chtt">{char.title}</div>
              </div>
              <div className="p3chac">
                ARCANA {char.arcana}
                <br />
                <span style={{ fontSize: 8 }}>{char.archetype}</span>
              </div>
            </div>
              <div className="p3stat">
              <div className="p3dot" />
              <div className="p3stxt">FREEBASE LINK — CONNECTION ACTIVE</div>
              <div className="p3stime">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div className="p3msgs">
              {messages.map((msg) => (
                <div key={msg.id} className={`p3mr ${msg.role}`}>
                  {msg.role === "assistant" ? <div className="p3mav">{char.avatar}</div> : <div className="p3uav">S</div>}
                  <div className={`p3bub ${msg.role}`}>{msg.content}</div>
                </div>
              ))}
              {isTyping && (
                <div className="p3mr assistant">
                  <div className="p3mav">{char.avatar}</div>
                  <div className="p3tyb">
                    <TypingIndicator color={char.color} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p3inp">
              <div className="p3inpl">[ COMPOSE PACKET ]</div>
              <div className="p3inpw">
                <textarea
                  ref={inputRef}
                  className="p3ta"
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
                <button className="p3send" onClick={sendMessage} disabled={isTyping || !input.trim()}>
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