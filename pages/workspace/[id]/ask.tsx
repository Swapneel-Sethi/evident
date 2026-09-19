import { useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Err, Skeletons, StatusChip, useWorkspaceState } from "../../../components/ui";

export default function Ask() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state } = useWorkspaceState(id);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: id, query: q }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "query failed");
      setRes(j);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const nameOf = (docId: string) => state?.candidates.find((c: any) => c.id === docId)?.fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ") || docId.slice(0, 8);

  return (
    <Shell workspaceId={id} title="Ask the evidence." subtitle="Search structured candidate evidence using natural language.">
      <Eyebrow>EVIDENCE QUERY</Eyebrow>
      <div style={{ display: "flex", gap: 10 }}>
        <input className="input-d" placeholder="Show candidates with FastAPI project evidence but no AWS evidence."
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Evidence query"
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        <button className="btn-primary" onClick={submit} disabled={busy || !q.trim()}>{busy ? "…" : "ASK →"}</button>
      </div>
      {err && <div style={{ marginTop: 12 }}><Err message={err} retry={submit} /></div>}
      {res && (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {res.results.length === 0 && <div className="card"><p style={{ color: "#9f9fa0" }}>No candidates match under current evidence. Try broadening the query.</p></div>}
          {res.results.map((r: any) => (
            <div key={r.candidateId} className="card">
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{nameOf(r.candidateId)}</div>
              {r.detail.map((d: any, i: number) => (
                <div key={i} style={{ padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <b className="font-mono-d" style={{ fontSize: 12 }}>{d.skill.toUpperCase()}</b>
                    <StatusChip status={d.status} />
                  </div>
                  {d.snippet && <div className="quote" style={{ marginTop: 6 }}>“{d.snippet}”</div>}
                  <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 4 }}>SOURCE / {d.source}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
