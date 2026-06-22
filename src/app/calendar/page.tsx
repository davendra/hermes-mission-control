export default function CalendarPage() {
  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] mb-2">Calendar</h1>
      <p className="text-[var(--ink-2)] mb-8">
        Scheduled work across all your agents. Wire this to whatever scheduling system you prefer
        (Google Calendar, a cron table, your own db model).
      </p>
      <div
        className="p-8 rounded-xl text-center text-[var(--ink-3)]"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        Coming soon. Tell your Hermes agent to build this next.
      </div>
    </div>
  );
}
