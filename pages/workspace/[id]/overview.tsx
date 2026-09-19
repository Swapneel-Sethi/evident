import { useRouter } from "next/router";
import Link from "next/link";
import { Shell, Eyebrow, Stat, StatusChip, Empty, Err, Skeletons, Timeline, fmtTime, initials, useWorkspaceState } from "../../../components/ui";

export default function Overview() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, loading, error, reload } = useWorkspaceState(id);

  if (loading) return <Shell workspaceId={id} title="Overview"><Skeletons n={4} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Overview"><Err message="Workspace failed to load. Your files are safe." retry={reload} /></Shell>;
  if (!state.analyzed) {
    return (
      <Shell workspaceId={id} title="Overview">
        <Empty title="Run analysis first" body="Upload documents and analyze evidence to populate this workspace."
          action={<button className="btn-primary" onClick={() => router.push(`/workspace/${id}`)}>GO TO INGEST →</button>} />
      </Shell>
    );
  }

  return (
    <Shell workspaceId={id} title="Evidence before judgment."
      subtitle="Every candidate claim mapped back to the role and its source."
      actions={<>
        <button className="btn-secondary" onClick={() => router.push(`/workspace/${id}`)}>ADD CANDIDATES</button>
        <button className="btn-primary" onClick={() => router.push(`/workspace/${id}/matrix`)}>EVIDENCE MAP →</button>
      </>}>
      <Eyebrow>WORKSPACE OVERVIEW</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Stat value={String(state.stats.candidates).padStart(2, "0")} label="CANDIDATES" />
        <Stat value={String(state.stats.requirements).padStart(2, "0")} label="ROLE REQUIREMENTS" />
        <Stat value={String(state.stats.signals).padStart(2, "0")} label="SOURCE-BACKED SIGNALS" inverted />
        <Stat value={String(state.stats.gaps).padStart(2, "0")} label="VALIDATION GAPS" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }} className="ovgrid-d">
        <div className="card">
          <Eyebrow>CANDIDATE EVIDENCE</Eyebrow>
          {state.candidates.map((c: any) => (
            <Link key={c.id} href={`/workspace/${id}/candidates/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#3f4041", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{initials(c.fileName.replace(/\.[^.]+$/, "").replace(/_/g, " "))}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ")}</div>
                  <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b" }}>DOCUMENT / {c.fileName}</div>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span><b className="font-mono-d">{c.counts.found + c.counts.interview}</b> <span className="font-mono-d" style={{ fontSize: 10, color: "#9f9fa0" }}>FOUND</span></span>
                  <span><b className="font-mono-d">{c.counts.validate}</b> <span className="font-mono-d" style={{ fontSize: 10, color: "#9f9fa0" }}>VALIDATE</span></span>
                  <span className="font-mono-d" style={{ color: "#00b3dd" }}>REVIEW →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="card">
          <Eyebrow>SESSION ACTIVITY</Eyebrow>
          <Timeline events={state.activity.slice(0, 8).map((a: any) => ({
            id: a.id, time: fmtTime(a.created_at),
            title: (a.event_type || "").replace(/_/g, " "),
            body: a.payload?.requirements ? `${a.payload.requirements} requirements` : a.payload?.candidates ? `${a.payload.candidates} candidates` : undefined,
          }))} />
        </div>
      </div>
      <style jsx>{`@media (max-width: 900px) { .ovgrid-d { grid-template-columns: 1fr !important; } }`}</style>
    </Shell>
  );
}
