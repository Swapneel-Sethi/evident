import { useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Empty, Err, Skeletons, StatusChip, useWorkspaceState } from "../../../components/ui";

const DOT: Record<string, { bg: string; fg: string; glyph: string }> = {
  "EVIDENCE FOUND": { bg: "rgba(100,217,139,0.14)", fg: "#64d98b", glyph: "✓" },
  "PARTIAL EVIDENCE": { bg: "rgba(217,167,95,0.14)", fg: "#d9a75f", glyph: "◐" },
  "NEEDS VALIDATION": { bg: "rgba(0,179,221,0.14)", fg: "#00b3dd", glyph: "?" },
  "NO EVIDENCE FOUND": { bg: "transparent", fg: "#6a6b6b", glyph: "○" },
  "SUPPORTED BY INTERVIEW": { bg: "rgba(132,125,255,0.16)", fg: "#847dff", glyph: "◆" },
  "CONFLICTING INFORMATION": { bg: "rgba(217,122,106,0.14)", fg: "#d97a6a", glyph: "!" },
};

export default function Matrix() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, loading, error, reload } = useWorkspaceState(id);
  const [cell, setCell] = useState<{ cand: any; ev: any } | null>(null);

  if (loading) return <Shell workspaceId={id} title="See the gaps."><Skeletons n={3} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="See the gaps."><Err message="Failed to load matrix." retry={reload} /></Shell>;
  if (!state.analyzed) return <Shell workspaceId={id} title="See the gaps."><Empty title="No evidence yet" body="Analyze documents first." /></Shell>;

  const evFor = (docId: string, reqKey: string) =>
    state.candidates.find((c: any) => c.id === docId)?.evidence.find((e: any) => e.req_key === reqKey);

  return (
    <Shell workspaceId={id} title="See the gaps."
      subtitle="Cross-candidate evidence mapped directly to role requirements. Select a cell for sources.">
      <Eyebrow>EVIDENCE MAP</Eyebrow>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="matrix" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>CANDIDATE</th>
              {state.requirements.map((r: any) => <th key={r.req_key}>{r.name.toUpperCase()}</th>)}
            </tr>
          </thead>
          <tbody>
            {state.candidates.map((c: any) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600, fontSize: 14 }}>{c.displayName}</td>
                {state.requirements.map((r: any) => {
                  const e = evFor(c.id, r.req_key);
                  const d = DOT[e?.status] || DOT["NO EVIDENCE FOUND"];
                  return (
                    <td key={r.req_key}>
                      <button onClick={() => e && setCell({ cand: c, ev: e })}
                        aria-label={`${c.fileName} ${r.name}: ${e?.status || "unknown"}`}
                        title={e?.status || "unknown"}
                        style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: d.bg, color: d.fg, fontSize: 16, cursor: e ? "pointer" : "default" }}>
                        {d.glyph}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        {Object.keys(DOT).map((s) => <StatusChip key={s} status={s} />)}
      </div>
      {cell && (
        <>
          <div className="drawer-veil" onClick={() => setCell(null)} />
          <div className="drawer" role="dialog" aria-label="Evidence detail">
            <Eyebrow>REQUIREMENT / {cell.ev.requirement.toUpperCase()}</Eyebrow>
            <div className="font-serif-d" style={{ fontSize: 30, color: "#fff", marginBottom: 8 }}>{cell.ev.status === "NO EVIDENCE FOUND" ? "No evidence." : cell.ev.status.charAt(0) + cell.ev.status.slice(1).toLowerCase() + "."}</div>
            <div style={{ marginBottom: 16 }}><StatusChip status={cell.ev.status} /></div>
            <Field k="CANDIDATE" v={cell.cand.displayName} />
            <Field k="CURRENT STATUS" v={cell.ev.status} />
            <div className="eyebrow" style={{ marginTop: 16 }}>DOCUMENT EVIDENCE</div>
            <Field k="SOURCE DOCUMENT" v={cell.ev.source_doc || cell.ev.source || "—"} />
            {cell.ev.source_section && <Field k="SOURCE SECTION" v={cell.ev.source_section} />}
            {cell.ev.claim && (<><div className="eyebrow" style={{ marginTop: 16 }}>EVIDENCE</div><div className="quote">“{cell.ev.claim}”</div></>)}
            {cell.ev.observation && (<><div className="eyebrow" style={{ marginTop: 16 }}>INTERPRETATION</div><p style={{ fontSize: 14, color: "#cacaca" }}>{cell.ev.observation}</p></>)}
            {cell.ev.question && (<><div className="eyebrow" style={{ marginTop: 16 }}>VALIDATION TARGET</div><p style={{ fontSize: 14, color: "#cacaca" }}>{cell.ev.question}</p></>)}
            {(() => {
              const rows = (state.interviews || []).filter((x: any) => x.candidate_doc_id === cell.cand.id && x.req_key === cell.ev.req_key);
              if (!rows.length) return null;
              return (<><div className="eyebrow" style={{ marginTop: 16 }}>INTERVIEW EVIDENCE / {rows.length}</div>
                {rows.map((x: any) => (
                  <div key={x.id} style={{ marginBottom: 10 }}>
                    <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b" }}>{new Date(x.created_at).toLocaleString("en-GB")}</div>
                    <div style={{ fontSize: 13 }}><b>Q:</b> {x.question}</div>
                    <div className="quote" style={{ marginTop: 4 }}>“{(x.analysis?.evidence || x.answer || "").slice(0, 300)}”</div>
                  </div>
                ))}</>);
            })()}
            {(cell.ev.status === "NEEDS VALIDATION" || cell.ev.status === "PARTIAL EVIDENCE") && (
              <button className="btn-primary" style={{ marginTop: 20 }}
                onClick={() => router.push(`/workspace/${id}/interview/${cell.cand.id}?req=${encodeURIComponent(cell.ev.req_key)}`)}>
                START INTERVIEW VALIDATION →
              </button>
            )}
            <div><button className="btn-tertiary" style={{ marginTop: 12 }} onClick={() => setCell(null)}>CLOSE</button></div>
          </div>
        </>
      )}
    </Shell>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{k}</div>
      <div style={{ fontSize: 14 }}>{v}</div>
    </div>
  );
}
