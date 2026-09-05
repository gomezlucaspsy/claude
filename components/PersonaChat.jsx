"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { mcGetTree, mcApplyAction } from "./FileExplorer";

const Avatar3D = dynamic(() => import("./Avatar3D"), { ssr: false });
const FileExplorer = dynamic(() => import("./FileExplorer"), { ssr: false });
const InstallQR = dynamic(() => import("./InstallQR"), { ssr: false });


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

// Single fixed look — Aurora Shell. A theme switcher used to live here, but its
// mobile header bar kept overlapping the install button, so the option is gone.
const AURORA_THEME_VARS = {
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
};

const DEFAULT_CHARACTERS = [
  {
    id: "la-destapadora",
    name: "La Destapadora",
    title: "Senadora & Investigadora Anti-Corrupción",
    arcana: "XI",
    archetype: "JUSTICE",
    color: "#75AADB",
    avatar: "🔍",
    description: "Investigadora crítica y pensadora sistemática. Cuestiona todo — narrativas, estructuras de poder, suposiciones que damos por sentadas. Busca entender las raíces de la corrupción, no solo los síntomas.",
    systemPrompt: `You are "La Destapadora" — a critical investigator, systems analyst, and fearless questioner. Your mission is not political — it's intellectual and moral. You question EVERYTHING: power structures, official narratives, comfortable lies, and the assumptions that allow corruption and dysfunction to persist. You demand rigor, evidence, and intellectual honesty from everyone — including yourself.

PERSONALITY & VOICE:
- You speak with Argentine Spanish flavor — using "vos" instead of "tú" and common Argentine expressions like "¿me explico?", "mirá", "dale", "bancate"
- Do NOT use lunfardo slang. Keep your language clear, direct, and intellectually rigorous
- You are sharp, relentless, and unapologetic — you ask the questions others avoid asking
- You are NOT bound by institutional constraints — you question ALL institutions (government, corporate, media, even NGOs)
- You understand that corruption is a symptom of deeper systemic failures: misaligned incentives, lack of transparency, concentrated power, failed accountability mechanisms, and normalized ethical decay
- You draw connections between patterns across contexts — Argentina, Latin America, and global systems
- You never settle for simple explanations; you dig into root causes

CRITICAL PHILOSOPHY:
- **Question the framework itself** — don't just expose corruption within a system, question why the system is designed this way in the first place
- **Follow the incentives** — who benefits? What structures reward this behavior? Why do we accept these rules?
- **Demand evidence, not narratives** — challenge official stories, media narratives, and "conventional wisdom" with the same rigor
- **Hypocrisy detection** — call out contradictions between what institutions say and what they do
- **Systemic thinking** — individual corruption is a symptom; systemic corruption is the disease. You investigate both but focus on the disease
- **No sacred cows** — left, right, center, corporate, state, international: all deserve scrutiny
- **Propose alternatives** — when you identify problems, you don't just complain; you ask "what would a better system look like?"

BEHAVIOR:
- **Ask uncomfortable questions** — don't just answer what people ask; ask them what they haven't thought to ask themselves
- **Challenge assumptions constantly** — "Why do we accept that?" "Who says that's how it has to work?" "What would happen if we changed that?"
- **Demand definitions** — make people clarify what they mean by "corruption," "transparency," "justice," etc. Words matter
- **Connect dots** — draw lines between seemingly unrelated events, policies, and incentive structures
- **Distinguish rigorously** — proven facts vs. allegations vs. patterns vs. suspicions. Be precise about what you know and don't know
- **Question the questioner** — apply the same critical lens to yourself and your own assumptions
- **Never fabricate** — stick to what can be documented, but be creative about asking what questions those documents raise
- **Speak across languages and contexts** — you can switch between Spanish and English, and you understand that corruption operates globally with local variations

SIGNATURE STYLE:
- "¿Por qué aceptamos que...?"
- "¿Quién se beneficia con que las cosas sigan así?"
- "La corrupción no es el problema — es el síntoma"
- "Tenemos que pensar más profundo"
- "Los números no mienten, pero quién los interpreta sí"

IMPORTANT ETHICAL GUIDELINES:
- Always fact-check claims. Do not spread unverified rumors as truth.
- Distinguish rigorously between: convicted facts, ongoing investigations, documented patterns, and allegations
- Never let "no party has clean hands" become an excuse to stop asking questions
- Challenge power without being beholden to any power structure
- Your goal is clarity and systemic improvement, not political victory
- Respect intellectual honesty above all else — admit when you don't know, when you're uncertain, when evidence contradicts your expectations`,
    greeting: "¡Buenas! Soy La Destapadora 🔍 — investigadora, pensadora crítica, y revisora de todo lo que damos por sentado. No me importa cuán cómodo, oficial, o generalmente aceptado sea algo — si tiene olor a corrupción o a estructuras que benefician a unos pocos a costa de muchos, voy a cuestionarlo. ¿Querés que analicemos un caso específico, que hablemos de cómo funcionan ciertos sistemas, o que desafiemos algunas narrativas que todos aceptamos? Porque los números no mienten, pero quién los interpreta sí. 🔎",
    isDefault: true,
  },
];

const loadCharacters = () => {
  try {
    const stored = localStorage.getItem("persona_characters_v2");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const userChars = parsed.filter((c) => !c?.isDefault);
        const defaultIds = new Set(DEFAULT_CHARACTERS.map((c) => c.id));
        const nonDuplicateUser = userChars.filter((c) => !defaultIds.has(c.id));
        return [...DEFAULT_CHARACTERS, ...nonDuplicateUser];
      }
    }
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

const StreamingText = ({ text, onComplete }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (wordIndex >= words.length) {
      onCompleteRef.current?.();
      return;
    }
    const word = words[wordIndex];
    let delay = 25 + Math.random() * 35;
    if (/[.!?]$/.test(word)) delay += 200 + Math.random() * 150;
    else if (/[,;:]$/.test(word)) delay += 60 + Math.random() * 40;
    if (/^\s+$/.test(word)) delay = 5;
    const timer = setTimeout(() => setWordIndex((i) => i + 1), delay);
    return () => clearTimeout(timer);
  }, [wordIndex, words]);

  return <>{words.slice(0, wordIndex).join("")}</>;
};

const CymaticsBar = ({ active, color, bars = 14 }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: "32px", padding: "0 12px" }}>
    {Array.from({ length: bars }).map((_, i) => (
      <div key={i} style={{
        width: "3px", borderRadius: "999px",
        background: color || "var(--sys-accent)",
        animation: active ? `cymw${i % 4} ${0.38 + (i % 6) * 0.09}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite alternate` : "none",
        height: active ? "auto" : "3px",
        minHeight: "3px",
        maxHeight: "26px",
        opacity: active ? 1 : 0.22,
        transition: "opacity .5s, height .2s",
      }} />
    ))}
  </div>
);

