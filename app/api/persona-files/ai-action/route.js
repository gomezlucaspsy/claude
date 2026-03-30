import { NextResponse } from "next/server";

/**
 * POST /api/persona-files/ai-action
 * Allows AI to perform file operations programmatically
 * Used when the persona wants to create/modify files during conversation
 */

export async function POST(request) {
  try {
    const { personaId, aiAction, details } = await request.json();

    if (!personaId || !aiAction) {
      return NextResponse.json(
        { error: "Missing personaId or aiAction" },
        { status: 400 }
      );
    }

    // Delegate to main file route
    const fileResponse = await fetch(
      new URL("/api/persona-files", request.url),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAction.action,
          personaId,
          path: aiAction.path,
          name: aiAction.name,
          type: aiAction.type,
          content: aiAction.content,
        }),
      }
    );

    const fileResult = await fileResponse.json();

    if (!fileResponse.ok) {
      return NextResponse.json(fileResult, { status: fileResponse.status });
    }

    // Log the AI action
    return NextResponse.json({
      success: true,
      action: aiAction.action,
      path: aiAction.path,
      message: generateAIActionMessage(aiAction, details),
      result: fileResult,
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
