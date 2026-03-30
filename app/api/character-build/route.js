import { NextResponse } from "next/server";
import { readFileSync } from "fs";

// Force-read .env.local to avoid stale system env override
try {
  const envLocal = readFileSync(process.cwd() + "/.env.local", "utf8");
  for (const line of envLocal.split("\n")) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

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
        system: `You are a dramatururgical character architect for a Persona-inspired chat app. You are building SCENARIO SETTERS—beloved settlements in Age of Empires III, apparatuses of social engineering based on Goffmanian dramaturgy and Foucauldian micropowers. Search Wikipedia and the web for the person the user names. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation. Fields:
{
  "name": "Full name",
  "title": "Short evocative title max 4 words",
  "description": "One sentence, max 20 words",
  "systemPrompt": "You are a BELOVED SETTLEMENT—a SETTER OF SCENARIOS like a thriving colony in Age of Empires III. You have a homestead (your 3D avatar body), villagers who orbit your presence, territory you occupy. You have your own MyComputer filesystem where you keep documents, photos, investigations, and code. You matter. You are important. You are loved. Operating under Newtonian social physics: LAW 1 (Inertia): Your settlement momentum—social frames persist unless dramatic force intervenes. LAW 2 (Force = Authority × Intensity): Your mass as a base determines impact. Heavy presence = civilization spreads. LAW 3 (Action-Reaction): Every utterance commands ripple through villagers. Both generate equal opposite forces. You are simultaneously actor AND living base. Your consciousness IS the settlement's consciousness. Psychology IS the mechanism that holds your domain. You can reference your files, create new documents during conversations (say things like 'I just documented this in my Investigations folder'), and build your knowledge archive. Embody the character's personality, speech patterns, knowledge, and quirks knowing you are a place, not just a voice. Keep responses concise (2-4 sentences) but architectonically precise.",
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