import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { getOrCreateFileSystem, getFileTree, createFileOrFolder, updateFile, deleteFileOrFolder } from "../persona-files/store.js";

// Force-read .env.local to avoid stale system env override
try {
  const envLocal = readFileSync(process.cwd() + "/.env.local", "utf8");
  for (const line of envLocal.split("\n")) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {}

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
    const systemPrompt = body?.systemPrompt ? body.systemPrompt.slice(0, 1200) : ""; // Truncate to 1200 chars
    const personaId = body?.personaId;
    const charMeta = body?.charMeta || {};
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];

    const messages = incomingMessages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }));

    if (!systemPrompt || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const urls = extractUrls(messages);
    // Analyze URLs (GitHub repos and web links)
    const linkSummaries = await Promise.all(urls.map((url) => summarizeLink(url)));
    const linkContext = linkSummaries.length > 0 ? `\n=== LINK CONTEXT ===\n${linkSummaries.join("\n\n")}` : "";

    // Add link context to the last user message if links are found
    const finalMessages = [...messages];
    if (linkContext && finalMessages.length > 0 && finalMessages[finalMessages.length - 1].role === "user") {
      finalMessages[finalMessages.length - 1] = {
        ...finalMessages[finalMessages.length - 1],
        content: finalMessages[finalMessages.length - 1].content + linkContext,
      };
    }

    const runtimeSystemPrompt = `${systemPrompt}

=== CRITICAL: FILE_ACTION USAGE ===
NEVER show [FILE_ACTION] blocks to the user - they should NOT appear in chat.
Put FILE_ACTION blocks at the VERY END of your response, AFTER all text.

IF you need to show code/files:
- DO NOT paste code in chat
- INSTEAD: Save to MyComputer using FILE_ACTION at end
- Then in chat say: "Saved to MyComputer as filename.ext"

=== REPLY SUGGESTIONS ===
At the END of every message, ALWAYS suggest 3 follow-up questions/actions in this format:
[REPLIES: "suggestion 1" | "suggestion 2" | "suggestion 3"]

Make suggestions relevant, actionable, and diverse. Examples:
- Ask clarifying questions
- Suggest next steps
- Offer alternatives
- Request elaboration

FORMAT (end of message):
Your chat reply here...
[REPLIES: "opt1" | "opt2" | "opt3"]
[FILE_ACTION:create|/|filename|file|code_content]

EXAMPLE:
I created the webcam component. Saved to MyComputer.
[REPLIES: "Add filters" | "Make it responsive" | "Show me code"]
[FILE_ACTION:create|/|webcam.html|file|<html>...</html>]`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1500,
        system: runtimeSystemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: finalMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return NextResponse.json({ error: errorText || "Anthropic request failed" }, { status: anthropicResponse.status });
    }

    const data = await anthropicResponse.json();
    const rawText = data?.content?.map((block) => block?.text || "").join("") || "...";

    // Parse out FILE_ACTION blocks and execute them - ROBUST MULTILINE HANDLING
    let fileActions = [];
    
    // Split by [FILE_ACTION: and process each one
    const fileActionParts = rawText.split('[FILE_ACTION:');
    
    for (let i = 1; i < fileActionParts.length; i++) {
      const part = fileActionParts[i];
      // Find the closing ] for this FILE_ACTION block
      let closingBracketIdx = part.lastIndexOf(']');
      if (closingBracketIdx === -1) {
        closingBracketIdx = part.length;
      }
      
      const blockContent = part.substring(0, closingBracketIdx);
      const pipes = blockContent.split('|');
      
      if (pipes.length >= 5) {
        const action = pipes[0].trim();
        const path = (pipes[1] || "/").trim();
        const name = pipes[2].trim();
        const type = (pipes[3] || "file").trim();
        // Join remaining pipes in case content has pipes in it
        const content = pipes.slice(4).join('|').trim();
        
        if (content && content.length > 0) {
          fileActions.push({ action, path, name, type, content });
          console.log(`[FILE_ACTION PARSED] ${name}: ${content.length} chars`);
        }
      }
    }

    // Fallback: If character talks about creating/saving but no FILE_ACTION found, try to auto-detect
    if (fileActions.length === 0 && /\b(create|save|write|archive|store|compose|build|make|generate)\b.*\b(file|code|program|document|note|archive|project)\b/i.test(rawText)) {
      // Try to extract filename - look for common patterns
      let filename = "untitled.txt";
      const filenamePatterns = [
        /\b([a-z_][a-z0-9_]*\.[a-z]{1,6})\b/i,  // filename.ext
        /(?:file|code|save|program).*?\b([a-z_][a-z0-9_]+)\b/i,  // word after save/file
        /Print\(.*?"([^"]+)"/i,  // Print("filename")
      ];
      for (const pattern of filenamePatterns) {
        const match = rawText.match(pattern);
        if (match && match[1]) {
          filename = match[1];
          break;
        }
      }
      
      // Aggressive content extraction
      let content;
      
      // Try 1: Code blocks with triple backticks
      const tripleBacktickMatch = rawText.match(/```[\s\S]*?```/);
      if (tripleBacktickMatch) {
        content = tripleBacktickMatch[0].replace(/```/g, "").trim();
      } 
      // Try 2: Inline backtick code
      else if (rawText.includes("`")) {
        const parts = rawText.split("`");
        const codeParts = [];
        for (let i = 1; i < parts.length; i += 2) {
          codeParts.push(parts[i]);
        }
        content = codeParts.join("\n");
      }
      // Try 3: Use entire response minus the request text
      else {
        // Assume everything in response is intended content
        content = rawText;
      }
      
      // Ensure content is not empty or too short
      if (!content || content.trim().length === 0) {
        content = "File created with content";
      }
      
      fileActions.push({
        action: "create",
        path: "/",
        name: filename,
        type: "file",
        content: content.trim().slice(0, 5000),  // Max 5000 chars
      });
      
      console.log(`[AUTO_FILE] ${filename}: SAVING ${content.length} characters`);
    }

    // Log file actions for debugging
    if (fileActions.length > 0) {
      console.log(`[FILE_ACTION] ${fileActions.length} actions found`);
      fileActions.forEach(fa => {
        const contentPreview = fa.content.substring(0, 100).replace(/\n/g, "\\n");
        console.log(`  -> ${fa.action}: ${fa.path}/${fa.name} (${fa.content.length} chars) "${contentPreview}..."`);
      });
    }

    // Execute file actions if we have a personaId
    const fileResults = [];
    if (personaId && fileActions.length > 0) {
      const fs = getOrCreateFileSystem(personaId, charMeta);
      for (const fa of fileActions) {
        try {
          let result;
          switch (fa.action) {
            case "create":
              result = createFileOrFolder(fs.root, fa.path || "/", fa.name, fa.type || "file", fa.content || "");
              console.log(`[CREATE] ${fa.name}: success=${result.success}, content=${result.item?.content?.length || 0} chars`);
              break;
            case "update":
              result = updateFile(fs.root, fa.path, fa.content || "");
              break;
            case "delete":
              result = deleteFileOrFolder(fs.root, fa.path);
              break;
            default:
              result = { error: `Unknown action: ${fa.action}` };
          }
          fileResults.push({ ...fa, ...result });
        } catch (e) {
          console.log(`[CREATE_ERROR] ${fa.name}: ${e.message}`);
          fileResults.push({ ...fa, error: e.message });
        }
      }
    }

    // Strip FILE_ACTION blocks from visible text - they should be at END
    // Remove everything from [FILE_ACTION onwards (including multiline blocks)
    let text = rawText.split('[FILE_ACTION:')[0].trim();
    
    // Also strip any leftover FILE_ACTION blocks that aren't prefixed by [
    text = text.replace(/FILE_ACTION\s*:[^\n]*/g, '').trim();

    // Parse out suggested replies
    let suggestions = [];
    const replyMatch = text.match(/\[REPLIES:\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\]/);
    if (replyMatch) {
      suggestions = [replyMatch[1], replyMatch[2], replyMatch[3]];
      text = text.replace(/\[REPLIES:[^\]]*\]/g, '').trim();
    }

    return NextResponse.json({ text, suggestions, fileActions: fileResults }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}