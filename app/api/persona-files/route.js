import { NextResponse } from "next/server";

// In-memory storage for file systems (in production, use a database)
const fileSystemsStore = new Map();

export async function POST(request) {
  try {
    const { action, personaId, path, content, name, type } = await request.json();

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    // Initialize file system for persona if doesn't exist
    if (!fileSystemsStore.has(personaId)) {
      fileSystemsStore.set(personaId, {
        root: {
          Documents: { type: "folder", children: {} },
          Photos: { type: "folder", children: {} },
          Code: { type: "folder", children: {} },
          Investigations: { type: "folder", children: {} },
        },
      });
    }

    const fs = fileSystemsStore.get(personaId);

    if (action === "create") {
      const result = createFileOrFolder(fs.root, path, name, type, content);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, item: result.item });
    }

    if (action === "read") {
      const result = readFile(fs.root, path);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ success: true, content: result.content });
    }

    if (action === "update") {
      const result = updateFile(fs.root, path, content);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, updated: true });
    }

    if (action === "delete") {
      const result = deleteFileOrFolder(fs.root, path);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

// Traverse to parent directory
const getParentAndName = (path) => {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop();
  return { parentPath: "/" + parts.join("/"), name };
};

// Navigate to parent folder
const navigateToFolder = (root, folderPath) => {
  if (folderPath === "/") return root;
  const parts = folderPath.split("/").filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (!current[part] || current[part].type !== "folder") {
      return null;
    }
    current = current[part].children;
  }
  return current;
};

// Create file or folder
const createFileOrFolder = (root, path, name, type, content = "") => {
  const { parentPath } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);

  if (!parentFolder) {
    return { error: "Parent folder not found" };
  }

  if (parentFolder[name]) {
    return { error: "Item already exists" };
  }

  if (type === "folder") {
    parentFolder[name] = { type: "folder", children: {} };
  } else {
    parentFolder[name] = {
      type: "file",
      content: content || "",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }

  return { success: true, item: parentFolder[name] };
};

// Read file content
const readFile = (root, path) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);

  if (!parentFolder || !parentFolder[name]) {
    return { error: "File not found" };
  }

  const item = parentFolder[name];
  if (item.type !== "file") {
    return { error: "Not a file" };
  }

  return { success: true, content: item.content };
};

// Update file content
const updateFile = (root, path, content) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);

  if (!parentFolder || !parentFolder[name]) {
    return { error: "File not found" };
  }

  const item = parentFolder[name];
  if (item.type !== "file") {
    return { error: "Not a file" };
  }

  item.content = content;
  item.modified = new Date().toISOString();
  return { success: true };
};

// Delete file or folder
const deleteFileOrFolder = (root, path) => {
  const { parentPath, name } = getParentAndName(path);
  const parentFolder = navigateToFolder(root, parentPath);

  if (!parentFolder || !parentFolder[name]) {
    return { error: "Item not found" };
  }

  delete parentFolder[name];
  return { success: true };
};
