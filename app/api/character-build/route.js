import { NextResponse } from "next/server";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a character builder for a Persona 3-inspired chat app. Search Wikipedia and the web for the person the user names. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Fields:
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
}`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const query = (body?.query || "").trim();

    if (!query) {
      return NextResponse.json({ error: "Missing query." }, { status: 400 });
    }

    const anthropicRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Build a character for: ${query}` }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return NextResponse.json({ error: data?.error?.message || "Anthropic API error." }, { status: anthropicRes.status });
    }

    const rawText = Array.isArray(data?.content)
      ? data.content.map((block) => block?.text || "").join("")
      : "";

    const jsonMatch = rawText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse character JSON from model response." }, { status: 422 });
    }

    let parsed;

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Generated JSON is invalid." }, { status: 422 });
    }

    return NextResponse.json({ character: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to process character build request." }, { status: 500 });
  }
}
