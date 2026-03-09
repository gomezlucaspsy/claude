import { NextResponse } from "next/server";

// Lazily instantiate Redis only when env vars are present.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your Vercel project
// (Storage → Upstash Redis → Connect, then "Pull env vars").
const getRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
};

const MAX_MESSAGES = 300;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const charId = searchParams.get("charId");
  if (!charId) return NextResponse.json({ messages: [] });

  const redis = getRedis();
  if (!redis) return NextResponse.json({ messages: [], error: "DB not configured" });

  try {
    const data = await redis.get(`history:${charId}`);
    const messages = Array.isArray(data) ? data : [];
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { charId, messages } = body;
  if (!charId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing charId or messages" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false, error: "DB not configured" });

  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    await redis.set(`history:${charId}`, trimmed);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const charId = searchParams.get("charId");
  if (!charId) return NextResponse.json({ error: "Missing charId" }, { status: 400 });

  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false, error: "DB not configured" });

  try {
    await redis.del(`history:${charId}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
