import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

type Activity = { timestamp?: string; message?: string };

function StatusDot({ status }: { status: string }) {
  const color =
    status === "online" || status === "working"
      ? "bg-emerald-500"
      : status === "error"
      ? "bg-red-500"
      : status === "idle"
      ? "bg-amber-500"
      : "bg-zinc-600";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const agent = await prisma.agentState.findUnique({ where: { id } }).catch(() => null);
  if (!agent) notFound();

  const missions = await prisma.mission
    .findMany({ where: { agentId: id }, orderBy: { createdAt: "desc" } })
    .catch(() => []);

  const activity: Activity[] = Array.isArray(agent.recentActivity)
    ? (agent.recentActivity as Activity[])
    : [];

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All agents
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.emoji || "🤖"}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{agent.name}</h1>
              <StatusDot status={agent.status} />
              <span className="text-[13px] text-[var(--ink-3)]">{agent.status}</span>
            </div>
            <div className="text-[13px] text-[var(--ink-2)]">
              {agent.role || "—"} · {agent.currentTask || "idle"}
            </div>
          </div>
        </div>

        {agent.dashboardUrl ? (
          <a
            href={agent.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            Open live console <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="shrink-0 text-[12px] text-[var(--ink-3)] max-w-[180px] text-right">
            No live console linked. Agents report one via <code>dashboardUrl</code>.
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Tasks completed" value={agent.tasksCompleted.toLocaleString()} />
        <Stat label="Total cost" value={`$${(agent.totalCost || 0).toFixed(2)}`} />
        <Stat
          label="Last active"
          value={agent.lastActive ? new Date(agent.lastActive).toLocaleString() : "never"}
        />
      </div>

      <h2 className="text-[16px] font-semibold mb-3">Recent activity</h2>
      <div
        className="rounded-xl mb-8 divide-y"
        style={{ background: "var(--panel)", border: "1px solid var(--line)", borderColor: "var(--line)" }}
      >
        {activity.length === 0 && (
          <div className="p-4 text-[13px] text-[var(--ink-3)]">
            No activity reported yet. The agent posts entries in each heartbeat.
          </div>
        )}
        {activity
          .slice()
          .reverse()
          .map((a, i) => (
            <div key={i} className="p-3 flex gap-3 text-[13px]" style={{ borderColor: "var(--line)" }}>
              <span className="text-[var(--ink-3)] shrink-0 tabular-nums">
                {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : "—"}
              </span>
              <span className="text-[var(--ink-2)]">{a.message}</span>
            </div>
          ))}
      </div>

      <h2 className="text-[16px] font-semibold mb-3">Missions</h2>
      <div className="flex flex-col gap-2">
        {missions.length === 0 && (
          <div className="p-4 text-[13px] text-[var(--ink-3)]">No missions for this agent.</div>
        )}
        {missions.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-xl"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px]">{m.title}</div>
                <div className="text-[12px] text-[var(--ink-3)]">{m.priority} priority</div>
              </div>
              <div className="text-[12px] text-[var(--ink-2)]">{m.status}</div>
            </div>
            {m.result && (
              <pre
                className="mt-3 p-3 rounded-lg text-[12px] whitespace-pre-wrap overflow-x-auto"
                style={{ background: "#000", color: "var(--ink-2)" }}
              >
                {m.result}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
      <div className="text-[11px] uppercase tracking-wider text-[var(--ink-3)] mb-1">{label}</div>
      <div className="text-[18px] font-semibold">{value}</div>
    </div>
  );
}
