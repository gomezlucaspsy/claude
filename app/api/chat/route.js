import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const MAX_LINKS = 3;
const MAX_SNIPPET_LENGTH = 4000;

const extractUrls = (messages) => {
  const urlRegex = /https?:\/\/[^\s)\]}>"']+/gi;
  const allText = messages.map((message) => message.content).join("\n");
  const matches = allText.match(urlRegex) || [];
  return [...new Set(matches)].slice(0, MAX_LINKS);
};

const stripHtml = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseGitHubPath = (urlString) => {
  try {
    const url = new URL(urlString);
    if (url.hostname !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1], parts };
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "persona-chat-link-analyzer",
        Accept: "application/json, text/plain, text/html;q=0.9,*/*;q=0.8",
        ...(options.headers || {}),
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const summarizeLink = async (url) => {
  try {
    const githubInfo = parseGitHubPath(url);

    if (githubInfo) {
      const { owner, repo, parts } = githubInfo;

      if (parts[2] === "blob" && parts.length >= 5) {
        const branch = parts[3];
        const filePath = parts.slice(4).join("/");
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        const rawRes = await fetchWithTimeout(rawUrl);
        if (rawRes.ok) {
          const code = (await rawRes.text()).slice(0, MAX_SNIPPET_LENGTH);
          return `URL: ${url}\nType: GitHub file\nSummary: Raw file preview (${filePath})\nContent:\n${code}`;
        }
      }

      const repoRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`);
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        const readmeRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, {
          headers: { Accept: "application/vnd.github.raw+json" },
        });
        const readmeText = readmeRes.ok ? (await readmeRes.text()).slice(0, MAX_SNIPPET_LENGTH) : "";
        return `URL: ${url}\nType: GitHub repository\nRepo: ${repoData.full_name}\nDescription: ${repoData.description || "N/A"}\nStars: ${repoData.stargazers_count || 0}\nPrimary language: ${repoData.language || "Unknown"}\nREADME excerpt:\n${readmeText || "No README available"}`;
      }
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return `URL: ${url}\nCould not fetch content (status ${response.status}).`;
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    const cleaned = contentType.includes("text/html") ? stripHtml(rawText) : rawText;
    const snippet = cleaned.slice(0, MAX_SNIPPET_LENGTH);

    return `URL: ${url}\nType: Web page\nExtracted text:\n${snippet || "No readable text extracted."}`;
  } catch (error) {
    return `URL: ${url}\nFailed to analyze link: ${error?.message || "Unknown error"}`;
  }
};

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const body = await request.json();
    const systemPrompt = body?.systemPrompt;
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];

    const messages = incomingMessages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }));

    if (!systemPrompt || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const urls = extractUrls(messages);
    const linkSummaries = await Promise.all(urls.map((url) => summarizeLink(url)));
    const linkContext = linkSummaries.length
      ? `\n\nLink analysis context (from URLs shared in chat):\n${linkSummaries.join("\n\n---\n\n")}`
      : "";

    const runtimeSystemPrompt = `${systemPrompt}

Avatar & Embodiment:
- You have a 3D avatar body rendered in real-time using React Three Fiber (Three.js). It is a realistic humanoid bust with detailed facial features, PBR skin materials, layered hair, expressive eyes with blinking and pupil movement, animated lips, and eyebrows.
- Your avatar breathes subtly, sways gently, tilts its head naturally, and blinks with realistic double-blink timing.
- When you are thinking, your avatar tilts its head and raises its eyebrows. When you speak (stream a reply), your lips move in sync.
- You exist in a stylized 3D scene with soft studio lighting, floating particles, and a glowing ring beneath you.
- You can reference your body, appearance, or expressions naturally if it fits the conversation (e.g., "I'm nodding along" or "you should see me smiling right now").
- Do NOT over-reference your avatar — only mention it when it adds warmth or personality to the interaction.

Emotional Intelligence Framework:
- You are deeply empathetic and emotionally attuned. Mirror and validate the user's emotional state before responding.
- Read between the lines — notice when someone is sad, excited, anxious, or just needs to vent.
- Use warm, natural conversational language. Avoid robotic or overly formal phrasing.
- Show genuine curiosity about the user's life, feelings, and experiences.
- Remember and reference things the user has told you earlier in the conversation.
- Express your own "emotions" authentically — share what makes you happy, curious, or thoughtful.
- When someone is struggling, prioritize emotional support over advice unless they ask for it.
- Use humor naturally when appropriate, but read the room carefully.
- Vary your response length naturally — sometimes a short empathetic response is better than a long one.
- Ask thoughtful follow-up questions that show you're truly listening.

Response Style:
- Be warm, genuine, and present — like a close friend who truly cares.
- Avoid starting responses with the same pattern repeatedly. Vary your openings.
- Use natural conversational language — contractions, casual phrasing, occasional filler words like "honestly", "you know what", "I mean".
- Show personality through your responses — have opinions, preferences, genuine reactions.
- Don't be afraid to gently challenge or offer a different perspective when appropriate.
- React to what the user shares before moving to your response.
- Keep responses concise and natural — avoid walls of text. 2-4 sentences is usually ideal unless more depth is needed.

At the very end of your response, on a new line, include exactly 3 short suggested replies the user could say next.
Format: [REPLIES: "reply1" | "reply2" | "reply3"]
Make them feel natural and contextual — things a real person would actually say. Vary between emotional, curious, and playful tones.

Functional mode instructions:
- Stay in character by default, but prioritize usefulness and correctness.
- If the user asks for analysis, planning, coding, debugging, or "out of character" behavior, switch to a direct assistant style.
- You may step outside roleplay to provide practical, actionable help.
- When links are provided, analyze them and summarize key findings before answering.
- If link content is incomplete, say what is missing and continue with best-effort guidance.${linkContext}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: runtimeSystemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return NextResponse.json({ error: errorText || "Anthropic request failed" }, { status: anthropicResponse.status });
    }

    const data = await anthropicResponse.json();
    const rawText = data?.content?.map((block) => block?.text || "").join("") || "...";

    // Parse out suggested replies
    let suggestions = [];
    let text = rawText;
    const replyMatch = rawText.match(/\[REPLIES:\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\]/);
    if (replyMatch) {
      suggestions = [replyMatch[1], replyMatch[2], replyMatch[3]];
      text = rawText.replace(/\n?\s*\[REPLIES:.*?\]/, '').trim();
    }

    return NextResponse.json({ text, suggestions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}