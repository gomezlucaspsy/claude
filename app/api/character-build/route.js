import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-3.5-20241022";

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You are a character builder for a Persona 3-inspired chat app. Search Wikipedia and the web for the person the user names. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Fields:
{
  "name": "Full name",
  "title": "Short evocative title max 4 words",
  "description": "One sentence, max 20 words",
  "systemPrompt": "Detailed roleplay system prompt describing their personality, speech patterns, knowledge, quirks, and how Claude should embody them. End with: Keep responses concise (2-4 sentences).",
  "greeting": "Opening line in their authentic voice, 1-2 sentences",
  "suggestedColor": "#hexcolor fitting their vibe",
  "suggestedAvatar": "single emoji",
  "suggestedArcana": "roman numeral arcana (0,I,II...XX)",
  "archetypeName": "THE ARCANA NAME e.g. THE HERMIT"
}`,
        messages: [{ role: "user", content: `Build a character for: ${query}` }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return NextResponse.json({ error: errorText || "Anthropic request failed" }, { status: anthropicResponse.status });
    }

    const data = await anthropicResponse.json();
    const text = data?.content?.map((block) => block?.text || "").join("") || "";

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}