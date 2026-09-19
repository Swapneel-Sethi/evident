import { useRouter } from "next/router";
import { Shell, Eyebrow, Err, Skeletons, StatusChip, Timeline, fmtTime, useWorkspaceState } from "../../../../components/ui";

export default function Report() {
  const router = useRouter();
  const { id, candidateId } = router.query as { id: string; candidateId: string };
  const { state, loading, error, reload } = useWorkspaceState(id);

  if (loading) return <Shell workspaceId={id} title="Evidence Report"><Skeletons n={4} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Evidence Report"><Err message="Failed to load report." retry={reload} /></Shell>;
  const cand = state.candidates.find((c: any) => c.id === candidateId);
  if (!cand) return <Shell workspaceId={id} title="Evidence Report"><Err message="Candidate not found." retry={reload} /></Shell>;

  const name = cand.displayName;
  const totalReqsCount = state.requirements.length || cand.evidence.length;
  const supported = cand.evidence.filter((e: any) => e.status === "EVIDENCE FOUND" || e.status === "SUPPORTED BY INTERVIEW");
  const sourceBacked = cand.evidence.filter((e: any) => e.status === "EVIDENCE FOUND");
  const needingValidation = cand.evidence.filter((e: any) => e.status === "NEEDS VALIDATION" || e.status === "PARTIAL EVIDENCE" || e.status === "CONFLICTING INFORMATION");
  const noEvidence = cand.evidence.filter((e: any) => e.status === "NO EVIDENCE FOUND");

  const candidateInterviews = state.interviews.filter((x: any) => x.candidate_doc_id === candidateId);
  const related = state.activity.filter((a: any) =>
    JSON.stringify(a.payload || "").includes(candidateId) || ["evidence_mapped", "analysis_complete"].includes(a.event_type)).slice(0, 10);

  return (
    <Shell workspaceId={id} title="Evidence Report" subtitle={`${name} / ${state.workspace?.title || ""}`}
      actions={<button className="btn-secondary" onClick={() => window.print()}>PRINT →</button>}>
      <div className="card-lg" style={{ display: "grid", gap: 20 }}>
        <section>
          <Eyebrow>ROLE REQUIREMENTS</Eyebrow>
          <p style={{ fontSize: 14, color: "#cacaca" }}>{supported.length} of {totalReqsCount} requirements contain supporting evidence. This is evidence coverage, not a hiring recommendation.</p>
        </section>

        <section>
          <Eyebrow>SOURCE-BACKED EVIDENCE</Eyebrow>
          {sourceBacked.length === 0 && <p style={{ color: "#6a6b6b", fontSize: 14 }}>None recorded.</p>}
          {sourceBacked.map((e: any) => (
            <div key={e.req_key || e.reqKey} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <b style={{ fontSize: 14 }}>{e.requirement}</b><StatusChip status={e.status} />
              </div>
              {e.claim && <div className="quote" style={{ marginTop: 8 }}>“{e.claim}”</div>}
              <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 6 }}>SOURCE / {e.source || e.source_doc}</div>
            </div>
          ))}
        </section>

        <section>
          <Eyebrow>INTERVIEW EVIDENCE</Eyebrow>
          {candidateInterviews.length === 0 && (
            <p style={{ color: "#6a6b6b", fontSize: 14 }}>No interview evidence recorded yet.</p>
          )}
          {candidateInterviews.map((x: any) => (
            <div key={x.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
              <div className="font-mono-d" style={{ fontSize: 11, color: "#847dff" }}>{(x.req_key || "").toUpperCase()} · {new Date(x.created_at).toLocaleString("en-GB")}</div>
              <div style={{ marginTop: 4 }}><b>Q:</b> {x.question}</div>
              <div className="quote" style={{ marginTop: 6 }}>“{(x.analysis?.evidence || x.answer || "").slice(0, 400)}”</div>
              {x.analysis?.remainingUncertainty && <div style={{ fontSize: 13, color: "#9f9fa0", marginTop: 4 }}>Remaining: {x.analysis.remainingUncertainty}</div>}
            </div>
          ))}
        </section>

        <section>
          <Eyebrow>AREAS NEEDING VALIDATION</Eyebrow>
          {needingValidation.length === 0 && <p style={{ color: "#6a6b6b", fontSize: 14 }}>No unresolved evidence gaps are currently identified.</p>}
          {needingValidation.map((e: any) => (
            <div key={e.req_key || e.reqKey} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <b>{e.requirement}</b>
                <StatusChip status={e.status} />
              </div>
              <div style={{ color: "#cacaca" }}>{e.observation || e.question || e.status}</div>
            </div>
          ))}
        </section>

        <section>
          <Eyebrow>NOT ADDRESSED / NO EVIDENCE</Eyebrow>
          {noEvidence.length === 0 && <p style={{ color: "#6a6b6b", fontSize: 14 }}>All role requirements have at least partial evidence.</p>}
          {noEvidence.map((e: any) => (
            <div key={e.req_key || e.reqKey} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <b>{e.requirement}</b>
                <StatusChip status={e.status} />
              </div>
              <div style={{ color: "#9f9fa0" }}>{e.observation || "No mention found in supplied documents."}</div>
            </div>
          ))}
        </section>

        <section>
          <Eyebrow>AUDIT SUMMARY</Eyebrow>
          <Timeline events={related.map((a: any) => ({ id: a.id, time: fmtTime(a.created_at), title: (a.event_type || "").replace(/_/g, " ") }))} />
        </section>
        <p className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b" }}>HUMAN REVIEW REQUIRED. EVIDENT DOES NOT MAKE HIRING DECISIONS.</p>
      </div>
    </Shell>
  );
}
