import { NextResponse } from "next/server";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { system, messages } = body ?? {};

    if (!system || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const anthropicRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return NextResponse.json({ error: data?.error?.message || "Anthropic API error." }, { status: anthropicRes.status });
    }

    const text = Array.isArray(data?.content)
      ? data.content.map((block) => block?.text || "").join("")
      : "";

    return NextResponse.json({ text: text || "..." });
  } catch {
    return NextResponse.json({ error: "Failed to process chat request." }, { status: 500 });
  }
}
