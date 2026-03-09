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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&family=Share+Tech+Mono&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#050d1a;font-family:'Rajdhani',sans-serif;overflow:hidden;height:100vh;}
        @keyframes p3pulse{0%,100%{opacity:0.3;transform:scale(0.8);}50%{opacity:1;transform:scale(1);}}
        @keyframes p3up{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes p3in{from{opacity:0;transform:translateX(-15px);}to{opacity:1;transform:translateX(0);}}
        @keyframes p3scan{0%{transform:translateY(-100%);}100%{transform:translateY(100vh);}}
        @keyframes p3cw{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes p3ccw{from{transform:rotate(0deg);}to{transform:rotate(-360deg);}}
        @keyframes p3glow{0%,100%{filter:drop-shadow(0 0 20px rgba(100,160,255,0.4));}50%{filter:drop-shadow(0 0 40px rgba(100,160,255,0.8));}}
        @keyframes p3flicker{0%,95%,100%{opacity:1;}96%{opacity:0.7;}97%{opacity:1;}98%{opacity:0.5;}}
        @keyframes p3enter{from{opacity:0;transform:scale(0.9) translateY(10px);}to{opacity:1;transform:scale(1) translateY(0);}}
        @keyframes p3spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

        .p3app{width:100vw;height:100vh;background:#050d1a;position:relative;overflow:hidden;}
        .p3scan{position:fixed;top:0;left:0;right:0;height:3px;background:rgba(100,200,255,0.03);animation:p3scan 8s linear infinite;pointer-events:none;z-index:1000;}
        .p3grid{position:fixed;inset:0;background-image:linear-gradient(rgba(0,60,120,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(0,60,120,0.12) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
        .p3moon-wrap{position:fixed;top:-100px;right:-100px;width:350px;height:350px;pointer-events:none;transition:opacity 1s;}
        .p3moon{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 35% 35%,#7eb8f7,#1a3a6b 60%,#0a1830);animation:p3glow 4s ease-in-out infinite;opacity:0.6;}
        .p3ring1{position:absolute;inset:-20px;border-radius:50%;border:1px solid rgba(100,180,255,0.15);animation:p3cw 20s linear infinite;}
        .p3ring2{position:absolute;inset:-40px;border-radius:50%;border:1px solid rgba(100,180,255,0.08);animation:p3ccw 35s linear infinite;}
        .p3tl{position:fixed;top:16px;left:16px;width:60px;height:60px;border-top:1px solid rgba(70,130,180,0.3);border-left:1px solid rgba(70,130,180,0.3);pointer-events:none;z-index:5;}
        .p3br{position:fixed;bottom:16px;right:16px;width:60px;height:60px;border-bottom:1px solid rgba(70,130,180,0.3);border-right:1px solid rgba(70,130,180,0.3);pointer-events:none;z-index:5;}
        .p3wm{position:fixed;bottom:24px;left:24px;font-family:'Cinzel',serif;font-size:9px;color:rgba(70,130,180,0.2);letter-spacing:4px;pointer-events:none;z-index:5;}

        .p3sel{display:flex;flex-direction:column;align-items:center;height:100vh;padding:32px 24px 80px;position:relative;z-index:10;animation:p3up 0.8s ease forwards;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(70,130,180,0.3) transparent;}
        .p3sel::-webkit-scrollbar{width:4px;}
        .p3sel::-webkit-scrollbar-thumb{background:rgba(70,130,180,0.3);border-radius:2px;}
        .p3title{text-align:center;margin-bottom:28px;flex-shrink:0;}
        .p3eye{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:6px;color:#4a8fc0;margin-bottom:8px;animation:p3flicker 6s ease infinite;}
        .p3main{font-family:'Cinzel',serif;font-size:42px;font-weight:700;color:#e8f4ff;letter-spacing:8px;text-shadow:0 0 30px rgba(100,180,255,0.4),0 0 60px rgba(100,180,255,0.2);}
        .p3sub{font-family:'Cinzel',serif;font-size:14px;color:#4a8fc0;letter-spacing:12px;margin-top:6px;}
        .p3div{width:200px;height:1px;background:linear-gradient(90deg,transparent,#4a8fc0,transparent);margin:16px auto 0;}
        .p3grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;width:100%;max-width:960px;}

        .p3card{position:relative;background:rgba(5,20,40,0.8);border:1px solid rgba(70,130,180,0.2);padding:18px 14px 20px;cursor:pointer;transition:all 0.25s;overflow:hidden;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));animation:p3enter 0.5s ease forwards;opacity:0;}
        .p3card:hover{border-color:var(--cc);transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,0.5),0 0 20px var(--cg);}
        .p3acts{position:absolute;top:8px;right:8px;display:none;gap:4px;z-index:2;}
        .p3card:hover .p3acts{display:flex;}
        .p3abtn{background:rgba(5,15,30,0.92);border:1px solid rgba(70,130,180,0.3);color:rgba(180,210,240,0.7);font-size:11px;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
        .p3abtn:hover{border-color:var(--cc);color:var(--cc);}
        .p3abtn.del:hover{border-color:#c0392b;color:#c0392b;}
        .p3arc{font-family:'Cinzel',serif;font-size:9px;letter-spacing:3px;color:var(--cc);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
        .p3arc::after{content:'';flex:1;height:1px;background:var(--cc);opacity:0.3;}
        .p3avi{font-size:36px;margin-bottom:10px;display:block;filter:drop-shadow(0 0 10px var(--cg));}
        .p3nm{font-family:'Cinzel',serif;font-size:15px;font-weight:600;color:#e0f0ff;margin-bottom:3px;letter-spacing:1px;}
        .p3ttl{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--cc);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
        .p3dsc{font-size:11px;color:rgba(180,210,240,0.6);line-height:1.5;}
        .p3badge{font-family:'Share Tech Mono',monospace;font-size:7px;color:#4a8fc0;letter-spacing:2px;background:rgba(74,143,192,0.1);border:1px solid rgba(74,143,192,0.2);padding:2px 6px;display:inline-block;margin-bottom:8px;}

        .p3add{border:1px dashed rgba(70,130,180,0.25);background:rgba(5,20,40,0.4);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:180px;transition:all 0.25s;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));}
        .p3add:hover{border-color:rgba(74,143,192,0.6);background:rgba(74,143,192,0.05);box-shadow:0 0 20px rgba(74,143,192,0.1);}
        .p3addicon{font-size:28px;color:rgba(74,143,192,0.5);}
        .p3addlabel{font-family:'Cinzel',serif;font-size:10px;color:rgba(74,143,192,0.5);letter-spacing:3px;}

        .p3cr{display:flex;flex-direction:column;height:100vh;position:relative;z-index:10;animation:p3up 0.5s ease forwards;}
        .p3crh{padding:0 24px;height:64px;display:flex;align-items:center;gap:16px;background:rgba(5,15,30,0.9);border-bottom:1px solid rgba(70,130,180,0.15);flex-shrink:0;}
        .p3crhtitle{font-family:'Cinzel',serif;font-size:18px;color:#e0f0ff;letter-spacing:3px;flex:1;}
        .p3crb{flex:1;overflow-y:auto;padding:24px;scrollbar-width:thin;scrollbar-color:rgba(70,130,180,0.3) transparent;}
        .p3crb::-webkit-scrollbar{width:4px;}
        .p3crb::-webkit-scrollbar-thumb{background:rgba(70,130,180,0.3);border-radius:2px;}

        .p3srch{background:rgba(10,25,50,0.6);border:1px solid rgba(70,130,180,0.2);padding:20px;margin-bottom:24px;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);}
        .p3srch-title{font-family:'Cinzel',serif;font-size:12px;color:#4a8fc0;letter-spacing:4px;margin-bottom:12px;}
        .p3srch-row{display:flex;gap:10px;margin-bottom:10px;}
        .p3si{flex:1;background:rgba(0,15,35,0.8);border:1px solid rgba(70,130,180,0.2);color:#c8e0f8;font-family:'Rajdhani',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border-color 0.2s;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);}
        .p3si:focus{border-color:#4a8fc0;}
        .p3si::placeholder{color:rgba(100,160,220,0.3);}
        .p3sb{background:rgba(10,30,60,0.8);border:1px solid #4a8fc0;color:#4a8fc0;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;padding:10px 18px;cursor:pointer;transition:all 0.2s;white-space:nowrap;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);}
        .p3sb:hover:not(:disabled){background:#4a8fc0;color:#050d1a;}
        .p3sb:disabled{opacity:0.4;cursor:not-allowed;}
        .p3ss{font-family:'Share Tech Mono',monospace;font-size:10px;color:#4a8fc0;letter-spacing:1px;min-height:16px;}
        .p3spin{display:inline-block;width:10px;height:10px;border:2px solid rgba(74,143,192,0.3);border-top-color:#4a8fc0;border-radius:50%;animation:p3spin 0.8s linear infinite;margin-right:6px;vertical-align:middle;}

        .p3fg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;}
        .p3fgroup{display:flex;flex-direction:column;gap:6px;}
        .p3fgroup.full{grid-column:1/-1;}
        .p3fl{font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(100,160,220,0.6);letter-spacing:3px;text-transform:uppercase;}
        .p3fi,.p3fta,.p3fsel{background:rgba(0,15,35,0.8);border:1px solid rgba(70,130,180,0.2);color:#c8e0f8;font-family:'Rajdhani',sans-serif;font-size:14px;padding:10px 14px;outline:none;transition:border-color 0.2s,box-shadow 0.2s;width:100%;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);}
        .p3fi:focus,.p3fta:focus,.p3fsel:focus{border-color:#4a8fc0;box-shadow:0 0 10px rgba(74,143,192,0.2);}
        .p3fi::placeholder,.p3fta::placeholder{color:rgba(100,160,220,0.25);}
        .p3fta{resize:vertical;min-height:90px;line-height:1.5;}
        .p3fsel{appearance:none;cursor:pointer;}
        .p3fsel option{background:#0a1a2e;color:#c8e0f8;}
        .p3cr-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
        .p3cdot{width:24px;height:24px;border-radius:3px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;border:2px solid transparent;}
        .p3cdot.active,.p3cdot:hover{transform:scale(1.2);border-color:white;}
        .p3cinput{width:36px;height:24px;padding:0;border:none;background:none;cursor:pointer;border-radius:3px;}
        .p3av-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;}
        .p3avopt{font-size:22px;cursor:pointer;padding:4px 6px;border:1px solid transparent;border-radius:4px;transition:all 0.15s;}
        .p3avopt.active,.p3avopt:hover{border-color:rgba(74,143,192,0.6);background:rgba(74,143,192,0.1);}

        .p3crf{padding:16px 24px;background:rgba(5,15,30,0.95);border-top:1px solid rgba(70,130,180,0.15);display:flex;gap:12px;flex-shrink:0;}
        .p3save{background:rgba(10,30,60,0.8);border:1px solid #4a8fc0;color:#4a8fc0;font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;padding:12px 28px;cursor:pointer;transition:all 0.2s;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);}
        .p3save:hover:not(:disabled){background:#4a8fc0;color:#050d1a;box-shadow:0 0 20px rgba(74,143,192,0.4);}
        .p3save:disabled{opacity:0.4;cursor:not-allowed;}
        .p3canc{background:none;border:1px solid rgba(70,130,180,0.2);color:rgba(100,160,220,0.5);font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;padding:12px 20px;cursor:pointer;transition:all 0.2s;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);}
        .p3canc:hover{border-color:rgba(100,160,220,0.4);color:rgba(150,200,240,0.8);}

        .p3mo{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
        .p3mb{background:#050d1a;border:1px solid rgba(192,57,43,0.5);padding:32px;max-width:360px;width:90%;clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));box-shadow:0 0 40px rgba(192,57,43,0.2);}
        .p3mt{font-family:'Cinzel',serif;font-size:16px;color:#e0f0ff;letter-spacing:2px;margin-bottom:12px;}
        .p3mx{font-size:13px;color:rgba(180,210,240,0.6);line-height:1.6;margin-bottom:24px;}
        .p3ma{display:flex;gap:12px;}
        .p3mdb{flex:1;background:rgba(192,57,43,0.1);border:1px solid #c0392b;color:#c0392b;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;padding:10px;cursor:pointer;transition:all 0.2s;}
        .p3mdb:hover{background:#c0392b;color:white;}
        .p3mcb{flex:1;background:none;border:1px solid rgba(70,130,180,0.2);color:rgba(100,160,220,0.5);font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;padding:10px;cursor:pointer;transition:all 0.2s;}
        .p3mcb:hover{border-color:rgba(100,160,220,0.4);color:rgba(150,200,240,0.8);}

        .p3chat{display:flex;flex-direction:column;height:100vh;position:relative;z-index:10;animation:p3up 0.5s ease forwards;}
        .p3ch{padding:0 24px;height:70px;display:flex;align-items:center;gap:16px;background:rgba(5,15,30,0.9);border-bottom:1px solid rgba(70,130,180,0.15);position:relative;backdrop-filter:blur(10px);flex-shrink:0;}
        .p3ch::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cc),transparent);opacity:0.5;}
        .p3back{background:none;border:1px solid rgba(70,130,180,0.3);color:#4a8fc0;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;padding:6px 12px;cursor:pointer;transition:all 0.2s;clip-path:polygon(8px 0,100% 0,100% 100%,0 100%,0 8px);}
        .p3back:hover{border-color:#4a8fc0;color:#7ec8ff;background:rgba(74,143,192,0.1);}
        .p3chav{font-size:32px;filter:drop-shadow(0 0 8px var(--cg));}
        .p3chin{flex:1;}
        .p3chnm{font-family:'Cinzel',serif;font-size:18px;color:#e0f0ff;letter-spacing:2px;}
        .p3chtt{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--cc);letter-spacing:3px;text-transform:uppercase;}
        .p3chac{font-family:'Cinzel',serif;font-size:11px;color:rgba(100,160,220,0.5);letter-spacing:2px;text-align:right;}
        .p3stat{display:flex;align-items:center;gap:8px;padding:6px 24px;background:rgba(0,10,25,0.8);border-bottom:1px solid rgba(70,130,180,0.08);flex-shrink:0;}
        .p3dot{width:6px;height:6px;border-radius:50%;background:var(--cc);animation:p3pulse 2s ease-in-out infinite;box-shadow:0 0 6px var(--cg);}
        .p3stxt{font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(100,160,220,0.5);letter-spacing:2px;}
        .p3stime{margin-left:auto;font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(100,160,220,0.3);letter-spacing:1px;}
        .p3msgs{flex:1;overflow-y:auto;padding:24px 24px 16px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:rgba(70,130,180,0.3) transparent;}
        .p3msgs::-webkit-scrollbar{width:4px;}
        .p3msgs::-webkit-scrollbar-thumb{background:rgba(70,130,180,0.3);border-radius:2px;}
        .p3mr{display:flex;gap:12px;animation:p3in 0.3s ease forwards;max-width:680px;}
        .p3mr.user{align-self:flex-end;flex-direction:row-reverse;}
        .p3mr.assistant{align-self:flex-start;}
        .p3mav{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid var(--cc);filter:drop-shadow(0 0 6px var(--cg));background:rgba(5,15,30,0.8);}
        .p3uav{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;border:1px solid rgba(70,130,180,0.4);background:rgba(5,15,30,0.8);font-family:'Cinzel',serif;color:rgba(100,180,255,0.7);}
        .p3bub{padding:12px 16px;line-height:1.6;font-size:14px;font-family:'Rajdhani',sans-serif;letter-spacing:0.3px;}
        .p3bub.assistant{background:rgba(10,25,50,0.8);border:1px solid rgba(70,130,180,0.2);border-left:2px solid var(--cc);color:#c8e0f8;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);}
        .p3bub.user{background:rgba(20,40,80,0.6);border:1px solid rgba(100,160,220,0.25);border-right:2px solid rgba(100,160,220,0.6);color:#a0c8f0;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%,0 12px);}
        .p3tyb{background:rgba(10,25,50,0.8);border:1px solid rgba(70,130,180,0.2);border-left:2px solid var(--cc);clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);}
        .p3inp{padding:16px 24px 20px;background:rgba(5,15,30,0.95);border-top:1px solid rgba(70,130,180,0.15);backdrop-filter:blur(10px);flex-shrink:0;}
        .p3inp::before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,var(--cc),transparent);opacity:0.3;margin-bottom:14px;}
        .p3inpl{font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(100,160,220,0.4);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;}
        .p3inpw{display:flex;gap:12px;align-items:flex-end;}
        .p3ta{flex:1;background:rgba(0,15,35,0.8);border:1px solid rgba(70,130,180,0.2);color:#c8e0f8;font-family:'Rajdhani',sans-serif;font-size:14px;padding:12px 16px;outline:none;resize:none;transition:border-color 0.2s,box-shadow 0.2s;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);min-height:48px;max-height:120px;}
        .p3ta:focus{border-color:var(--cc);box-shadow:0 0 15px var(--cg),inset 0 0 10px rgba(0,40,80,0.3);}
        .p3ta::placeholder{color:rgba(100,160,220,0.3);}
        .p3send{background:rgba(10,25,50,0.8);border:1px solid var(--cc);color:var(--cc);font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;padding:13px 20px;cursor:pointer;transition:all 0.2s;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);white-space:nowrap;}
        .p3send:hover:not(:disabled){background:var(--cc);color:#050d1a;box-shadow:0 0 20px var(--cg);}
        .p3send:disabled{opacity:0.4;cursor:not-allowed;}

        @media (max-width: 700px) {
          .p3fg { grid-template-columns: 1fr; }
          .p3chac { display: none; }
          .p3ch,
          .p3stat,
          .p3msgs,
          .p3inp,
          .p3crh,
          .p3crb,
          .p3crf { padding-left: 14px; padding-right: 14px; }
        }
      `}</style>

      <div
        className="p3app"
        style={{
          "--cc": char?.color || "#4a8fc0",
          "--cg": char?.color ? char.color + "66" : "rgba(74,143,192,0.4)",
        }}
      >
        <div className="p3scan" />
        <div className="p3grid" />
        <div className="p3moon-wrap" style={{ opacity: showMoon ? 1 : 0 }}>
          <div className="p3moon" />
          <div className="p3ring1" />
          <div className="p3ring2" />
        </div>
        <div className="p3tl" />
        <div className="p3br" />
        <div className="p3wm">MEMENTO MORI — DARK HOUR SYSTEM</div>

        {deleteConfirm && (
          <div className="p3mo">
            <div className="p3mb">
              <div className="p3mt">PURGE RECORD</div>
              <div className="p3mx">
                Delete <strong style={{ color: "#e0f0ff" }}>{deleteConfirm.name}</strong> from the Dark Hour Network? This cannot be undone.
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
              <div className="p3eye">[ DARK HOUR NETWORK ]</div>
              <div className="p3main">PERSONA</div>
              <div className="p3sub">DIALOGUE SYSTEM</div>
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
              <div className="p3crhtitle">{phase === "edit" ? `EDITING — ${editingChar?.name}` : "SUMMON NEW CHARACTER"}</div>
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
                  {searchStatus || "Enter any real or fictional person and click RESEARCH to auto-fill from Wikipedia & the web."}
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
                {phase === "edit" ? "UPDATE CHARACTER" : "SUMMON CHARACTER"}
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
              <div className="p3stxt">DARK HOUR — CONNECTION ACTIVE</div>
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
              <div className="p3inpl">[ TRANSMIT MESSAGE ]</div>
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