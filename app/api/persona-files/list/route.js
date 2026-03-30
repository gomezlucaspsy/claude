import { NextResponse } from "next/server";
import { getOrCreateFileSystem, navigateToFolder } from "../store.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get("personaId");
    const path = searchParams.get("path") || "/";

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    // Accept optional meta from query params for scaffolding
    const metaRaw = searchParams.get("meta");
    let meta = {};
    if (metaRaw) {
      try { meta = JSON.parse(decodeURIComponent(metaRaw)); } catch {}
    }

    const fs = getOrCreateFileSystem(personaId, meta);
    const folderContents = navigateToFolder(fs.root, path);

    if (!folderContents) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

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
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { personaId, meta } = await request.json();

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    const fs = getOrCreateFileSystem(personaId, meta || {});

    return NextResponse.json({
      success: true,
      fileSystem: fs,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
