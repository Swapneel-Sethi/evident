import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Err, Skeletons, StatusChip, useWorkspaceState } from "../../../../components/ui";

type Row = {
  id: string; question: string; answer: string; analysis: any;
  follow_up: string; created_at: string; req_key: string;
};

export default function Interview() {
  const router = useRouter();
  const { id, candidateId, req } = router.query as { id: string; candidateId: string; req?: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [answer, setAnswer] = useState("");
  const [working, setWorking] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [followReady, setFollowReady] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const cand = state?.candidates.find((c: any) => c.id === candidateId);
  const thread: Row[] = (state?.interviews || []).filter((x: any) => x.candidate_doc_id === candidateId);
  const gapEv = req
    ? cand?.evidence.find((e: any) => e.req_key === req)
    : cand?.gaps[0];
  const name = cand ? cand.displayName : "";

  // Pending follow-up = last row whose follow-up was never asked next.
  let pending: string | null = null;
  let pendingReq = gapEv?.req_key || "";
  let pendingReqName = gapEv?.requirement || "";
  for (let i = thread.length - 1; i >= 0; i--) {
    const f = (thread[i].follow_up || "").trim();
    if (!f) break;
    const answered = thread.slice(i + 1).some((r) => r.question.trim() === f);
    if (!answered) {
      pending = f; pendingReq = thread[i].req_key || pendingReq; break;
    }
  }
  const currentQ = pending || gapEv?.question || (gapEv ? `Walk me through your experience with ${gapEv.requirement}.` : "");
  const currentReqKey = pendingReq;
  const currentReqName = (() => {
    const e = cand?.evidence.find((x: any) => x.req_key === currentReqKey);
    return e?.requirement || pendingReqName;
  })();

  const submit = async () => {
    if (!answer.trim() || !currentQ) return;
    setWorking(true); setFatal(null); setFollowReady(false);
    try {
      const res = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: id, candidateDocId: candidateId, reqKey: currentReqKey,
          requirement: currentReqName, question: currentQ, answer,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "analysis failed");
      setAnswer("");
      if (j.followUp?.followUpQuestion || j.followUp?.follow_up) setFollowReady(true);
      reload();
    } catch (e: any) { setFatal(e.message); }
    finally { setWorking(false); }
  };

  if (loading) return <Shell workspaceId={id} title="Interview Validation"><Skeletons n={3} /></Shell>;
  if (error || !state || !cand)
    return <Shell workspaceId={id} title="Interview Validation"><Err message="Failed to load interview." retry={reload} /></Shell>;

  const gapOpen = gapEv && (gapEv.status === "NEEDS VALIDATION" || gapEv.status === "PARTIAL EVIDENCE");
  const showComplete = !pending && !gapOpen;
  if (!pending && !gapOpen && thread.length === 0)
    return <Shell workspaceId={id} title="Interview Validation"><Err message="No validation target found. Pick a gap from the dossier first." retry={() => router.back()} /></Shell>;

  return (
    <Shell workspaceId={id} title="Interview Validation" subtitle={`${name} / ${currentReqName || "validation"}`}>
      {thread.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <Eyebrow>SESSION HISTORY / {String(thread.length).padStart(2, "0")}</Eyebrow>
          {thread.map((r, i) => (
            <div key={r.id} style={{ padding: "12px 0", borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b" }}>QUESTION {String(i + 1).padStart(2, "0")} · {new Date(r.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
              <div style={{ fontSize: 15, margin: "4px 0" }}>{r.question}</div>
              <div className="quote">“{r.answer}”</div>
              {r.analysis?.remainingUncertainty && <div style={{ fontSize: 13, color: "#9f9fa0", marginTop: 6 }}>Remaining: {r.analysis.remainingUncertainty}</div>}
              {r.follow_up && <div style={{ fontSize: 13, color: "#00b3dd", marginTop: 6 }}>Follow-up: {r.follow_up}</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 }} className="ivgrid-d">
        <div className="card">
          <Eyebrow>WHY WE ARE ASKING</Eyebrow>
          {gapEv && <div style={{ marginBottom: 12 }}><StatusChip status={gapEv.status} /></div>}
          <div className="eyebrow">CURRENT EVIDENCE</div>
          {gapEv?.claim ? <div className="quote">“{gapEv.claim}”</div> : <p style={{ color: "#6a6b6b", fontSize: 14 }}>No claim on record.</p>}
          <div className="eyebrow" style={{ marginTop: 14 }}>UNRESOLVED</div>
          <p style={{ fontSize: 14, color: "#cacaca", margin: 0 }}>{gapEv?.observation || "Depth of experience."}</p>
          <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 14 }}>SOURCE / {gapEv?.source_doc || gapEv?.source || cand.fileName}</div>
        </div>
        <div>
          <div className="card">
            <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", marginBottom: 6 }}>
              QUESTION {String(thread.length + 1).padStart(2, "0")}{pending ? " · FOLLOW-UP" : ""}
            </div>
            <div className="font-serif-d" style={{ fontSize: 22, lineHeight: 1.25, color: "#fff", marginBottom: 16 }}>{currentQ}</div>
            <textarea ref={answerRef} className="input-d" placeholder="Record the candidate response here…" value={answer}
              onChange={(e) => setAnswer(e.target.value)} disabled={working} aria-label="Candidate response" />
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={submit} disabled={working || !answer.trim()}>
              {working ? "ANALYZING…" : "ANALYZE RESPONSE →"}
            </button>
            {fatal && <p style={{ color: "#d97a6a", fontSize: 14 }}>{fatal}</p>}
          </div>
          {followReady && pending && (
            <div className="card" style={{ marginTop: 12 }}>
              <Eyebrow>CONTEXTUAL FOLLOW-UP READY</Eyebrow>
              <div className="quote">“{pending}”</div>
              <button className="btn-primary" style={{ marginTop: 12 }}
                onClick={() => { setFollowReady(false); answerRef.current?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                CONTINUE INTERVIEW →
              </button>
            </div>
          )}
          {showComplete && <div className="card" style={{ marginTop: 12 }}><div className="chip" style={{ color: "#64d98b" }}>VALIDATION COMPLETE</div>
            <div><button className="btn-tertiary" style={{ marginTop: 8 }} onClick={() => router.push(`/workspace/${id}/candidates/${candidateId}`)}>BACK TO DOSSIER</button></div></div>}
        </div>
      </div>
      <style jsx>{`@media (max-width: 900px) { .ivgrid-d { grid-template-columns: 1fr !important; } }`}</style>
    </Shell>
  );
}
