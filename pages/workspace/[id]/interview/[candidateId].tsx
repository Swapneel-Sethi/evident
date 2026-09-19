import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Err, Skeletons, StatusChip, useWorkspaceState } from "../../../../components/ui";

export default function Interview() {
  const router = useRouter();
  const { id, candidateId, req } = router.query as { id: string; candidateId: string; req?: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [answer, setAnswer] = useState("");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  const cand = state?.candidates.find((c: any) => c.id === candidateId);
  const ev = cand?.evidence.find((e: any) => e.req_key === req) || cand?.gaps[0];
  const name = cand ? cand.fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ") : "";

  const submit = async () => {
    if (!answer.trim() || !ev) return;
    setWorking(true); setFatal(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: id, candidateDocId: candidateId, reqKey: ev.req_key,
          requirement: ev.requirement, question: ev.question || `Validate ${ev.requirement}`, answer,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "analysis failed");
      setResult(j);
      reload();
    } catch (e: any) { setFatal(e.message); }
    finally { setWorking(false); }
  };

  if (loading) return <Shell workspaceId={id} title="Interview Validation"><Skeletons n={3} /></Shell>;
  if (error || !state || !cand || !ev) return <Shell workspaceId={id} title="Interview Validation"><Err message="No validation target found. Pick a gap from the dossier first." retry={() => router.back()} /></Shell>;

  return (
    <Shell workspaceId={id} title="Interview Validation" subtitle={`${name} / ${ev.requirement}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12 }} className="ivgrid-d">
        <div className="card">
          <Eyebrow>WHY WE ARE ASKING</Eyebrow>
          <div style={{ marginBottom: 12 }}><StatusChip status={ev.status} /></div>
          <div className="eyebrow">CURRENT EVIDENCE</div>
          {ev.claim ? <div className="quote">“{ev.claim}”</div> : <p style={{ color: "#6a6b6b", fontSize: 14 }}>No claim on record.</p>}
          <div className="eyebrow" style={{ marginTop: 14 }}>UNRESOLVED</div>
          <p style={{ fontSize: 14, color: "#cacaca", margin: 0 }}>{ev.observation || ev.question || "Depth of experience."}</p>
          <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 14 }}>SOURCE / {ev.source || cand.fileName}</div>
        </div>
        <div>
          <div className="card">
            <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", marginBottom: 6 }}>QUESTION 01</div>
            <div className="font-serif-d" style={{ fontSize: 22, lineHeight: 1.25, color: "#fff", marginBottom: 16 }}>
              {ev.question || `Walk me through your experience with ${ev.requirement}.`}
            </div>
            <textarea className="input-d" placeholder="Record the candidate response here…" value={answer}
              onChange={(e) => setAnswer(e.target.value)} disabled={working} aria-label="Candidate response" />
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={submit} disabled={working || !answer.trim()}>
              {working ? "ANALYZING…" : "ANALYZE RESPONSE →"}
            </button>
            {fatal && <p style={{ color: "#d97a6a", fontSize: 14 }}>{fatal}</p>}
          </div>
          {result && (
            <div className="card" style={{ marginTop: 12 }}>
              <Eyebrow>NEW EVIDENCE</Eyebrow>
              <p style={{ fontSize: 14 }}>{result.analysis?.evidence || result.analysis?.notes || "Response recorded."}</p>
              <div className="eyebrow">EVIDENCE STATUS</div>
              <p style={{ fontSize: 14 }}>{result.newStatus ? `Updated → ${result.newStatus}` : "No status change warranted."}</p>
              {(result.followUp?.followUpQuestion || result.followUp?.follow_up) ? (
                <>
                  <div className="eyebrow">FOLLOW-UP QUESTION</div>
                  <div className="quote">“{result.followUp.followUpQuestion || result.followUp.follow_up}”</div>
                  <button className="btn-secondary" style={{ marginTop: 12 }}
                    onClick={() => { setAnswer(""); setResult({ ...result, followUp: null, _continued: true }); }}>
                    CONTINUE INTERVIEW →
                  </button>
                </>
              ) : <div className="chip" style={{ color: "#64d98b" }}>VALIDATION COMPLETE</div>}
              <div><button className="btn-tertiary" style={{ marginTop: 8 }} onClick={() => router.push(`/workspace/${id}/candidates/${candidateId}`)}>BACK TO DOSSIER</button></div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`@media (max-width: 900px) { .ivgrid-d { grid-template-columns: 1fr !important; } }`}</style>
    </Shell>
  );
}
