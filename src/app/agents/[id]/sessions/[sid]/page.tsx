import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Msg = {
  role?: string;
  content?: string;
  toolName?: string;
  tokenCount?: number;
  timestamp?: string;
};

const ROLE_STYLE: Record<string, { label: string; accent: string }> = {
  user: { label: "User", accent: "#3b82f6" },
  assistant: { label: "Assistant", accent: "var(--accent)" },
  tool: { label: "Tool", accent: "#a78bfa" },
  system: { label: "System", accent: "#6b7280" },
};

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id, sid } = await params;
  const sourceId = decodeURIComponent(sid);

  const session = await prisma.agentSession
    .findUnique({ where: { id: `${id}:${sourceId}` } })
    .catch(() => null);
  if (!session) notFound();

  const messages: Msg[] = Array.isArray(session.messages) ? (session.messages as Msg[]) : [];

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <Link
        href={`/agents/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to agent
      </Link>

      <h1 className="text-[24px] font-semibold tracking-[-0.02em] mb-1">
        {session.title || "(untitled conversation)"}
      </h1>
      <p className="text-[13px] text-[var(--ink-3)] mb-8">
        {session.source || "?"}
        {session.chatType ? `/${session.chatType}` : ""} · {messages.length} messages
        {session.model ? ` · ${session.model}` : ""} · ${(session.costUsd || 0).toFixed(2)}
      </p>

      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-[13px] text-[var(--ink-3)]">No messages in this conversation.</div>
        )}
        {messages.map((m, i) => {
          const role = (m.role || "").toLowerCase();
          const style = ROLE_STYLE[role] || { label: m.role || "?", accent: "var(--line)" };
          return (
            <div
              key={i}
              className="p-3 rounded-xl"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderLeft: `2px solid ${style.accent}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[11px] uppercase tracking-wider font-medium"
                  style={{ color: style.accent }}
                >
                  {style.label}
                </span>
                {m.toolName && (
                  <span className="text-[11px] text-[var(--ink-3)]">· {m.toolName}</span>
                )}
                {m.timestamp && (
                  <span className="text-[11px] text-[var(--ink-3)] ml-auto tabular-nums">
                    {new Date(m.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-[var(--ink)]">
                {m.content || <span className="text-[var(--ink-3)] italic">(no text content)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