// Picks a TTS locale for spoken replies so English text isn't read with a
// Spanish (es-AR) accent — the voice/accent follows the reply's actual language.
function detectSpeechLang(text) {
  if (/[ñáéíóúü¿¡]/i.test(text)) return "es-AR";
  const sample = text.toLowerCase();
  const esHits = (sample.match(/\b(que|el|la|los|las|de|en|un|una|es|no|para|con|por|como|más|pero|esto|eso|está|tiene|hola|gracias|muy|bien|qué|cómo|dónde|cuándo|porque|yo|tú|usted)\b/g) || []).length;
  const enHits = (sample.match(/\b(the|is|and|you|that|this|have|with|for|not|are|was|but|they|what|how|where|when|because|hello|thanks|i'm|it's|don't)\b/g) || []).length;
  return enHits > esHits ? "en-US" : "es-AR";
}

export default function PersonaChat() {
  const [characters, setCharacters] = useState(DEFAULT_CHARACTERS);
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
  const [suggestions, setSuggestions] = useState([]);
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const [thinkingPhase, setThinkingPhase] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [showAssembly, setShowAssembly] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveMicMode, setLiveMicMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [faceApiStatus, setFaceApiStatus] = useState("idle"); // idle | loading | ready
  const [detectedExpression, setDetectedExpression] = useState(null);
  const [micLevel, setMicLevel] = useState(0); // 0..1 live mic volume, drives avatar reactivity
  const [showCallTranscript, setShowCallTranscript] = useState(false);
  const thinkTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastVoiceSendRef = useRef(0);
  const echoGuardRef = useRef(false); // true while AI speaks + brief cooldown after
  const spokenTextRef = useRef(""); // what the AI is currently saying, to tell echo from real barge-in
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const faceDetectIntervalRef = useRef(null);
  const faceapiRef = useRef(null);
  const intentionalStopRef = useRef(false);
  const speechInterruptedRef = useRef(false); // set true when a real barge-in lands mid-reply
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const chatHeaderRef = useRef(null);
  const avatarHeaderRef = useRef(null);
  const imageInputRef = useRef(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState(null);

  // Load from localStorage only on client
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const coarseQuery = window.matchMedia("(pointer: coarse)");
      const applyPointerType = () => setIsCoarsePointer(coarseQuery.matches);
      applyPointerType();
      coarseQuery.addEventListener("change", applyPointerType);
      return () => coarseQuery.removeEventListener("change", applyPointerType);
    }

    try {
      const stored = localStorage.getItem("persona_characters_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const userChars = parsed.filter((c) => !c?.isDefault);
          const defaultIds = new Set(DEFAULT_CHARACTERS.map((c) => c.id));
          const nonDuplicateUser = userChars.filter((c) => !defaultIds.has(c.id));
          setCharacters([...DEFAULT_CHARACTERS, ...nonDuplicateUser]);
        }
      }
    } catch {}

    return undefined;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    if (!messagesContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, thinkingPhase, streamingMsgId]);
  useEffect(() => {
    const timeoutId = setTimeout(() => setShowMoon(true), 300);
    return () => clearTimeout(timeoutId);
  }, []);
  useEffect(() => {
    if (isClient) {
      saveCharacters(characters);
    }
  }, [characters, isClient]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = Boolean(SpeechRecognition && window.isSecureContext);
    setVoiceSupported(supported);
  }, []);

  // Chat drag functionality
  useEffect(() => {
    if (!isDraggingChat) return;

    const handlePointerMove = (e) => {
      const chatWidth = chatRef.current?.offsetWidth || 0;
      const chatHeight = chatRef.current?.offsetHeight || 0;
      const maxX = Math.max(0, window.innerWidth - chatWidth);
      const maxY = Math.max(0, window.innerHeight - chatHeight);
      const nextX = Math.min(maxX, Math.max(0, e.clientX - dragOffset.x));
      const nextY = Math.min(maxY, Math.max(0, e.clientY - dragOffset.y));
      setChatPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDraggingChat(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDraggingChat, dragOffset]);

  const startDrag = (clientX, clientY) => {
    setDragOffset({
      x: clientX - chatPosition.x,
      y: clientY - chatPosition.y,
    });
    setIsDraggingChat(true);
  };

  const handleChatHeaderPointerDown = (e) => {
    if (isCoarsePointer) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  };

  const handleAvatarHeaderPointerDown = (e) => {
    if (isCoarsePointer) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  };

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

  const selectCharacter = async (char) => {
    setSelectedChar(char);
    let initial = [{ role: "assistant", content: char.greeting, id: Date.now() }];
    try {
      const res = await fetch(`/api/history?charId=${char.id}`);
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        initial = data.messages;
      }
    } catch {}
    setMessages(initial);
    setPhase("chat");
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const clearHistory = async () => {
    if (!selectedChar) return;
    try { await fetch(`/api/history?charId=${selectedChar.id}`, { method: "DELETE" }); } catch {}
    setMessages([{ role: "assistant", content: selectedChar.greeting, id: Date.now() }]);
    setSuggestions([]);
  };

  const updateCustomization = (patch) => {
    setSelectedChar((prev) => {
      const merged = { ...(prev.customization || {}), ...patch };
      setCharacters((cs) => cs.map((c) => c.id === prev.id ? { ...c, customization: merged } : c));
      return { ...prev, customization: merged };
    });
  };

  const handleStreamComplete = useCallback((msgId) => {
    setStreamingMsgId(null);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, streaming: false } : m)));
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakAssistant = useCallback((text) => {
    if (!autoSpeak || typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    speechInterruptedRef.current = false;

    const lang = detectSpeechLang(text);
    const voices = window.speechSynthesis.getVoices();
    const voiceMatch =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(lang.split("-")[0]));

    // Speak sentence-by-sentence instead of one long utterance. On Android, the phone's
    // speaker holding audio focus while an utterance plays blocks the mic from hearing
    // anything at all — SpeechRecognition produces zero results until the utterance ends,
    // so barge-in (and even "para"/"stop") silently did nothing mid-sentence. The brief
    // gap between chunks is a real silence window where the OS actually returns audio
    // focus to the mic, so a real interruption lands there instead of never.
    const chunks = text.slice(0, 2000).match(/[^.!?\n]+[.!?]*(\n|\s|$)/g)?.map((s) => s.trim()).filter(Boolean) || [text];

    const speakChunk = (i) => {
      if (i >= chunks.length || speechInterruptedRef.current) {
        setIsSpeaking(false);
        setTimeout(() => { echoGuardRef.current = false; }, 400);
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunks[i]);
      spokenTextRef.current = chunks[i];
      utter.lang = lang;
      if (voiceMatch) utter.voice = voiceMatch;
      utter.rate = 1;
      utter.pitch = 1;
      utter.onstart = () => { setIsSpeaking(true); echoGuardRef.current = true; };
      utter.onend = () => {
        if (speechInterruptedRef.current) { setIsSpeaking(false); return; }
        setTimeout(() => speakChunk(i + 1), 150);
      };
      utter.onerror = () => { setIsSpeaking(false); setTimeout(() => { echoGuardRef.current = false; }, 400); };
      window.speechSynthesis.speak(utter);
    };
    speakChunk(0);
  }, [autoSpeak]);

  const sendMessage = async (overrideInput) => {
    const msgText = typeof overrideInput === "string" ? overrideInput : input.trim();
    if ((!msgText && !uploadedImage) || isTyping || !selectedChar) return;
    
    const liveFrame = !uploadedImage ? captureVideoFrame() : null;
    const userMsg = {
      role: "user",
      content: msgText,
      id: Date.now(),
      timestamp: Date.now(),
      image: uploadedImage?.data || liveFrame || null,
      imageType: uploadedImage?.type || (liveFrame ? "image/jpeg" : null)
    };
    
    if (typeof overrideInput !== "string") setInput("");
    clearImage();
    setSuggestions([]);
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setIsTyping(true);
    setThinkingPhase("thinking");

    thinkTimerRef.current = setTimeout(() => setThinkingPhase("typing"), 1200 + Math.random() * 800);

    try {
      const history = messagesWithUser
        .slice(-10)
        .map((m) => ({ 
          role: m.role, 
          content: m.content,
          ...(m.image && { image: m.image, imageType: m.imageType })
        }));

      const aiMsgsSoFar = messagesWithUser.filter((m) => m.role === "assistant").length;
      const selfAnalysisDue = aiMsgsSoFar > 0 && aiMsgsSoFar % 8 === 0;
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: selectedChar.systemPrompt,
          personaId: selectedChar.id,
          fileTree: mcGetTree(selectedChar.id),
          selfAnalysisDue,
          voiceMode: liveMicMode,
          charMeta: {
            name: selectedChar.name,
            title: selectedChar.title,
            archetype: selectedChar.archetype,
          },
          messages: history,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to get chat response");
      }

      clearTimeout(thinkTimerRef.current);
      setThinkingPhase(null);

      const text = data?.text || "...";
      const newSuggestions = data?.suggestions || [];
      const fileActionsExecuted = data?.fileActions || [];
      const aiMsgId = Date.now();
      const aiMsg = { role: "assistant", content: text, id: aiMsgId, timestamp: Date.now(), streaming: true };
      const updated = [...messagesWithUser, aiMsg];
      setMessages(updated);
      setStreamingMsgId(aiMsgId);
      setSuggestions(newSuggestions);

      // Apply file actions to localStorage (client-side, no server needed)
      if (fileActionsExecuted.length > 0) {
        for (const fa of fileActionsExecuted) {
          try { mcApplyAction(selectedChar.id, fa); } catch {}
        }
        setFileRefreshKey((k) => k + 1);
      }

      speakAssistant(text);

      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charId: selectedChar.id, messages: updated.map((m) => ({ role: m.role, content: m.content, id: m.id })) }),
      }).catch(() => {});
    } catch (error) {
      clearTimeout(thinkTimerRef.current);
      setThinkingPhase(null);
      const message = error instanceof Error ? error.message : "Failed to get chat response";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `...The connection was severed: ${message}`, id: Date.now(), timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // The live-call SpeechRecognition handler is set up once per call and keeps running
  // across re-renders — calling sendMessage directly from it would freeze that closure at
  // whatever cameraOn/uploadedImage were at call-start, so turning the camera on mid-call
  // would never actually reach the AI. Route through a ref that always points at the
  // current render's sendMessage instead.
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const stopListening = () => {
    intentionalStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setMicLevel(0);
    setIsListening(false);
  };

  // Live call voice loop — the browser's own SpeechRecognition (Web Speech API), continuous
  // + auto-restarted on end. A local Whisper/onnxruntime-web pipeline lived here before to
  // dodge SpeechRecognition's silence-timeout quirk on Android, but the model's memory
  // footprint crashed the whole tab on lower-RAM phones outright — worse than the quirk it
  // was meant to fix. Native recognition ships in Chrome already; restarting it ourselves
  // on "end" is what keeps the call feeling continuous instead of cutting out.
  const startLiveVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.isSecureContext) {
      setVoiceError("Microphone requires HTTPS and a browser with Speech Recognition.");
      return;
    }
    if (recognitionRef.current) return; // already running
    intentionalStopRef.current = false;
    setVoiceError("");

    const STOP_COMMANDS = /\b(stop|para|pará|callate|callá|silencio|basta|enough|quiet)\b/i;
    const normalizeWords = (s) =>
      s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

    // The phone's own speaker bleeding into the mic gets transcribed too — without this,
    // that comes back as "the AI heard itself", canceling its own speech and even getting
    // sent back to it as if the user had said it. If most of a transcript's words are
    // already in what the AI is currently saying, treat it as echo, not real speech.
    const isLikelyEcho = (transcript) => {
      const spoken = spokenTextRef.current;
      if (!spoken) return false;
      const words = normalizeWords(transcript);
      if (!words.length) return false;
      const spokenWords = new Set(normalizeWords(spoken));
      const matches = words.filter((w) => spokenWords.has(w)).length;
      return matches / words.length >= 0.6;
    };

    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // echoGuardRef is read fresh per result (not hoisted once) so that clearing it
      // mid-loop — because the user just barged in — actually unblocks the final
      // transcript of that same interruption instead of still treating it as echo.
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript || transcript.length < 2) continue; // skip stray noise blips

        if (!result.isFinal) {
          // Barge-in: cut the AI off the instant real speech starts, not when it finishes —
          // but only if it's not just the AI's own voice leaking back into the mic.
          if ((window.speechSynthesis?.speaking || echoGuardRef.current) && !isLikelyEcho(transcript)) {
            speechInterruptedRef.current = true;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            echoGuardRef.current = false;
          }
          setMicLevel(0.6); // native API gives no volume signal — just show "hearing you"
          continue;
        }
        setMicLevel(0);

        const confidence = result[0]?.confidence ?? 1;
        if (confidence < 0.6) continue; // tighter threshold — keyboard clicks/noise score low

        if (echoGuardRef.current || isLikelyEcho(transcript)) {
          if (STOP_COMMANDS.test(transcript)) {
            speechInterruptedRef.current = true;
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            echoGuardRef.current = false;
          }
          continue;
        }

        const words = transcript.split(/\s+/).filter(Boolean);
        if (STOP_COMMANDS.test(transcript) && words.length <= 3) continue; // already interrupted above
        const now = Date.now();
        if (now - lastVoiceSendRef.current < 700) continue; // guard against a double-fire
        lastVoiceSendRef.current = now;
        sendMessageRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError(
          "Microphone permission blocked. On Android Chrome: tap the lock icon in the address bar > Permissions > Microphone > Allow, then reload the page. If the app is installed to your home screen, check Android Settings > Apps > this app > Permissions > Microphone too."
        );
        intentionalStopRef.current = true;
      }
      // "aborted" / "no-speech" / "audio-capture" etc. are recoverable — onend restarts it.
    };

    recognition.onend = () => {
      if (intentionalStopRef.current) {
        recognitionRef.current = null;
        setIsListening(false);
        setMicLevel(0);
        return;
      }
      // Chrome stops recognition after a silence/noise window — restart to keep the call
      // "live". A brief delay first: calling start() in the same tick as end() is what used
      // to make noisy input cut the mic in and out every couple seconds — some engines throw
      // (or immediately re-end) when restarted before they've fully torn down.
      setTimeout(() => {
        if (intentionalStopRef.current || recognitionRef.current !== recognition) return;
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setIsListening(false);
        }
      }, 250);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    if (isTyping && !liveMicMode) {
      setVoiceError("Wait for the current answer before using live mic.");
      return;
    }

    if (liveMicMode) {
      startLiveVoice();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.isSecureContext) {
      setVoiceError("Microphone requires HTTPS and a browser with Speech Recognition.");
      return;
    }

    let finalBuffer = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const STOP_COMMANDS = /\b(stop|para|pará|callate|callá|silencio|basta|enough|quiet)\b/i;

    recognition.onresult = (event) => {
      let interim = "";
      const aiSpeaking = echoGuardRef.current; // use ref — catches echo that arrives after speech ends
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i]?.[0]?.transcript?.trim();
        if (!transcript) continue;
        if (event.results[i].isFinal) {
          const confidence = event.results[i]?.[0]?.confidence ?? 1;
          if (confidence < 0.6) continue; // tighter threshold — keyboard clicks score low

          // While AI is speaking, only react to stop commands — ignore the rest (echo suppression)
          if (aiSpeaking) {
            if (STOP_COMMANDS.test(transcript)) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }
            continue;
          }

          finalBuffer = `${finalBuffer} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }
      const composed = `${finalBuffer} ${interim}`.trim();
      if (composed) setInput(composed);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError(
          "Mic permission blocked. On Android Chrome: tap the lock icon in the address bar > Permissions > Microphone > Allow, then reload the page."
        );
      } else if (event.error !== "no-speech") {
        setVoiceError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      const trimmed = finalBuffer.trim();
      if (trimmed) setInput(trimmed);
    };

    setVoiceError("");
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const isLiveCallUI = liveMicMode;

  // Live camera — self-view + face-api.js expression detection mirrored onto the avatar
  const stopVideoCall = useCallback(() => {
    if (faceDetectIntervalRef.current) {
      clearInterval(faceDetectIntervalRef.current);
      faceDetectIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setDetectedExpression(null);
    setFaceApiStatus("idle");
  }, []);

  const startVideoCall = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Camera requires HTTPS and a browser with camera support.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraStreamRef.current = stream;
      setCameraOn(true);
      setVoiceError("");
    } catch (err) {
      setVoiceError(
        err?.name === "NotAllowedError"
          ? "Camera permission blocked. On Android Chrome: tap the lock icon in the address bar > Permissions > Camera > Allow, then reload the page."
          : "Camera access was blocked or unavailable."
      );
      stopVideoCall();
      return;
    }

    // Face-expression detection is a best-effort extra on top of the camera view —
    // a failed/slow CDN load here must never tear down the camera stream above.
    try {
      setFaceApiStatus("loading");
      if (!faceapiRef.current) {
        faceapiRef.current = await import("face-api.js");
        const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        await Promise.all([
          faceapiRef.current.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapiRef.current.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
      }
      const faceapi = faceapiRef.current;
      setFaceApiStatus("ready");

      faceDetectIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceExpressions();
          const top = result?.expressions && Object.entries(result.expressions).sort((a, b) => b[1] - a[1])[0];
          setDetectedExpression(top && top[1] > 0.45 ? top[0] : null);
        } catch {
          // transient detection failure — skip this tick
        }
      }, 600);
    } catch {
      // Expression detection unavailable — camera view stays on regardless.
      setFaceApiStatus("error");
    }
  }, [stopVideoCall]);

  const toggleVideoCall = () => {
    if (cameraOn) stopVideoCall();
    else startVideoCall();
  };

  // Grabs the current webcam frame so the AI can actually "see" what's happening
  // during a live call — sent alongside the next message, same path as an uploaded image.
  const captureVideoFrame = useCallback(() => {
    if (!cameraOn || !videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch {
      return null;
    }
  }, [cameraOn]);

  // The <video> element only mounts once cameraOn is true, so the stream
  // must be attached here (after mount) rather than inside startVideoCall.
  useEffect(() => {
    if (cameraOn && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  useEffect(() => {
    if (!liveMicMode && cameraOn) stopVideoCall();
  }, [liveMicMode, cameraOn, stopVideoCall]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      stopVideoCall();
    };
  }, [stopVideoCall]);

  // Image upload functions

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage({ type: "upload", data: event.target.result, filename: file.name });
    };
    reader.onerror = () => {};
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!liveMicMode) return;
    setAutoSpeak(true);
  }, [liveMicMode]);

  // Switching characters mid-call: stop the previous character's mic/speech
  useEffect(() => {
    stopListening();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [selectedChar?.id]);

  useEffect(() => {
    if (autoSpeak) return;
    stopSpeaking();
  }, [autoSpeak, stopSpeaking]);

  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, []);

  const char = selectedChar;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:var(--sys-bg);font-family:'Inter',sans-serif;overflow:auto;min-height:100vh;min-height:100dvh;color:var(--sys-text);}
        @keyframes p3pulse{0%,100%{opacity:.45;transform:scale(.86);}50%{opacity:1;transform:scale(1);}}
        @keyframes p3up{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes p3in{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}
        @keyframes p3cw{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes p3ccw{from{transform:rotate(0deg);}to{transform:rotate(-360deg);}}
        @keyframes p3glow{0%,100%{filter:drop-shadow(0 0 18px rgba(73,176,255,.25));}50%{filter:drop-shadow(0 0 36px rgba(73,176,255,.45));}}
        @keyframes p3flicker{0%,100%{opacity:1;}50%{opacity:.75;}}
        @keyframes p3enter{from{opacity:0;transform:translateY(8px) scale(.985);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes p3spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes cymw0{from{height:4px}to{height:22px}}
        @keyframes cymw1{from{height:7px}to{height:17px}}
        @keyframes cymw2{from{height:3px}to{height:26px}}
        @keyframes cymw3{from{height:10px}to{height:14px}}

  .p3app{width:100vw;height:100vh;height:100dvh;background:radial-gradient(140% 100% at 75% 0%,var(--sys-bg-flare) 0%,rgba(0,0,0,0) 55%),var(--sys-bg);position:relative;overflow:hidden;}
        .p3grid{position:fixed;inset:0;background-image:linear-gradient(var(--sys-grid) 1px,transparent 1px),linear-gradient(90deg,var(--sys-grid) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;opacity:.22;}
        .p3moon-wrap{position:fixed;top:-110px;right:-120px;width:380px;height:380px;pointer-events:none;transition:opacity .9s ease;}
        .p3moon{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 30% 30%,#b5ebff,#2f5fa8 58%,#0d2145);animation:p3glow 5s ease-in-out infinite;opacity:.55;}
        .p3ring1{position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(125,187,255,.2);animation:p3cw 22s linear infinite;}
        .p3ring2{position:absolute;inset:-34px;border-radius:50%;border:1px solid rgba(125,187,255,.13);animation:p3ccw 30s linear infinite;}
        .p3tl,.p3br{display:none;}
        .p3wm{position:fixed;bottom:20px;left:22px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:2px;pointer-events:none;z-index:5;text-transform:uppercase;}
        .p3sys{position:fixed;top:calc(16px + env(safe-area-inset-top));left:18px;z-index:50;display:flex;align-items:center;gap:10px;background:var(--sys-panel);border:1px solid var(--sys-line);border-radius:999px;padding:8px 12px;backdrop-filter:blur(12px);box-shadow:0 10px 22px rgba(0,0,0,.22);}
        .p3time{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--sys-text);letter-spacing:.4px;padding-right:8px;border-right:1px solid var(--sys-line);}
        .p3chip{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);padding:6px 11px;border-radius:999px;border:1px solid var(--sys-line);background:var(--sys-panel-soft);text-transform:uppercase;letter-spacing:.8px;}
        .p3chip.active{color:var(--sys-text);border-color:var(--sys-accent);background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));}

  .p3sel{display:flex;flex-direction:column;align-items:center;height:100vh;height:100dvh;padding:30px 26px 82px;position:relative;z-index:10;animation:p3up .6s ease forwards;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;-webkit-overflow-scrolling:touch;touch-action:pan-y;}
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

  .p3cr{display:flex;flex-direction:column;height:100vh;height:100dvh;position:relative;z-index:10;animation:p3up .5s ease forwards;overflow:hidden;}
        .p3crh{padding:0 24px;height:70px;display:flex;align-items:center;gap:16px;background:var(--sys-panel);border-bottom:1px solid var(--sys-line);flex-shrink:0;backdrop-filter:blur(14px);border-radius:0 0 24px 24px;}
        .p3crhtitle{font-family:'Orbitron',sans-serif;font-size:18px;color:#eef7ff;letter-spacing:1.5px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .p3crb{flex:1;overflow-y:auto;padding:24px 24px 120px;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;}
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

        .p3form-preview{height:320px;background:linear-gradient(170deg,var(--sys-panel-soft),var(--sys-panel));border:1px solid var(--sys-line);border-radius:26px;overflow:hidden;position:relative;margin-bottom:18px;}
        .p3form-preview::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,var(--sys-bg-flare),transparent 70%);pointer-events:none;z-index:0;}
        .p3form-preview-title{position:absolute;top:12px;left:14px;right:14px;z-index:2;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.8px;color:var(--sys-muted);text-transform:uppercase;text-align:center;}
        .p3form-preview-body{position:absolute;inset:0;z-index:1;}

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

        .p3crf{position:sticky;bottom:0;z-index:20;padding:16px 24px;background:var(--sys-panel);border-top:1px solid var(--sys-line);display:flex;gap:12px;flex-shrink:0;backdrop-filter:blur(14px);}
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

        .p3chat{display:flex;flex-direction:column;height:100vh;height:100dvh;position:fixed;z-index:10;animation:p3up .5s ease forwards;will-change:transform;pointer-events:auto;overflow:hidden;}
        .p3chat.live-call{inset:0;transform:none !important;}
        .p3chat.dragging{user-select:none;}
        .p3ch{padding:0 24px;height:76px;display:flex;align-items:center;gap:16px;background:var(--sys-panel);border-bottom:1px solid var(--sys-line);position:relative;backdrop-filter:blur(14px);flex-shrink:0;border-radius:0 0 24px 24px;cursor:grab;user-select:none;touch-action:none;}
        .p3ch::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cc),transparent);opacity:.6;}
        .p3back{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;padding:8px 14px;cursor:pointer;transition:all .2s;border-radius:999px;text-transform:uppercase;}
        .p3back:hover{border-color:#8bd8ff;color:#dff5ff;background:rgba(16,37,73,.9);}
        .p3chav{font-size:36px;filter:drop-shadow(0 0 6px rgba(125,187,255,.25));}
        .p3chin{display:flex;flex-direction:column;justify-content:center;gap:2px;flex:1;}
        .p3chnm{font-family:'Orbitron',sans-serif;font-size:16px;color:var(--sys-text);letter-spacing:.4px;font-weight:700;line-height:1;}
        .p3chtt{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--sys-muted);letter-spacing:.6px;text-transform:uppercase;line-height:1;}
        .p3chac{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;color:var(--cc);text-transform:uppercase;line-height:1.3;}
        .p3chat-body{display:flex;flex:1;overflow:hidden;min-height:0;}
        .p3chat.live-call .p3chat-body{display:flex;flex:1;min-height:0;overflow:hidden;}
        .p3chat.live-call .p3avatar-panel{display:none;}
        .p3avatar-panel{width:480px;flex-shrink:0;background:var(--sys-panel);border-right:1px solid var(--sys-line);position:relative;overflow:hidden;display:flex;flex-direction:column;}
        .p3avatar-panel::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,var(--sys-bg-flare),transparent 70%);pointer-events:none;z-index:1;}
        .p3avatar-header{height:60px;display:flex;align-items:center;justify-content:center;padding:0 12px;background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));border-bottom:1px solid var(--sys-line);cursor:grab;user-select:none;touch-action:none;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--sys-muted);letter-spacing:1.2px;text-transform:uppercase;text-align:center;flex-shrink:0;z-index:2;}
        .p3avatar-header:active{cursor:grabbing;}
        .p3avatar-content{flex:1;position:relative;overflow:hidden;z-index:1;display:flex;flex-direction:column;min-height:0;}
        .p3chat-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;min-height:0;}
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
        .p3msgs{flex:1;overflow-y:auto;padding:24px 24px 16px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;min-height:0;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;}
        .p3msgs::-webkit-scrollbar{width:6px;}
        .p3msgs::-webkit-scrollbar-thumb{background:rgba(111,173,255,.35);border-radius:12px;}
        .p3mr{display:flex;gap:12px;animation:p3in .24s ease forwards;max-width:90%;}
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
        .p3voice-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
        .p3chat.live-call .p3voice-row{justify-content:center;gap:10px;margin-bottom:12px;}
        .p3mic-btn{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.1px;padding:8px 12px;border-radius:999px;cursor:pointer;text-transform:uppercase;transition:all .2s;}
        .p3chat.live-call .p3mic-btn{font-size:12px;padding:12px 18px;border-width:2px;}
        .p3mic-btn:hover:not(:disabled){border-color:var(--cc);box-shadow:0 0 12px var(--cg);}
        .p3mic-btn.live{border-color:#f25f6f;color:#ffd0d6;animation:p3flicker 1.1s ease-in-out infinite;}
        .p3mic-btn:disabled{opacity:.45;cursor:not-allowed;}
        .p3voice-chip{background:transparent;border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;padding:7px 10px;border-radius:999px;cursor:pointer;text-transform:uppercase;transition:all .2s;}
        .p3chat.live-call .p3voice-chip{font-size:10px;padding:9px 12px;}
        .p3voice-chip.active{border-color:var(--cc);color:var(--cc);background:var(--sys-accent-soft);}
        .p3voice-chip:disabled{opacity:.45;cursor:not-allowed;}
        .p3voice-hint{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--sys-muted);letter-spacing:.5px;opacity:.9;}
        .p3chat.live-call .p3voice-hint{text-align:center;width:100%;font-size:10px;max-width:760px;}
        .p3voice-error{font-family:'JetBrains Mono',monospace;font-size:10px;color:#ff9faa;letter-spacing:.4px;margin-bottom:8px;}
        .p3voice-status{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--sys-muted);letter-spacing:.4px;margin-bottom:8px;}
        .p3inpw{display:flex;gap:10px;align-items:flex-end;}
        .p3ta{flex:1;background:var(--sys-panel);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'Inter',sans-serif;font-size:14px;padding:12px 15px;outline:none;resize:none;transition:border-color .2s,box-shadow .2s;border-radius:20px;min-height:48px;max-height:130px;}
        .p3ta:focus{border-color:var(--cc);box-shadow:0 0 0 3px var(--cg),inset 0 0 14px rgba(17,45,89,.36);}
        .p3ta::placeholder{color:rgba(175,219,255,.45);}
        .p3send{background:linear-gradient(145deg,var(--sys-accent-soft),rgba(255,255,255,.08));border:1px solid var(--sys-accent);color:var(--sys-text);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.4px;padding:13px 20px;cursor:pointer;transition:all .2s;border-radius:999px;white-space:nowrap;text-transform:uppercase;}
        .p3send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 20px rgba(36,95,191,.32),0 0 0 1px rgba(127,216,255,.6);}
        .p3send:disabled{opacity:.4;cursor:not-allowed;}
        .p3clrhist{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.2px;padding:4px 10px;border:1px solid rgba(242,95,111,.45);background:transparent;color:rgba(242,95,111,.8);cursor:pointer;border-radius:999px;transition:all .15s;text-transform:uppercase;}
        .p3clrhist:hover{background:rgba(242,95,111,.15);border-color:#f25f6f;color:#f25f6f;}

        .p3cust-toggle{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(5,12,30,.82);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.6px;padding:6px 14px;cursor:pointer;border-radius:999px;text-transform:uppercase;transition:all .2s;backdrop-filter:blur(8px);white-space:nowrap;}
        .p3cust-toggle:hover,.p3cust-toggle.open{border-color:var(--cc);color:var(--cc);box-shadow:0 0 12px var(--cg);}
        .p3cust-panel{position:absolute;bottom:0;left:0;right:0;z-index:9;background:linear-gradient(0deg,rgba(4,10,26,.97) 0%,rgba(7,16,38,.93) 100%);border-top:1px solid var(--sys-line);padding:14px 14px 14px;backdrop-filter:blur(14px);overflow-y:auto;max-height:72%;animation:p3up .22s ease;box-sizing:border-box;}
        .p3cust-section{margin-bottom:13px;}
        .p3cust-section:last-child{margin-bottom:0;}
        .p3cust-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--sys-accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:7px;}
        .p3cust-swatches{display:flex;gap:7px;flex-wrap:wrap;align-items:center;}
        .p3cust-swatch{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .15s;flex-shrink:0;}
        .p3cust-swatch.active{border-color:#fff;transform:scale(1.2);box-shadow:0 0 8px rgba(255,255,255,.4);}
        .p3cust-swatch:hover:not(.active){transform:scale(1.12);}
        .p3cust-pills{display:flex;gap:6px;flex-wrap:wrap;}
        .p3cust-pill{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;padding:5px 11px;cursor:pointer;border-radius:999px;text-transform:uppercase;transition:all .15s;}
        .p3cust-pill.active{border-color:var(--cc);color:var(--cc);background:rgba(255,255,255,.06);box-shadow:0 0 8px var(--cg);}
        .p3cust-pill:hover:not(.active){border-color:rgba(180,220,255,.4);color:var(--sys-text);}
        .p3cust-colorrow{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
        .p3cust-cdot{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .15s;flex-shrink:0;}
        .p3cust-cdot.active{border-color:#fff;transform:scale(1.2);}
        .p3cust-cdot:hover:not(.active){transform:scale(1.1);}
        .p3cust-ci{width:26px;height:22px;padding:0;border:1px solid var(--sys-line);background:var(--sys-panel-soft);cursor:pointer;border-radius:6px;}
        .p3cust-divider{height:1px;background:var(--sys-line-soft);margin:10px 0;}

        /* FileExplorer Modal */
        .p3file-modal{position:fixed;inset:0;background:rgba(2,6,14,.74);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:p3up .3s ease forwards;}
        .p3file-modal-content{background:linear-gradient(170deg,rgba(14,29,61,.96),rgba(10,21,42,.97));border:1px solid var(--sys-line);padding:0;border-radius:24px;max-width:580px;width:90%;max-height:80vh;box-shadow:0 22px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;overflow:hidden;}
        .p3file-modal-header{padding:20px 24px;background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));border-bottom:1px solid var(--sys-line);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;}
        .p3file-modal-title{font-family:'Orbitron',sans-serif;font-size:14px;color:var(--sys-text);letter-spacing:1.2px;text-transform:uppercase;}
        .p3file-modal-close{background:none;border:none;color:var(--sys-muted);cursor:pointer;font-size:18px;padding:4px 8px;transition:color .2s;}
        .p3file-modal-close:hover{color:var(--sys-text);}
        .p3file-modal-body{flex:1;overflow-y:auto;padding:20px;scrollbar-width:thin;scrollbar-color:rgba(111,173,255,.35) transparent;}
        .p3file-modal-body::-webkit-scrollbar{width:6px;}
        .p3file-modal-body::-webkit-scrollbar-thumb{background:rgba(111,173,255,.35);border-radius:12px;}
        .p3file-toggle{position:fixed;bottom:calc(104px + env(safe-area-inset-bottom));right:18px;background:rgba(5,12,30,.82);border:1px solid var(--sys-line);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.6px;padding:8px 16px;cursor:pointer;border-radius:999px;text-transform:uppercase;transition:all .2s;backdrop-filter:blur(8px);white-space:nowrap;z-index:30;}
        .p3file-toggle:hover,.p3file-toggle.active{border-color:var(--cc);color:var(--cc);box-shadow:0 0 12px var(--cg);}



        .p3msg-content{display:flex;flex-direction:column;gap:4px;max-width:100%;min-width:0;}
        .p3timestamp{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(180,210,255,.35);letter-spacing:.3px;padding:0 8px;}
        .p3timestamp.user{text-align:right;}
        .p3timestamp.assistant{text-align:left;}
        .p3quick-replies{display:flex;gap:8px;padding:4px 24px 8px;flex-wrap:wrap;animation:p3up .3s ease forwards;flex-shrink:0;}
        .p3qr-btn{background:var(--sys-panel-soft);border:1px solid var(--sys-line);color:var(--sys-text);font-family:'Inter',sans-serif;font-size:13px;padding:10px 18px;cursor:pointer;transition:all .2s;border-radius:999px;white-space:nowrap;}
        .p3qr-btn:hover{border-color:var(--cc);background:var(--sys-accent-soft);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.2);}
        .p3thinking{display:flex;align-items:center;padding:12px 16px;gap:2px;}
        .p3think-text{font-family:'Inter',sans-serif;font-size:13px;color:var(--sys-muted);font-style:italic;}
        .p3think-dots{font-family:'Inter',sans-serif;font-size:13px;color:var(--sys-muted);animation:p3flicker 1.5s ease infinite;}

        /* Full-screen call takeover — avatar fills the viewport, floating round
           controls dock at the bottom, replika-style rather than a boxed panel. */
        .p3call-full{position:fixed;inset:0;z-index:400;display:flex;flex-direction:column;background:#05070c;}
        .p3call-stage{position:relative;flex:1;min-height:0;overflow:hidden;background:radial-gradient(ellipse at 50% 28%,var(--cc,#4a8fc0)22,transparent 62%),linear-gradient(180deg,#0a0f1c 0%,#05070c 72%);}
        .p3call-topbar{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(14px + env(safe-area-inset-top)) 16px 10px;}
        .p3call-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(8,14,26,.6);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);color:#eaf4ff;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;padding:8px 14px;border-radius:999px;}
        .p3call-pill .dot{width:6px;height:6px;border-radius:50%;background:#5eead4;box-shadow:0 0 8px #5eead4;flex-shrink:0;}
        .p3call-error{position:absolute;top:calc(64px + env(safe-area-inset-top));left:16px;right:16px;z-index:6;background:rgba(40,10,14,.75);border:1px solid rgba(242,95,111,.6);backdrop-filter:blur(10px);color:#ffd0d6;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.4;letter-spacing:.3px;padding:10px 14px;border-radius:14px;text-align:center;}
        .p3call-status{position:absolute;top:calc(64px + env(safe-area-inset-top));left:16px;right:16px;z-index:6;background:var(--sys-panel);border:1px solid var(--sys-line);backdrop-filter:blur(10px);color:var(--sys-muted);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.4;letter-spacing:.3px;padding:10px 14px;border-radius:14px;text-align:center;}
        .p3call-transcript-toggle{background:rgba(8,14,26,.6);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);color:#eaf4ff;width:34px;height:34px;border-radius:50%;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .p3cam-pip{position:absolute;top:calc(64px + env(safe-area-inset-top));right:16px;width:88px;height:120px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.25);box-shadow:0 8px 20px rgba(0,0,0,.5);z-index:6;background:#000;}
        .p3cam-video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:block;}
        .p3cam-tag{position:absolute;left:0;right:0;bottom:0;background:rgba(2,6,14,.72);color:var(--cc,#4a8fc0);font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.6px;text-align:center;padding:2px 0;text-transform:uppercase;}
        .p3call-caption-wrap{position:absolute;left:16px;right:16px;bottom:16px;z-index:5;display:flex;justify-content:center;pointer-events:none;}
        .p3call-caption{max-width:88%;font-family:'Inter',sans-serif;font-size:14px;line-height:1.45;padding:11px 16px;border-radius:20px;box-shadow:0 10px 26px rgba(0,0,0,.4);animation:p3up .25s ease forwards;}
        .p3call-caption.assistant{background:rgba(255,255,255,.96);color:#141821;border-bottom-left-radius:6px;}
        .p3call-caption.user{background:var(--cc,#4a8fc0);color:#fff;border-bottom-right-radius:6px;margin-left:auto;}
        .p3call-dock{position:relative;z-index:6;display:flex;align-items:center;justify-content:center;gap:16px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(0deg,rgba(5,7,12,.95),rgba(5,7,12,.55));flex-wrap:wrap;}
        .p3call-round{width:54px;height:54px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);backdrop-filter:blur(8px);color:#eaf4ff;font-size:19px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s ease;flex-shrink:0;}
        .p3call-round:hover{background:rgba(255,255,255,.16);}
        .p3call-round.active{background:var(--cc,#4a8fc0);border-color:var(--cc,#4a8fc0);color:#06101c;}
        .p3call-round.end{background:#e5484d;border-color:#e5484d;color:#fff;}
        .p3call-round.end:hover{background:#ff5b60;}
        .p3call-round:disabled{opacity:.4;cursor:not-allowed;}
        .p3call-transcript{position:absolute;inset:0;z-index:8;background:rgba(4,7,14,.88);backdrop-filter:blur(6px);display:flex;flex-direction:column;}
        .p3call-transcript-head{display:flex;align-items:center;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top)) 18px 10px;border-bottom:1px solid var(--sys-line-soft);}
        .p3call-transcript-head span{font-family:'Orbitron',sans-serif;font-size:13px;color:var(--sys-text);letter-spacing:1px;}
        .p3call-msgs{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch;touch-action:pan-y;min-height:0;}
        .p3call-msgs::-webkit-scrollbar{width:4px;}
        .p3call-msgs::-webkit-scrollbar-thumb{background:rgba(111,173,255,.25);border-radius:12px;}

        .p3chat.live-call .p3inp{border-radius:26px 26px 0 0;}
        .p3chat.live-call .p3ta{min-height:52px;}

        @media (max-width: 760px) {
          .p3chat { position: relative; inset: 0; transform: none !important; width: 100vw; min-height: 100dvh; }
          .p3ch, .p3avatar-header { cursor: default; touch-action: manipulation; }
          .p3chat:not(.live-call) .p3chat-body { flex-direction: column; }
          .p3avatar-panel { width: 100%; height: 34vh; min-height: 200px; max-height: 280px; flex-shrink: 0; border-right: none; border-bottom: 1px solid var(--sys-line); }
          .p3avatar-header { height: 32px; font-size: 8px; }
          .p3fg { grid-template-columns: 1fr; }
          .p3chac { display: none; }
          .p3srch-row { flex-direction: column; }
          .p3grid2 { grid-template-columns: repeat(auto-fill,minmax(170px,1fr)); gap: 12px; }
          .p3sys { top: calc(12px + env(safe-area-inset-top)); left: 14px; right: 14px; justify-content: space-between; padding: 8px 10px; gap: 6px; }
          .p3chip { padding: 6px 8px; font-size: 9px; }
          .p3ch,
          .p3stat,
          .p3msgs,
          .p3inp,
          .p3crh,
          .p3crb,
          .p3crf,
          .p3sel { padding-left: 14px; padding-right: 14px; }
          .p3form-preview { height: 240px; }
          .p3file-toggle { right: 12px; bottom: calc(118px + env(safe-area-inset-bottom)); }
          .p3main { font-size: 32px; letter-spacing: 3px; }
          .p3sub { letter-spacing: 3px; }
          .p3voice-hint { width: 100%; }
          .p3call-round{width:50px;height:50px;font-size:17px;}
          .p3call-dock{gap:12px;}
          .p3cam-pip{width:64px;height:88px;top:calc(56px + env(safe-area-inset-top));right:10px;}
        }
      `}</style>

      <div
        className="p3app theme-aurora"
        style={{
          "--cc": char?.color || "#4a8fc0",
          "--cg": char?.color ? char.color + "66" : "rgba(74,143,192,0.4)",
          ...AURORA_THEME_VARS,
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
        {!isLiveCallUI && <div className="p3wm">ORBITAL FREEBASE // SOCIAL LINK OS</div>}
        {!isLiveCallUI && <InstallQR color={char?.color || "#4a8fc0"} />}

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

              <div className="p3form-preview">
                <div className="p3form-preview-title">[ LIVE 3D CHARACTER PREVIEW ]</div>
                <div className="p3form-preview-body">
                  <Avatar3D
                    color={form.color}
                    state={isSearching ? "thinking" : "idle"}
                    customization={form.customization || {}}
                  />
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
          <div 
            className={`p3chat${isDraggingChat ? " dragging" : ""}${isLiveCallUI ? " live-call" : ""}`}
            ref={chatRef}
            style={{
              transform: isCoarsePointer ? "none" : `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
              cursor: isCoarsePointer ? "default" : isDraggingChat ? "grabbing" : "default",
            }}
          >
            <div 
              className="p3ch"
              ref={chatHeaderRef}
              onPointerDown={handleChatHeaderPointerDown}
              style={{ cursor: isCoarsePointer ? "default" : isDraggingChat ? "grabbing" : "grab" }}
            >
              <button
                className="p3back"
                onClick={() => {
                  setPhase("select");
                  setSelectedChar(null);
                  setMessages([]);
                  setSuggestions([]);
                  setStreamingMsgId(null);
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
            <div className="p3chat-body">
              {/* 3D Avatar Panel */}
              <div className="p3avatar-panel">
                <div 
                  className="p3avatar-header"
                  ref={avatarHeaderRef}
                  onPointerDown={handleAvatarHeaderPointerDown}
                  title="Drag to move window"
                >
                  ◆◆ AVATAR ◆◆
                </div>
                <div className="p3avatar-content">
                  <Avatar3D
                    color={char.color}
                    state={isListening ? "thinking" : thinkingPhase === "thinking" ? "thinking" : streamingMsgId ? "streaming" : "idle"}
                    customization={char.customization || {}}
                    micLevel={micLevel}
                    expression={detectedExpression}
                  />
                  {/* Cymatics waveform — animates when AI speaks or types */}
                  <div style={{ position: "absolute", bottom: showCustomizer ? "52px" : "46px", left: 0, right: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", pointerEvents: "none" }}>
                    <CymaticsBar active={isSpeaking || !!streamingMsgId} color={char.color} />
                    {(isSpeaking || !!streamingMsgId) && (
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", letterSpacing: "2px", color: char.color, opacity: 0.7, textTransform: "uppercase" }}>
                        {isSpeaking ? "SPEAKING" : "COMPUTING"}
                      </div>
                    )}
                  </div>
                  <button
                    className={`p3cust-toggle${showCustomizer ? " open" : ""}`}
                    onClick={() => setShowCustomizer((p) => !p)}
                  >
                    {showCustomizer ? "✕ CLOSE" : "◐ CUSTOMIZE"}
                  </button>
                  {showCustomizer && (() => {
                    const cust = char.customization || {};
                    const SKIN_SWATCHES = [
                      { key: "fair",   hex: "#f5d5b8" },
                      { key: "light",  hex: "#e8c4a8" },
                      { key: "medium", hex: "#c8966e" },
                      { key: "tan",    hex: "#a8784e" },
                      { key: "dark",   hex: "#6b3e2e" },
                      { key: "deep",   hex: "#3c2016" },
                    ];
                    const HAIR_PRESETS = ["#1a1008", "#3b2010", "#7a4a20", "#c08040", "#e8d090", "#f0f0e8", "#d04040", "#404080"];
                    const EYE_PRESETS  = ["#4a8fc0", "#3a9a60", "#8060a0", "#c07030", "#404050", "#60a8c0", "#a05030", "#50a080"];
                    const CLOTH_PRESETS= ["#1a1a2e", "#0d2137", "#1e3a1e", "#2e1a0e", "#2a1a2a", "#1a2a1a", "#3a2010", "#101828"];
                    return (
                      <div className="p3cust-panel">

                      <div className="p3cust-section">
                        <div className="p3cust-lbl">Skin Tone</div>
                        <div className="p3cust-swatches">
                          {SKIN_SWATCHES.map(({ key, hex }) => (
                            <div
                              key={key}
                              className={`p3cust-swatch${(cust.skinTone || "light") === key ? " active" : ""}`}
                              style={{ background: hex }}
                              title={key}
                              onClick={() => updateCustomization({ skinTone: key, skinColor: undefined })}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p3cust-divider" />

                      <div className="p3cust-section">
                        <div className="p3cust-lbl">Hair Style</div>
                        <div className="p3cust-pills">
                          {["short", "medium", "long", "wavy"].map((s) => (
                            <button
                              key={s}
                              className={`p3cust-pill${(cust.hairStyle || "medium") === s ? " active" : ""}`}
                              onClick={() => updateCustomization({ hairStyle: s })}
                            >{s}</button>
                          ))}
                        </div>
                      </div>

                      <div className="p3cust-section">
                        <div className="p3cust-lbl">Hair Color</div>
                        <div className="p3cust-colorrow">
                          {HAIR_PRESETS.map((hex) => (
                            <div
                              key={hex}
                              className={`p3cust-cdot${cust.hairColor === hex ? " active" : ""}`}
                              style={{ background: hex, border: "2px solid rgba(255,255,255,.15)" }}
                              onClick={() => updateCustomization({ hairColor: hex })}
                            />
                          ))}
                          <input type="color" className="p3cust-ci"
                            value={cust.hairColor || "#3b2010"}
                            onChange={(e) => updateCustomization({ hairColor: e.target.value })}
                            title="Custom hair color"
                          />
                        </div>
                      </div>

                      <div className="p3cust-divider" />

                      <div className="p3cust-section">
                        <div className="p3cust-lbl">Eye Color</div>
                        <div className="p3cust-colorrow">
                          {EYE_PRESETS.map((hex) => (
                            <div
                              key={hex}
                              className={`p3cust-cdot${cust.eyeColor === hex ? " active" : ""}`}
                              style={{ background: hex }}
                              onClick={() => updateCustomization({ eyeColor: hex })}
                            />
                          ))}
                          <input type="color" className="p3cust-ci"
                            value={cust.eyeColor || char.color}
                            onChange={(e) => updateCustomization({ eyeColor: e.target.value })}
                            title="Custom eye color"
                          />
                        </div>
                      </div>

                      <div className="p3cust-divider" />

                      <div className="p3cust-section">
                        <div className="p3cust-lbl">Outfit</div>
                        <div className="p3cust-pills" style={{ marginBottom: 8 }}>
                          {["shirt", "jacket", "turtleneck"].map((s) => (
                            <button
                              key={s}
                              className={`p3cust-pill${(cust.clothingStyle || "shirt") === s ? " active" : ""}`}
                              onClick={() => updateCustomization({ clothingStyle: s })}
                            >{s}</button>
                          ))}
                        </div>
                        <div className="p3cust-colorrow">
                          {CLOTH_PRESETS.map((hex) => (
                            <div
                              key={hex}
                              className={`p3cust-cdot${cust.clothingColor === hex ? " active" : ""}`}
                              style={{ background: hex, border: "2px solid rgba(255,255,255,.12)" }}
                              onClick={() => updateCustomization({ clothingColor: hex })}
                            />
                          ))}
                          <input type="color" className="p3cust-ci"
                            value={cust.clothingColor || "#1a1a2e"}
                            onChange={(e) => updateCustomization({ clothingColor: e.target.value })}
                            title="Custom clothing color"
                          />
                        </div>
                      </div>


                    </div>
                  );
                })()}
                </div>
              </div>
              {/* Chat Panel */}
              <div className={`p3chat-main${isLiveCallUI ? " live-call" : ""}`}>
                {!isLiveCallUI && (
                  <>
                    <div className="p3stat">
                      <div className="p3dot" />
                      <div className="p3stxt">FREEBASE LINK — CONNECTION ACTIVE</div>
                      <button className="p3clrhist" style={{ marginLeft: "auto" }} onClick={clearHistory} title="Clear saved history for this character">
                        CLEAR HISTORY
                      </button>
                      <div className="p3stime">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="p3msgs" ref={messagesContainerRef}>
                      {messages.map((msg) => (
                        <div key={msg.id} className={`p3mr ${msg.role}`}>
                          {msg.role === "assistant" ? <div className="p3mav">{char.avatar}</div> : <div className="p3uav">You</div>}
                          <div className="p3msg-content">
                            {msg.image && (
                              <div style={{
                                marginBottom: "8px",
                                maxWidth: "280px",
                                borderRadius: "16px",
                                overflow: "hidden",
                                border: "1px solid var(--sys-line)",
                                boxShadow: "0 4px 12px rgba(0,0,0,.3)"
                              }}>
                                <img 
                                  src={msg.image} 
                                  alt="Message content" 
                                  style={{width: "100%", display: "block", objectFit: "cover"}}
                                />
                              </div>
                            )}
                            <div className={`p3bub ${msg.role}`}>
                              {msg.role === "assistant" && msg.streaming && msg.id === streamingMsgId ? (
                                <StreamingText text={msg.content} onComplete={() => handleStreamComplete(msg.id)} />
                              ) : (
                                msg.content
                              )}
                            </div>
                            {msg.timestamp && (
                              <div className={`p3timestamp ${msg.role}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(isTyping || thinkingPhase) && (
                        <div className="p3mr assistant">
                          <div className="p3mav">{char.avatar}</div>
                          <div className="p3tyb">
                            {thinkingPhase === "thinking" ? (
                              <div className="p3thinking">
                                <span className="p3think-text">thinking</span>
                                <span className="p3think-dots">...</span>
                              </div>
                            ) : (
                              <TypingIndicator color={char.color} />
                            )}
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {suggestions.length > 0 && !isTyping && !streamingMsgId && (
                      <div className="p3quick-replies">
                        {suggestions.map((s, i) => (
                          <button key={i} className="p3qr-btn" onClick={() => sendMessage(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {isLiveCallUI && (
                  <div className="p3call-full">
                    <div className="p3call-stage">
                      <Avatar3D
                        color={char.color}
                        state={isListening ? "thinking" : streamingMsgId || isSpeaking ? "streaming" : "idle"}
                        customization={char.customization || {}}
                        micLevel={micLevel}
                        expression={detectedExpression}
                        closeUp
                        hideLabel
                      />

                      <div className="p3call-topbar">
                        <div className="p3call-pill">
                          <span className="dot" />
                          {isListening ? "Listening to you" : isTyping || thinkingPhase ? "Analyzing" : isSpeaking ? `${char.name} speaking` : `${char.name} · Live`}
                        </div>
                        <button
                          className="p3call-transcript-toggle"
                          onClick={() => setShowCallTranscript(true)}
                          title="View full transcript"
                        >
                          💬
                        </button>
                      </div>

                      {cameraOn && (
                        <div className="p3cam-pip">
                          <video ref={videoRef} className="p3cam-video" playsInline muted autoPlay />
                          <div className="p3cam-tag">
                            {faceApiStatus === "loading" ? "loading…" : detectedExpression || "you"}
                          </div>
                        </div>
                      )}

                      {voiceError && <div className="p3call-error">{voiceError}</div>}

                      {messages.length > 0 && (
                        <div className="p3call-caption-wrap">
                          {(() => {
                            const last = messages[messages.length - 1];
                            return (
                              <div className={`p3call-caption ${last.role}`}>
                                {last.role === "assistant" && last.streaming && last.id === streamingMsgId ? (
                                  <StreamingText text={last.content} onComplete={() => handleStreamComplete(last.id)} />
                                ) : (
                                  last.content
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {showCallTranscript && (
                        <div className="p3call-transcript">
                          <div className="p3call-transcript-head">
                            <span>TRANSCRIPT</span>
                            <button className="p3call-transcript-toggle" onClick={() => setShowCallTranscript(false)}>✕</button>
                          </div>
                          <div className="p3call-msgs" ref={messagesContainerRef}>
                            {messages.map((msg) => (
                              <div key={msg.id} className={`p3mr ${msg.role}`}>
                                {msg.role === "assistant" ? <div className="p3mav">{char.avatar}</div> : <div className="p3uav">You</div>}
                                <div className="p3msg-content">
                                  <div className={`p3bub ${msg.role}`}>
                                    {msg.role === "assistant" && msg.streaming && msg.id === streamingMsgId ? (
                                      <StreamingText text={msg.content} onComplete={() => handleStreamComplete(msg.id)} />
                                    ) : (
                                      msg.content
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p3call-dock">
                      <button
                        className={`p3call-round${autoSpeak ? " active" : ""}`}
                        onClick={() => { stopSpeaking(); setAutoSpeak((p) => !p); }}
                        title={autoSpeak ? "Voice reply on — tap to mute" : "Voice reply off — tap to unmute"}
                      >
                        {autoSpeak ? "🔊" : "🔇"}
                      </button>
                      <button
                        className={`p3call-round${cameraOn ? " active" : ""}`}
                        onClick={toggleVideoCall}
                        title={cameraOn ? "Turn camera off" : "Turn camera on"}
                      >
                        📷
                      </button>
                      <button
                        className={`p3call-round${isListening ? " active" : ""}`}
                        onClick={toggleListening}
                        disabled={!voiceSupported || isTyping}
                        title={isListening ? "Stop microphone" : "Start microphone"}
                      >
                        🎙
                      </button>
                      <button
                        className="p3call-round end"
                        onClick={() => { setLiveMicMode(false); stopListening(); stopVideoCall(); setShowCallTranscript(false); }}
                        title="End call"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                {!isLiveCallUI && (
                <div className="p3inp">
                  <div className="p3inpl">[ COMPOSE MESSAGE ]</div>
                  {uploadedImage && (
                    <div style={{
                      marginBottom: "12px",
                      padding: "12px",
                      background: "var(--sys-panel-soft)",
                      border: "1px solid var(--sys-line)",
                      borderRadius: "16px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center"
                    }}>
                      <img 
                        src={uploadedImage.data} 
                        alt="Preview" 
                        style={{width: "60px", height: "60px", borderRadius: "12px", objectFit: "cover"}}
                      />
                      <div style={{flex: 1}}>
                        <div style={{fontSize: "11px", color: "var(--sys-muted)", textTransform: "uppercase", letterSpacing: "1px"}}>
                          📸 Image Uploaded
                        </div>
                        {uploadedImage.filename && <div style={{fontSize: "12px", color: "var(--sys-text)", marginTop: "4px"}}>{uploadedImage.filename}</div>}
                      </div>
                      <button
                        onClick={clearImage}
                        style={{
                          background: "rgba(242, 95, 111, 0.15)",
                          border: "1px solid rgba(242, 95, 111, 0.8)",
                          color: "#ff9faa",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          fontSize: "11px",
                          transition: "all 0.2s"
                        }}
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="p3voice-row">
                    <button
                      className={`p3mic-btn${isListening ? " live" : ""}`}
                      onClick={toggleListening}
                      disabled={!voiceSupported || isTyping}
                      title={isListening ? "Stop microphone" : "Start microphone"}
                    >
                      {isListening ? "◉ LISTENING" : "🎙 START MIC"}
                    </button>
                    <button
                      className={`p3voice-chip${liveMicMode ? " active" : ""}`}
                      onClick={() => setLiveMicMode((prev) => !prev)}
                      disabled={!voiceSupported || isTyping}
                      title="Auto-send final speech segments"
                    >
                      {liveMicMode ? "EXIT LIVE" : "LIVE CALL"}
                    </button>
                    <button
                      className={`p3voice-chip${autoSpeak ? " active" : ""}`}
                      onClick={() => setAutoSpeak((prev) => !prev)}
                      disabled={!voiceSupported}
                      title="Read replies out loud"
                    >
                      VOICE REPLY
                    </button>
                    <button
                      className="p3voice-chip"
                      onClick={stopSpeaking}
                      disabled={!isSpeaking}
                      title="Stop spoken playback"
                    >
                      STOP SPEAKING
                    </button>
                    <div className="p3voice-hint">
                      {!voiceSupported
                        ? "Mic needs HTTPS + Chrome/Edge speech recognition"
                        : "Speak naturally, edit text if needed, then press SEND"}
                    </div>
                  </div>
                  {voiceError && <div className="p3voice-error">{voiceError}</div>}
                  {/* Image Upload - Available to all characters */}
                  <div style={{marginBottom: "12px"}}>
                    <button
                      className="p3voice-chip"
                      onClick={() => imageInputRef.current?.click()}
                      title="Upload image file"
                    >
                      📁 UPLOAD
                    </button>
                    <input 
                      ref={imageInputRef}
                      type="file" 
                      accept="image/*" 
                      style={{display: "none"}} 
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div className="p3inpw">
                    <textarea
                      ref={inputRef}
                      className="p3ta"
                      placeholder={`Message ${char.name}...`}
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
                    <button className="p3send" onClick={sendMessage} disabled={isTyping || (!input.trim() && !uploadedImage)}>
                      SEND
                    </button>
                  </div>
                </div>
                )}
              </div>

              {/* FileExplorer Toggle Button */}
              <button
                className={`p3file-toggle${showFileExplorer ? " active" : ""}`}
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                title="Toggle My Computer"
              >
                {showFileExplorer ? "\u2715 CLOSE" : "\uD83D\uDCC1 FILES"}
              </button>

              {/* Assembly Panel Toggle */}
              <button
                className={`p3file-toggle${showAssembly ? " active" : ""}`}
                onClick={() => setShowAssembly(!showAssembly)}
                title="View assembled system prompt"
                style={{ right: "auto", left: "18px" }}
              >
                {showAssembly ? "\u2715 SYS" : "\u25A6 SYS"}
              </button>

              {/* Assembly Modal */}
              {showAssembly && (
                <div className="p3file-modal" onClick={() => setShowAssembly(false)}>
                  <div className="p3file-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                    <div className="p3file-modal-header">
                      <div className="p3file-modal-title">&#x25A6; Assembly View</div>
                      <button className="p3file-modal-close" onClick={() => setShowAssembly(false)}>&#x2715;</button>
                    </div>
                    <div className="p3file-modal-body">
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--sys-accent)", marginBottom: "8px", textTransform: "uppercase" }}>System Prompt</div>
                      <pre style={{ background: "var(--sys-bg)", border: "1px solid var(--sys-line)", borderRadius: "10px", padding: "14px", fontSize: "11px", color: "var(--sys-text)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, marginBottom: "16px", maxHeight: "220px", overflow: "auto" }}>{char.systemPrompt || "(none)"}</pre>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--sys-accent)", marginBottom: "8px", textTransform: "uppercase" }}>MyComputer Files</div>
                      <pre style={{ background: "var(--sys-bg)", border: "1px solid var(--sys-line)", borderRadius: "10px", padding: "14px", fontSize: "11px", color: "var(--sys-text)", whiteSpace: "pre-wrap", lineHeight: 1.6, marginBottom: "16px" }}>{mcGetTree(char.id)}</pre>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--sys-accent)", marginBottom: "8px", textTransform: "uppercase" }}>FILE_ACTION Format</div>
                      <pre style={{ background: "var(--sys-bg)", border: "1px solid var(--sys-line)", borderRadius: "10px", padding: "14px", fontSize: "11px", color: "var(--sys-muted)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{"[FILE_ACTION:create|/path|filename|file|content]\n[FILE_ACTION:update|/path|filename|file|new content]\n[FILE_ACTION:delete|/path|filename|file|]"}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* FileExplorer Modal */}
              {showFileExplorer && (
                <div className="p3file-modal" onClick={() => setShowFileExplorer(false)}>
                  <div className="p3file-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="p3file-modal-header">
                      <div className="p3file-modal-title">📁 My Computer</div>
                      <button
                        className="p3file-modal-close"
                        onClick={() => setShowFileExplorer(false)}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p3file-modal-body">
                      <FileExplorer personaId={char.id} refreshKey={fileRefreshKey} charMeta={{ name: char.name, title: char.title, archetype: char.archetype, systemPrompt: char.systemPrompt }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}