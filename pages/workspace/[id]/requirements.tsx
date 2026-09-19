import { useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Empty, Err, Skeletons, useWorkspaceState } from "../../../components/ui";

export default function Requirements() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [open, setOpen] = useState<string | null>(null);

  if (loading) return <Shell workspaceId={id} title="Role Requirements"><Skeletons n={4} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Role Requirements"><Err message="Failed to load requirements." retry={reload} /></Shell>;
  if (!state.analyzed) return <Shell workspaceId={id} title="Role Requirements"><Empty title="No requirements yet" body="Analyze a job description first." /></Shell>;

  return (
    <Shell workspaceId={id} title="Role Requirements"
      subtitle="The criteria EVIDENT uses to organize candidate evidence.">
      <Eyebrow>REQUIREMENTS / {String(state.requirements.length).padStart(2, "0")}</Eyebrow>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="font-mono-d" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "14px 24px", fontSize: 11, color: "#6a6b6b", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span>REQUIREMENT</span><span>CATEGORY</span><span>IMPORTANCE</span><span>COVERAGE</span>
        </div>
        {state.requirements.map((r: any) => {
          const cov = state.candidates.flatMap((c: any) => c.evidence).filter((e: any) => e.req_key === r.req_key);
          const backed = cov.filter((e: any) => e.status === "EVIDENCE FOUND" || e.status === "SUPPORTED BY INTERVIEW").length;
          const val = cov.filter((e: any) => e.status === "NEEDS VALIDATION" || e.status === "PARTIAL EVIDENCE").length;
          return (
            <div key={r.req_key} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setOpen(open === r.req_key ? null : r.req_key)}
                style={{ width: "100%", background: "none", border: "none", color: "inherit", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "16px 24px", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
                <b>{r.name}</b>
                <span className="font-mono-d" style={{ fontSize: 11, color: "#9f9fa0" }}>{(r.category || "").toUpperCase()}</span>
                <span className="chip" style={{ color: r.importance === "preferred" ? "#9f9fa0" : "#f5f5f7", justifySelf: "start" }}>{(r.importance || "").toUpperCase()}</span>
                <span className="font-mono-d" style={{ fontSize: 11, color: "#cacaca" }}>{backed} BACKED · {val} VALIDATE</span>
              </button>
              {open === r.req_key && (
                <div style={{ padding: "0 24px 20px 24px", fontSize: 14, color: "#cacaca" }}>
                  {r.description && <p style={{ marginTop: 0 }}>{r.description}</p>}
                  {cov.slice(0, 4).map((e: any, i: number) => (
                    <div key={i} className="quote" style={{ marginBottom: 8 }}>
                      <span className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b" }}>{e.status} — </span>
                      {e.claim || "No claim recorded."}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
