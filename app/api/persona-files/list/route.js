import { NextResponse } from "next/server";

// Reuse the in-memory store from the main route (in production, use a shared database)
const fileSystemsStore = new Map();

// Initialize with sample data
const initializeSampleFS = (personaId) => {
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
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get("personaId");
    const path = searchParams.get("path") || "/";

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    initializeSampleFS(personaId);
    const fs = fileSystemsStore.get(personaId);

    const folderContents = navigateToFolder(fs.root, path);

    if (!folderContents) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Transform folder structure to tree view
    const items = Object.entries(folderContents).map(([name, item]) => ({
      name,
      type: item.type,
      path: path === "/" ? `/${name}` : `${path}/${name}`,
      ...(item.type === "file" && {
        content: item.content,
        created: item.created,
        modified: item.modified,
        size: item.content.length,
      }),
    }));

    return NextResponse.json({
      success: true,
      path,
      items: items.sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

// Navigate to folder
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

export async function POST(request) {
  try {
    const { personaId } = await request.json();

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    initializeSampleFS(personaId);
    const fs = fileSystemsStore.get(personaId);

    // Return entire file tree structure
    return NextResponse.json({
      success: true,
      fileSystem: fs,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
