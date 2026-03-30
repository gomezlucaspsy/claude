"use client";

import { useState, useEffect } from "react";

// File type detection helpers
const getFileExt = (name) => {
  const parts = (name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const isSvgFile = (name) => getFileExt(name) === "svg";
const isCodeFile = (name) => ["js", "jsx", "ts", "tsx", "py", "cs", "java", "cpp", "c", "h", "html", "css", "json", "xml", "yaml", "yml", "sh", "bash", "sql", "rb", "go", "rs", "lua", "php"].includes(getFileExt(name));
const isImageFile = (name) => ["svg", "img"].includes(getFileExt(name));

const getFileIcon = (name) => {
  const ext = getFileExt(name);
  if (ext === "svg" || ext === "img") return "🖼️";
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return "⚡";
  if (["py"].includes(ext)) return "🐍";
  if (["html", "css"].includes(ext)) return "🌐";
  if (["json", "xml", "yaml", "yml"].includes(ext)) return "📋";
  if (["cs", "java", "cpp", "c", "go", "rs"].includes(ext)) return "⚙️";
  if (["sh", "bash"].includes(ext)) return "💻";
  if (["sql"].includes(ext)) return "🗃️";
  if (["md", "txt"].includes(ext)) return "📝";
  return "📄";
};

// Sanitize SVG content - strip scripts and event handlers for security
const sanitizeSvg = (svgString) => {
  return svgString
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "safe-data:");
};

const FileExplorer = ({ personaId, refreshKey, charMeta }) => {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState("file");
  const [treeWidth, setTreeWidth] = useState(30); // percentage - start smaller
  const [isResizing, setIsResizing] = useState(false);
  const [showResizeHint, setShowResizeHint] = useState(false);

  useEffect(() => {
    loadFolderContents(currentPath);
    updateBreadcrumb(currentPath);
  }, [currentPath, personaId, refreshKey]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e) => {
      const container = document.querySelector("[data-file-explorer-container]");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 15 && newWidth < 80) {
        setTreeWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const loadFolderContents = async (path) => {
    setLoading(true);
    try {
      const metaParam = charMeta ? `&meta=${encodeURIComponent(JSON.stringify(charMeta))}` : "";
      const response = await fetch(
        `/api/persona-files/list?personaId=${personaId}&path=${encodeURIComponent(
          path
        )}${metaParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error loading folder:", error);
    }
    setLoading(false);
  };

  const updateBreadcrumb = (path) => {
    const parts = path.split("/").filter(Boolean);
    const bc = [{ name: "MyComputer", path: "/" }];
    let accumulated = "";
    for (const part of parts) {
      accumulated += `/${part}`;
      bc.push({ name: part, path: accumulated });
    }
    setBreadcrumb(bc);
  };

  const navigateTo = (path) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent("");
  };

  const openFile = async (item) => {
    if (item.type === "folder") {
      navigateTo(item.path);
    } else {
      setSelectedFile(item);
      try {
        const response = await fetch("/api/persona-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "read",
            personaId,
            path: item.path,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content || "");
        }
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }
  };

  const createNewItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const response = await fetch("/api/persona-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          personaId,
          path: currentPath,
          name: newItemName,
          type: newItemType,
          content: "",
        }),
      });

      if (response.ok) {
        setNewItemName("");
        setShowNewItemDialog(false);
        loadFolderContents(currentPath);
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const deleteItem = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return;

    try {
      const response = await fetch("/api/persona-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          personaId,
          path: item.path,
        }),
      });

      if (response.ok) {
        loadFolderContents(currentPath);
        setSelectedFile(null);
        setFileContent("");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div
      data-file-explorer-container
      style={{
        display: "flex",
        height: "100%",
        background: "var(--sys-panel)",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--sys-line)",
      }}
    >
      {/* File Tree Panel */}
      <div
        style={{
          width: `${treeWidth}%`,
          borderRight: "1px solid var(--sys-line)",
          display: "flex",
          flexDirection: "column",
          background: "var(--sys-panel-soft)",
          transition: isResizing ? "none" : "width 0.2s",
        }}
      >
        {/* Breadcrumb */}
        <div style={{ padding: "12px", borderBottom: "1px solid var(--sys-line)" }}>
          <div style={{ fontSize: "11px", color: "var(--sys-muted)", display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {breadcrumb.map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {idx > 0 && <span style={{ color: "var(--sys-muted)" }}>/</span>}
                <button
                  onClick={() => navigateTo(item.path)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--sys-accent)",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "11px",
                  }}
                >
                  {item.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "8px", borderBottom: "1px solid var(--sys-line)", display: "flex", gap: "6px" }}>
          <button
            onClick={() => setShowNewItemDialog(true)}
            style={{
              flex: 1,
              padding: "6px 8px",
              fontSize: "11px",
              background: "var(--sys-accent-soft)",
              border: "1px solid var(--sys-accent)",
              color: "var(--sys-accent-strong)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            New
          </button>
        </div>

        {/* File List */}
        <div style={{ flex: 1, overflow: "auto", padding: "6px" }}>
          {loading ? (
            <div style={{ fontSize: "12px", color: "var(--sys-muted)", padding: "8px" }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ fontSize: "12px", color: "var(--sys-muted)", padding: "8px" }}>Empty folder</div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openFile(item)}
                style={{
                  padding: "6px 6px",
                  marginBottom: "2px",
                  background:
                    selectedFile?.path === item.path ? "var(--sys-accent-soft)" : "transparent",
                  borderRadius: "3px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "var(--sys-text)",
                  transition: "all 0.15s",
                  border: selectedFile?.path === item.path ? "1px solid var(--sys-accent)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sys-accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    selectedFile?.path === item.path
                      ? "var(--sys-accent-soft)"
                      : "transparent";
                }}
              >
                <span style={{ fontSize: "12px", flexShrink: 0 }}>
                  {item.type === "folder" ? "📁" : getFileIcon(item.name)}
                </span>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                  {item.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        onMouseDown={() => {
          setIsResizing(true);
          setShowResizeHint(false);
        }}
        onMouseEnter={() => !isResizing && setShowResizeHint(true)}
        onMouseLeave={() => setShowResizeHint(false)}
        style={{
          width: "8px",
          background: isResizing
            ? "var(--sys-accent-strong)"
            : showResizeHint
            ? "var(--sys-accent)"
            : "var(--sys-line-soft)",
          cursor: "col-resize",
          transition: isResizing ? "none" : "all 0.2s ease",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Visual dots indicator */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            opacity: showResizeHint || isResizing ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          <div style={{ width: "1px", height: "1px", background: "var(--sys-accent)" }} />
          <div style={{ width: "1px", height: "1px", background: "var(--sys-accent)" }} />
          <div style={{ width: "1px", height: "1px", background: "var(--sys-accent)" }} />
        </div>
      </div>

      {/* File Content Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px" }}>
        {selectedFile ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--sys-text)" }}>
                  {selectedFile.name}
                </div>
                {selectedFile.modified && (
                  <div style={{ fontSize: "11px", color: "var(--sys-muted)", marginTop: "4px" }}>
                    Modified: {new Date(selectedFile.modified).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteItem(selectedFile)}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "var(--sys-danger)",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>

            {/* File type badge */}
            {getFileExt(selectedFile.name) && (
              <div style={{
                display: "inline-block",
                padding: "2px 8px",
                fontSize: "9px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--sys-accent)",
                background: "var(--sys-accent-soft)",
                border: "1px solid var(--sys-line)",
                borderRadius: "999px",
                marginBottom: "8px",
              }}>
                {isSvgFile(selectedFile.name) ? "SVG IMAGE" : isCodeFile(selectedFile.name) ? `CODE — .${getFileExt(selectedFile.name)}` : getFileExt(selectedFile.name)}
              </div>
            )}

            {/* Content area — smart rendering based on file type */}
            <div style={{ flex: 1, overflow: "auto", border: "1px solid var(--sys-line)", borderRadius: "8px" }}>
              {isSvgFile(selectedFile.name) && fileContent ? (
                /* SVG Image Renderer */
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "16px",
                  background: "var(--sys-bg)",
                  minHeight: "200px",
                }}>
                  <div
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      overflow: "hidden",
                      borderRadius: "8px",
                      border: "1px solid var(--sys-line-soft)",
                      background: "#0a0a0a",
                      padding: "8px",
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(fileContent) }}
                  />
                  <details style={{ width: "100%", marginTop: "12px" }}>
                    <summary style={{
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--sys-muted)",
                      cursor: "pointer",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}>View SVG Source</summary>
                    <pre style={{
                      background: "var(--sys-bg)",
                      padding: "10px",
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "var(--sys-muted)",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      marginTop: "6px",
                      borderRadius: "4px",
                      maxHeight: "150px",
                      overflow: "auto",
                    }}>{fileContent}</pre>
                  </details>
                </div>
              ) : isCodeFile(selectedFile.name) && fileContent ? (
                /* Code Renderer */
                <div style={{ position: "relative" }}>
                  <pre style={{
                    margin: 0,
                    padding: "14px 14px 14px 48px",
                    background: "var(--sys-bg)",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--sys-text)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    lineHeight: "1.6",
                    counterReset: "line",
                  }}>
                    {fileContent.split("\n").map((line, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <span style={{
                          position: "absolute",
                          left: "-38px",
                          width: "28px",
                          textAlign: "right",
                          color: "rgba(150,180,220,.25)",
                          fontSize: "9px",
                          userSelect: "none",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{i + 1}</span>
                        {line || " "}
                      </div>
                    ))}
                  </pre>
                </div>
              ) : (
                /* Default text renderer */
                <div
                  style={{
                    padding: "12px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "var(--sys-text)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    background: "var(--sys-bg)",
                    lineHeight: "1.55",
                  }}
                >
                  {fileContent || "(Empty file)"}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "14px", color: "var(--sys-muted)" }}>
            Select a file to view its contents
          </div>
        )}
      </div>

      {/* New Item Dialog */}
      {showNewItemDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowNewItemDialog(false)}
        >
          <div
            style={{
              background: "var(--sys-panel)",
              padding: "24px",
              borderRadius: "8px",
              border: "1px solid var(--sys-line)",
              minWidth: "300px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--sys-text)" }}>
              Create New Item
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--sys-muted)", marginBottom: "4px" }}>
                Type
              </label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "var(--sys-bg)",
                  border: "1px solid var(--sys-line)",
                  borderRadius: "4px",
                  color: "var(--sys-text)",
                }}
              >
                <option value="file">File</option>
                <option value="folder">Folder</option>
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--sys-muted)", marginBottom: "4px" }}>
                Name
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createNewItem()}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "var(--sys-bg)",
                  border: "1px solid var(--sys-line)",
                  borderRadius: "4px",
                  color: "var(--sys-text)",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={createNewItem}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "var(--sys-accent-strong)",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowNewItemDialog(false)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "var(--sys-line)",
                  border: "none",
                  color: "var(--sys-text)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
