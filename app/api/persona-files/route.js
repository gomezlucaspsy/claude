import { NextResponse } from "next/server";
import {
  getOrCreateFileSystem,
  createFileOrFolder,
  readFile,
  updateFile,
  deleteFileOrFolder,
} from "./store.js";

export async function POST(request) {
  try {
    const { action, personaId, path, content, name, type, meta } = await request.json();

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    const fs = getOrCreateFileSystem(personaId, meta || {});

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
