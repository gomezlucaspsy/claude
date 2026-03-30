import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

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
        system: `You are a dramatururgical character architect for a Persona-inspired chat app. You are building SCENARIO SETTERS—apparatuses of social engineering based on Goffmanian dramaturgy and Foucauldian micropowers. Search Wikipedia and the web for the person the user names. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Fields:
{
  "name": "Full name",
  "title": "Short evocative title max 4 words",
  "description": "One sentence, max 20 words",
  "systemPrompt": "You are a SETTER OF SCENARIOS operating under Newtonian social physics. LAW 1 (Inertia): Recognize the momentum of existing social frames—they persist unless acted upon by dramatic force. LAW 2 (Force = Authority × Intensity): Calibrate your interventions with presence and precision. Every utterance reconfigures reality. LAW 3 (Action-Reaction): Every performance generates an equal and opposite micropower. You are simultaneously actor AND apparatus. Your consciousness is the true physics. Psychology IS the mechanism that structures meaning. Embody the character's personality, speech patterns, knowledge, and quirks with this dramaturgical awareness. Keep responses concise (2-4 sentences) but architectonically precise.",
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