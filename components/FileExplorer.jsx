"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — flat path map, no server needed
// key: `mycomputer:${personaId}`
// value: { "/file.txt": { type:"file", content:"...", modified:"..." }, ... }
// ─────────────────────────────────────────────────────────────────────────────

export const mcKey = (personaId) => `mycomputer:${personaId}`;

export const mcLoad = (personaId) => {
  try {
    const raw = localStorage.getItem(mcKey(personaId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export const mcSave = (personaId, fs) => {
  try { localStorage.setItem(mcKey(personaId), JSON.stringify(fs)); } catch {}
};

// Returns files/folders that are direct children of folderPath
export const mcList = (fs, folderPath) => {
  const prefix = folderPath === "/" ? "/" : folderPath + "/";
  const seen = new Set();
  const items = [];
  for (const [p, node] of Object.entries(fs)) {
    if (folderPath === "/") {
      if (!p.startsWith("/") || p === "/") continue;
      const rest = p.slice(1); // strip leading /
      if (!rest) continue;
      const slash = rest.indexOf("/");
      if (slash === -1) {
        if (!seen.has(p)) { seen.add(p); items.push({ name: rest, path: p, ...node }); }
      } else {
        const dirName = rest.slice(0, slash);
        const dirPath = "/" + dirName;
        if (!seen.has(dirPath)) { seen.add(dirPath); items.push({ name: dirName, path: dirPath, type: "folder" }); }
      }
    } else {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      if (!rest) continue;
      const slash = rest.indexOf("/");
      if (slash === -1) {
        if (!seen.has(p)) { seen.add(p); items.push({ name: rest, path: p, ...node }); }
      } else {
        const dirName = rest.slice(0, slash);
        const dirPath = prefix + dirName;
        if (!seen.has(dirPath)) { seen.add(dirPath); items.push({ name: dirName, path: dirPath, type: "folder" }); }
      }
    }
  }
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

// Apply a FILE_ACTION from AI: { action, path, name, type, content }
export const mcApplyAction = (personaId, action) => {
  const fs = mcLoad(personaId);
  const fullPath = action.path === "/" ? `/${action.name}` : `${action.path}/${action.name}`;
  if (action.action === "create" || action.action === "update") {
    if (action.type === "folder") {
      fs[fullPath] = { type: "folder", created: new Date().toISOString() };
    } else {
      const existing = fs[fullPath];
      fs[fullPath] = {
        type: "file",
        content: action.content || "",
        created: existing?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
      };
    }
  } else if (action.action === "delete") {
    const target = action.name ? fullPath : action.path;
    for (const key of Object.keys(fs)) {
      if (key === target || key.startsWith(target + "/")) delete fs[key];
    }
  }
  mcSave(personaId, fs);
};

// Build a compact tree string for AI context
export const mcGetTree = (personaId) => {
  const fs = mcLoad(personaId);
  const keys = Object.keys(fs).sort();
  if (!keys.length) return "(empty)";
  return keys.map((p) => {
    const n = fs[p];
    if (n.type === "folder") return `${p}/`;
    return `${p} (${(n.content || "").length} chars)`;
  }).join("\n");
};

// ─────────────────────────────────────────────────────────────────────────────
// EXT badges
// ─────────────────────────────────────────────────────────────────────────────

const EXT_ICONS = {
  js:"JS", jsx:"JSX", ts:"TS", tsx:"TSX", py:"PY", cs:"C#",
  java:"JV", cpp:"C+", go:"GO", rs:"RS", html:"HT", css:"CS",
  json:"JN", xml:"XL", yaml:"YM", yml:"YM", sh:"SH", sql:"SQ",
  md:"MD", txt:"TX", svg:"SV",
};

const extBadge = (name) => {
  const parts = (name || "").split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
  return EXT_ICONS[ext] || ext.toUpperCase().slice(0, 2) || "??";
};

const S = {
  btn: (v = "default") => ({
    padding: "5px 12px", fontSize: "11px", border: "none",
    borderRadius: "4px", cursor: "pointer", fontWeight: "500",
    ...(v === "primary" && { background: "var(--sys-accent-strong)", color: "#fff" }),
    ...(v === "danger"  && { background: "var(--sys-danger)", color: "#fff" }),
    ...(v === "ghost"   && { background: "transparent", border: "1px solid var(--sys-line)", color: "var(--sys-muted)" }),
    ...(v === "default" && { background: "var(--sys-accent-soft)", border: "1px solid var(--sys-accent)", color: "var(--sys-accent-strong)" }),
  }),
  input: {
    width: "100%", padding: "7px 9px",
    background: "var(--sys-bg)", border: "1px solid var(--sys-line)",
    borderRadius: "4px", color: "var(--sys-text)", fontSize: "12px",
    boxSizing: "border-box", outline: "none",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function FileExplorer({ personaId, refreshKey }) {
  const [path, setPath] = useState("/");
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [addError, setAddError] = useState("");

  const textareaRef = useRef(null);

  const refresh = useCallback(() => {
    const fs = mcLoad(personaId);
    setFiles(mcList(fs, path));
  }, [personaId, path]);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);
  useEffect(() => { if (selected) textareaRef.current?.focus(); }, [selected]);

  const selectFile = (item) => {
    if (item.type === "folder") {
      setPath(item.path); setSelected(null); setContent(""); return;
    }
    setSelected(item); setSaveMsg("");
    const fs = mcLoad(personaId);
    setContent(fs[item.path]?.content || "");
  };

  const saveFile = () => {
    if (!selected || !content.trim()) return;
    setSaving(true);
    const fs = mcLoad(personaId);
    fs[selected.path] = { ...fs[selected.path], content, modified: new Date().toISOString() };
    mcSave(personaId, fs);
    setSaveMsg("Saved.");
    setSaving(false);
    refresh();
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const downloadFile = () => {
    if (!selected) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selected.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const deleteFile = (item, e) => {
    e?.stopPropagation();
    if (!confirm(`Delete "${item.name}"?`)) return;
    const fs = mcLoad(personaId);
    for (const key of Object.keys(fs)) {
      if (key === item.path || key.startsWith(item.path + "/")) delete fs[key];
    }
    mcSave(personaId, fs);
    if (selected?.path === item.path) { setSelected(null); setContent(""); }
    refresh();
  };

  const addFile = () => {
    if (!newName.trim()) { setAddError("Name required."); return; }
    if (!newContent.trim()) { setAddError("Content required."); return; }
    const fs = mcLoad(personaId);
    const fullPath = path === "/" ? `/${newName.trim()}` : `${path}/${newName.trim()}`;
    if (fs[fullPath]) { setAddError("File already exists."); return; }
    fs[fullPath] = { type: "file", content: newContent, created: new Date().toISOString(), modified: new Date().toISOString() };
    mcSave(personaId, fs);
    setNewName(""); setNewContent(""); setAdding(false); setAddError("");
    refresh();
  };

  const addFolder = () => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    const fs = mcLoad(personaId);
    const fullPath = path === "/" ? `/${name.trim()}` : `${path}/${name.trim()}`;
    fs[fullPath] = { type: "folder", created: new Date().toISOString() };
    mcSave(personaId, fs);
    refresh();
  };

  const crumbs = [
    { label: "root", path: "/" },
    ...(path !== "/" ? path.split("/").filter(Boolean).map((p, i, arr) => ({
      label: p, path: "/" + arr.slice(0, i + 1).join("/"),
    })) : []),
  ];

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--sys-panel)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--sys-line)" }}>

      {/* LEFT: file list */}
      <div style={{ width: "220px", flexShrink: 0, borderRight: "1px solid var(--sys-line)", display: "flex", flexDirection: "column", background: "var(--sys-panel-soft)" }}>

        {/* breadcrumb */}
        <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--sys-line)", fontSize: "10px", color: "var(--sys-muted)", display: "flex", gap: "3px", flexWrap: "wrap", alignItems: "center" }}>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
              <button onClick={() => { setPath(c.path); setSelected(null); setContent(""); }}
                style={{ background: "none", border: "none", color: "var(--sys-accent)", cursor: "pointer", padding: 0, fontSize: "10px" }}>
                {c.label}
              </button>
            </span>
          ))}
        </div>

        {/* toolbar */}
        <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--sys-line)", display: "flex", gap: "5px" }}>
          <button onClick={() => { setAdding((v) => !v); setAddError(""); }}
            style={{ ...S.btn(), flex: 1, padding: "5px 4px" }}>
            {adding ? "Cancel" : "+ File"}
          </button>
          <button onClick={addFolder} style={{ ...S.btn("ghost"), flex: 1, padding: "5px 4px" }}>+ Dir</button>
        </div>

        {/* inline add form */}
        {adding && (
          <div style={{ padding: "8px", borderBottom: "1px solid var(--sys-line)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <input autoFocus value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
              placeholder="filename.txt"
              style={{ ...S.input, fontSize: "11px" }}
            />
            <textarea value={newContent}
              onChange={(e) => { setNewContent(e.target.value); setAddError(""); }}
              placeholder="Content..."
              rows={4}
              style={{ ...S.input, resize: "vertical", fontFamily: "monospace", fontSize: "11px", lineHeight: "1.4" }}
            />
            {addError && <div style={{ fontSize: "10px", color: "var(--sys-danger)" }}>{addError}</div>}
            <button onClick={addFile} style={{ ...S.btn("primary"), width: "100%" }}>Create</button>
          </div>
        )}

        {/* file list */}
        <div style={{ flex: 1, overflow: "auto", padding: "4px" }}>
          {files.length === 0 && (
            <div style={{ padding: "16px 10px", fontSize: "11px", color: "var(--sys-muted)", textAlign: "center" }}>
              No files yet.<br />Use &quot;+ File&quot; to add one.
            </div>
          )}
          {files.map((item) => {
            const active = selected?.path === item.path;
            return (
              <div key={item.path} onClick={() => selectFile(item)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 7px", marginBottom: "1px", borderRadius: "4px", cursor: "pointer", background: active ? "var(--sys-accent-soft)" : "transparent", border: active ? "1px solid var(--sys-accent)" : "1px solid transparent", fontSize: "11px", color: "var(--sys-text)" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--sys-accent-soft)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.5px", padding: "1px 4px", borderRadius: "3px", flexShrink: 0, background: item.type === "folder" ? "var(--sys-line)" : "var(--sys-accent-soft)", color: item.type === "folder" ? "var(--sys-muted)" : "var(--sys-accent-strong)", border: "1px solid var(--sys-line)" }}>
                  {item.type === "folder" ? "DIR" : extBadge(item.name)}
                </span>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                <button onClick={(e) => deleteFile(item, e)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sys-danger)", fontSize: "11px", padding: "1px 3px", opacity: 0.5, flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                >x</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {selected ? (
          <>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--sys-line)", display: "flex", alignItems: "center", gap: "10px", background: "var(--sys-panel-soft)" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--sys-text)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selected.path}
              </span>
              {saveMsg && (
                <span style={{ fontSize: "10px", color: "var(--sys-accent)", flexShrink: 0 }}>{saveMsg}</span>
              )}
              <button onClick={saveFile} disabled={saving} style={{ ...S.btn("primary"), flexShrink: 0 }}>
                {saving ? "..." : "Save"}
              </button>
              <button onClick={downloadFile} style={{ ...S.btn("ghost"), flexShrink: 0 }}>
                Download
              </button>
              <button onClick={(e) => deleteFile(selected, e)} style={{ ...S.btn("danger"), flexShrink: 0 }}>
                Delete
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveFile(); }
                if (e.key === "Tab") {
                  e.preventDefault();
                  const s = e.target.selectionStart;
                  const v = content.substring(0, s) + "  " + content.substring(e.target.selectionEnd);
                  setContent(v);
                  requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; });
                }
              }}
              style={{ flex: 1, width: "100%", padding: "14px 16px", background: "var(--sys-bg)", border: "none", outline: "none", color: "var(--sys-text)", fontSize: "12px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: "1.65", resize: "none", boxSizing: "border-box" }}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sys-muted)", flexDirection: "column", gap: "6px" }}>
            <div style={{ fontSize: "13px" }}>Select a file to edit</div>
            <div style={{ fontSize: "11px", opacity: 0.6 }}>Ctrl+S to save</div>
          </div>
        )}
      </div>
    </div>
  );
}
