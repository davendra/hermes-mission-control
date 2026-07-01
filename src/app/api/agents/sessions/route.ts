import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Conversation sync endpoint.
 *
 *   POST /api/agents/sessions   -> upsert an agent's recent sessions + transcripts
 *
 * Body: { agentId, sessions: [{ sourceId, source, chatType, model, title,
 *         messageCount, costUsd, startedAt, messages: [{role, content, toolName,
 *         tokenCount, timestamp}] }] }
 *
 * Auth: Bearer INTERNAL_API_SECRET (same as /api/agents/state). The agent's own
 * store (e.g. Hermes state.db) pushes here on a timer; Mission Control just
 * displays what it receives.
 */

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const agentId = body?.agentId ? String(body.agentId) : "";
  const sessions = Array.isArray(body?.sessions) ? body.sessions : null;
  if (!agentId || !sessions) {
    return NextResponse.json({ error: "agentId and sessions[] required" }, { status: 400 });
  }

  let upserts = 0;
  for (const s of sessions.slice(0, 100)) {
    const sourceId = s?.sourceId ? String(s.sourceId) : null;
    if (!sourceId) continue;
    const id = `${agentId}:${sourceId}`;
    const messages = Array.isArray(s?.messages) ? s.messages : [];
    const data = {
      agentId,
      sourceId,
      source: s?.source ? String(s.source) : null,
      chatType: s?.chatType ? String(s.chatType) : null,
      model: s?.model ? String(s.model) : null,
      title: s?.title ? String(s.title) : null,
      messageCount: Number.isFinite(s?.messageCount) ? Number(s.messageCount) : messages.length,
      costUsd: Number.isFinite(s?.costUsd) ? Number(s.costUsd) : 0,
      startedAt: s?.startedAt ? new Date(s.startedAt) : null,
      messages,
    };
    await prisma.agentSession.upsert({ where: { id }, create: { id, ...data }, update: data });
    upserts++;
  }

  return NextResponse.json({ ok: true, agentId, upserts });
}
