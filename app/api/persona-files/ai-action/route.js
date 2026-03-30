import { NextResponse } from "next/server";
import {
  getOrCreateFileSystem,
  createFileOrFolder,
  readFile,
  updateFile,
  deleteFileOrFolder,
  getFileTree,
} from "../store.js";

/**
 * POST /api/persona-files/ai-action
 * Allows AI to perform file operations programmatically during conversation.
 * Supports: create, read, update, delete, list
 */

export async function POST(request) {
  try {
    const { personaId, aiAction, details, meta } = await request.json();

    if (!personaId || !aiAction) {
      return NextResponse.json(
        { error: "Missing personaId or aiAction" },
        { status: 400 }
      );
    }

    const fs = getOrCreateFileSystem(personaId, meta || {});
    let result;

    switch (aiAction.action) {
      case "create":
        result = createFileOrFolder(fs.root, aiAction.path || "/", aiAction.name, aiAction.type || "file", aiAction.content || "");
        break;
      case "read":
        result = readFile(fs.root, aiAction.path);
        break;
      case "update":
        result = updateFile(fs.root, aiAction.path, aiAction.content || "");
        break;
      case "delete":
        result = deleteFileOrFolder(fs.root, aiAction.path);
        break;
      case "list":
        const tree = getFileTree(fs.root);
        result = { success: true, tree: tree.join("\n") };
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${aiAction.action}` }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action: aiAction.action,
      path: aiAction.path,
      message: generateAIActionMessage(aiAction, details),
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

const generateAIActionMessage = (aiAction, details) => {
  switch (aiAction.action) {
    case "create":
      return `Created ${aiAction.type === "folder" ? "folder" : "file"} "${aiAction.name}" in ${aiAction.path}`;
    case "update":
      return `Updated file "${aiAction.path}"`;
    case "delete":
      return `Deleted "${aiAction.path}"`;
    default:
      return `Performed ${aiAction.action} action`;
  }
};
