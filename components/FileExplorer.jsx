"use client";

import { useState, useEffect } from "react";

const FileExplorer = ({ personaId }) => {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState("file");

  useEffect(() => {
    loadFolderContents(currentPath);
    updateBreadcrumb(currentPath);
  }, [currentPath, personaId]);

  const loadFolderContents = async (path) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/persona-files/list?personaId=${personaId}&path=${encodeURIComponent(
          path
        )}`
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
          width: "280px",
          borderRight: "1px solid var(--sys-line)",
          display: "flex",
          flexDirection: "column",
          background: "var(--sys-panel-soft)",
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
        <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
          {loading ? (
            <div style={{ fontSize: "12px", color: "var(--sys-muted)" }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ fontSize: "12px", color: "var(--sys-muted)" }}>Empty folder</div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openFile(item)}
                style={{
                  padding: "8px",
                  marginBottom: "4px",
                  background:
                    selectedFile?.path === item.path ? "var(--sys-accent-soft)" : "transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "var(--sys-text)",
                  transition: "all 0.2s",
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
                <span style={{ fontSize: "14px" }}>
                  {item.type === "folder" ? "📁" : "📄"}
                </span>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </span>
              </div>
            ))
          )}
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
            <div
              style={{
                flex: 1,
                background: "var(--sys-bg)",
                borderRadius: "4px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "var(--sys-text)",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                border: "1px solid var(--sys-line)",
              }}
            >
              {fileContent || "(Empty file)"}
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
