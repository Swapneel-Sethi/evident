import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Shell, Eyebrow, Empty, Err, Skeletons, initials, useWorkspaceState } from "../../../components/ui";

export default function Candidates() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "validate" | "found" | "none">("all");

  if (loading) return <Shell workspaceId={id} title="Candidates"><Skeletons n={3} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Candidates"><Err message="Failed to load candidates." retry={reload} /></Shell>;

  const list = state.candidates.filter((c: any) => {
    if (q && !c.fileName.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "validate") return c.groups.review > 0;
    if (filter === "found") return c.groups.found > 0;
    if (filter === "none") return c.groups.none > 0;
    return true;
  });

  return (
    <Shell workspaceId={id} title="What is actually supported?"
      subtitle="Evidence coverage across the current role requirements.">
      <Eyebrow>CANDIDATES</Eyebrow>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input-d" style={{ maxWidth: 320 }} placeholder="Search candidates" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search candidates" />
        {(["all", "validate", "found", "none"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? "rgba(255,255,255,0.1)" : "transparent", color: filter === f ? "#fff" : "#9f9fa0", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer" }}>
            {f === "all" ? "ALL" : f === "validate" ? "NEEDS VALIDATION" : f === "found" ? "EVIDENCE FOUND" : "NO EVIDENCE"}
          </button>
        ))}
      </div>
      {list.length === 0 && <Empty title="No candidate evidence yet" body="Add candidate documents to begin." action={<button className="btn-primary" onClick={() => router.push(`/workspace/${id}`)}>ADD DOCUMENTS →</button>} />}
      <div style={{ display: "grid", gap: 12 }}>
        {list.map((c: any) => (
          <Link key={c.id} href={`/workspace/${id}/candidates/${c.id}`} style={{ textDecoration: "none" }}>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#00b3dd", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{initials(c.displayName)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.displayName}</div>
                <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b" }}>{c.groups.found} FOUND · {c.groups.review} NEEDS REVIEW · {c.groups.none} NO EVIDENCE</div>
                <div className="font-mono-d" style={{ fontSize: 10, color: "#4a4b4b" }}>FILE / {c.fileName}</div>
              </div>
              <span className="font-mono-d" style={{ color: "#00b3dd", fontSize: 13 }}>REVIEW EVIDENCE →</span>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
