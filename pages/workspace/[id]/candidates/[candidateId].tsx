import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Shell, Eyebrow, Err, Skeletons, StatusChip, initials, useWorkspaceState } from "../../../../components/ui";

export default function Dossier() {
  const router = useRouter();
  const { id, candidateId } = router.query as { id: string; candidateId: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [tab, setTab] = useState<"evidence" | "interview" | "report" | "source">("evidence");

  if (loading) return <Shell workspaceId={id} title="Dossier"><Skeletons n={4} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Dossier"><Err message="Failed to load dossier." retry={reload} /></Shell>;
  const cand = state.candidates.find((c: any) => c.id === candidateId);
  if (!cand) return <Shell workspaceId={id} title="Dossier"><Err message="Candidate not found in this workspace." retry={reload} /></Shell>;

  const name = cand.displayName;
  const interviews = state.interviews.filter((x: any) => x.candidate_doc_id === candidateId);

  return (
    <Shell workspaceId={id} title={name} subtitle={state.workspace?.title || "Hiring workspace"}>
      <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", marginBottom: 4 }}>DOCUMENT / {cand.fileName}</div>
      <div style={{ display: "flex", gap: 16, margin: "12px 0 20px 0", flexWrap: "wrap" }} className="font-mono-d">
        <span style={{ fontSize: 13 }}><b>{cand.groups.found}</b> EVIDENCE FOUND</span>
        <span style={{ fontSize: 13 }}><b>{cand.groups.review}</b> NEEDS REVIEW</span>
        <span style={{ fontSize: 13 }}><b>{cand.groups.none}</b> NO EVIDENCE</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {(["evidence", "interview", "report", "source"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background: "none", border: "none", color: tab === t ? "#fff" : "#9f9fa0", fontSize: 14, padding: "10px 14px", cursor: "pointer", borderBottom: tab === t ? "2px solid #fff" : "2px solid transparent" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "evidence" && (
        <>
        <div className="card">
          <Eyebrow>INTERVIEW EVIDENCE / {interviews.length}</Eyebrow>
          {interviews.length === 0 && <p style={{ color: "#6a6b6b", fontSize: 14 }}>No interview evidence recorded yet.</p>}
          {interviews.map((x: any, i: number) => (
            <div key={x.id} style={{ padding: "8px 0", borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: 14 }}>
              <div className="font-mono-d" style={{ fontSize: 11, color: "#847dff" }}>{(x.req_key || "").toUpperCase()} · {new Date(x.created_at).toLocaleString("en-GB")}</div>
              <div style={{ marginTop: 4 }}><b>Q:</b> {x.question}</div>
              <div className="quote" style={{ marginTop: 6 }}>“{(x.analysis?.evidence || x.answer || "").slice(0, 300)}”</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <Eyebrow>DOCUMENT EVIDENCE</Eyebrow>
          {cand.evidence.map((e: any) => (
            <div key={e.req_key} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="font-mono-d" style={{ fontSize: 13, letterSpacing: "0.08em" }}>{e.requirement.toUpperCase()}</span>
                <StatusChip status={e.status} />
              </div>
              {e.claim ? <div className="quote" style={{ marginTop: 12 }}>“{e.claim}”</div>
                : <p style={{ color: "#6a6b6b", fontSize: 14 }}>No claim recorded in supplied documents.</p>}
              <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", marginTop: 10 }}>SOURCE / {e.source || cand.fileName}</div>
              {e.observation && <p style={{ fontSize: 14, color: "#cacaca" }}>{e.observation}</p>}
              {(e.status === "NEEDS VALIDATION" || e.status === "PARTIAL EVIDENCE") && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: "#9f9fa0" }}>What remains uncertain: {e.question || "depth of experience."}</div>
                  <button className="btn-secondary" style={{ marginTop: 8 }}
                    onClick={() => router.push(`/workspace/${id}/interview/${cand.id}?req=${encodeURIComponent(e.req_key)}`)}>
                    VALIDATE IN INTERVIEW →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      {tab === "interview" && (
        <div style={{ display: "grid", gap: 12 }}>
          {cand.gaps.length === 0 && <div className="card"><p style={{ color: "#9f9fa0" }}>No open validation gaps for this candidate.</p></div>}
          {cand.gaps.map((e: any) => (
            <div key={e.req_key} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="font-mono-d" style={{ fontSize: 12 }}>{e.requirement.toUpperCase()}</div>
                <div style={{ fontSize: 14, color: "#cacaca" }}>{e.question || "Prepare a targeted validation question."}</div>
              </div>
              <button className="btn-primary" onClick={() => router.push(`/workspace/${id}/interview/${cand.id}?req=${encodeURIComponent(e.req_key)}`)}>INTERVIEW →</button>
            </div>
          ))}
          {interviews.length > 0 && (
            <div className="card">
              <Eyebrow>SESSION HISTORY / {interviews.length}</Eyebrow>
              {interviews.map((x: any, i: number) => (
                <details key={x.id} style={{ padding: "8px 0", borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <summary style={{ fontSize: 14, cursor: "pointer" }}>
                    <span className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b" }}>Q{String(i + 1).padStart(2, "0")} · </span>{x.question}
                  </summary>
                  <div className="quote" style={{ marginTop: 8 }}>“{x.answer}”</div>
                  {x.analysis?.notes && <div style={{ fontSize: 13, color: "#9f9fa0", marginTop: 6 }}>Analysis: {x.analysis.notes}</div>}
                  {x.follow_up && <div style={{ fontSize: 13, color: "#00b3dd", marginTop: 4 }}>Follow-up: {x.follow_up}</div>}
                  <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 4 }}>{new Date(x.created_at).toLocaleString("en-GB")}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "report" && (
        <div className="card">
          <Eyebrow>SUMMARY</Eyebrow>
          <p style={{ fontSize: 15 }}>{cand.groups.found} of {cand.evidence.length} requirements contain supporting evidence. {cand.groups.review} need review, {cand.groups.none} have no evidence in supplied documents.</p>
          <Link href={`/workspace/${id}/report/${cand.id}`} className="btn-primary" style={{ textDecoration: "none", marginTop: 8 }}>OPEN EVIDENCE REPORT →</Link>
        </div>
      )}

      {tab === "source" && (
        <div className="card">
          <Eyebrow>SOURCE DOCUMENTS</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#3f4041", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{initials(name)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{cand.fileName}</div>
              <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b" }}>PARSED AND GROUNDED · EVIDENCE QUOTES ABOVE COME FROM THIS FILE</div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
