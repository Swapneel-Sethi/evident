import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { Shell, Eyebrow, Empty, useWorkspaceState } from "../../../components/ui";

function Dropzone({ accept, multiple, onFiles, label, hint }: {
  accept: string; multiple?: boolean; onFiles: (f: File[]) => void; label: string; hint: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={"dropzone" + (drag ? " drag" : "")}
      role="button" tabIndex={0} aria-label={label}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter") ref.current?.click(); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(Array.from(e.dataTransfer.files || [])); }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>⇪</div>
      <div style={{ color: "#f5f5f7", fontSize: 15 }}>{label}</div>
      <div style={{ color: "#9f9fa0", fontSize: 13, marginTop: 4 }}>{hint}</div>
      <input ref={ref} type="file" accept={accept} multiple={multiple} hidden
        onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
    </div>
  );
}

export default function WorkspaceIngest() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, reload } = useWorkspaceState(id);
  const [busy, setBusy] = useState("");
  const [feed, setFeed] = useState<{ id: string; msg: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const say = (msg: string) => setFeed((f) => [...f.slice(-7), { id: `${Date.now()}-${Math.random()}`, msg }]);
  const jdReady = (state?.jobDocs || []).length > 0;
  const candReady = (state?.candidates || []).length > 0;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const confirmDoc = async (idToFind: string, kind: "jd" | "resume") => {
    try {
      const r = await fetch(`/api/state?workspaceId=${encodeURIComponent(id)}`);
      const s = await r.json();
      const ok = kind === "jd"
        ? (s.jobDocs || []).some((d: any) => d.id === idToFind)
        : (s.candidates || []).some((c: any) => c.id === idToFind);
      return { ok, state: s };
    } catch { return { ok: false, state: null }; }
  };

  const upload = async (file: File, kind: "jd" | "resume") => {
    if (!UUID_RE.test(id || "")) { say("Not a database workspace. Return home and create a new one."); return; }
    setBusy(file.name);
    try {
      say(`Reading ${file.name}…`);
      const form = new FormData();
      form.append("file", file);
      form.append("workspaceId", id);
      const res = await fetch(kind === "jd" ? "/api/upload-job" : "/api/upload-resume", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "upload failed");
      const docId = j.id || j.record?.id;
      const check = await confirmDoc(docId, kind);
      if (!check.ok) throw new Error("stored but not yet visible — retry in a moment");
      say(`${file.name} stored and confirmed.`);
      reload();
    } catch (e: any) { say(`${file.name}: ${e.message}`); }
    finally { setBusy(""); }
  };

  const analyze = async () => {
    setAnalyzing(true); setSteps([]); setDone(false);
    const seq = ["ROLE ANALYSIS — reading job description", "DOCUMENT EXTRACTION — processing resumes", "EVIDENCE MAPPING — linking claims to requirements", "GAP DETECTION — finding unsupported areas", "INTERVIEW INTELLIGENCE — preparing validation questions"];
    try {
      for (const s of seq) { setSteps((p) => [...p, s + "…"]); await new Promise((r) => setTimeout(r, 500)); }
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: id }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "analysis failed");
      setSteps(seq.map((s) => s + " ✓"));
      setDone(true);
      reload();
    } catch (e: any) { say(`Analysis: ${e.message}`); setAnalyzing(false); }
  };

  return (
    <Shell workspaceId={id} title="Build an evidence workspace."
      subtitle="Upload the role and candidate documents. EVIDENT maps source-backed evidence to each requirement.">
      <div style={{ display: "grid", gap: 20, maxWidth: 860 }}>
        <div>
          <Eyebrow>01 / ROLE CONTEXT</Eyebrow>
          <div className="card-lg">
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Job description</div>
            <p style={{ color: "#9f9fa0", fontSize: 14, marginTop: 0 }}>Drop a job description here — PDF or supported document — or paste the role text.</p>
            <Dropzone accept=".pdf,.txt" label="Drop a job description here" hint="PDF or text" onFiles={(f) => f[0] && upload(f[0], "jd")} />
            {(state?.jobDocs || []).map((d: any) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#847dff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>JD</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                </div>
                <span className="chip" style={{ color: "#64d98b" }}>READY</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Eyebrow>02 / CANDIDATES</Eyebrow>
          <div className="card-lg">
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Candidate documents</div>
            <p style={{ color: "#9f9fa0", fontSize: 14, marginTop: 0 }}>Multi-upload resumes. Filenames are used until extraction completes.</p>
            <Dropzone accept=".pdf,.txt" multiple label="Drop resumes here" hint="Multiple PDFs or text files" onFiles={(f) => f.forEach((x) => upload(x, "resume"))} />
            {state && state.candidates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {state.candidates.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#3f4041", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                      {c.fileName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.fileName}</div>
                    </div>
                    <span className="chip" style={{ color: "#64d98b" }}>READY</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {!analyzing && !done && (
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="font-mono-d" style={{ fontSize: 12, color: "#9f9fa0" }}>
                {(state?.jobDocs?.length ? 1 : 0)} ROLE DOC · {state?.candidates.length || 0} CANDIDATES
              </div>
              {(!jdReady || !candReady) && (
                <div style={{ fontSize: 13, color: "#d9a75f", marginTop: 4 }}>
                  {!jdReady ? "Upload a job description to enable analysis. " : ""}
                  {!candReady ? "Add at least one candidate document." : ""}
                </div>
              )}
            </div>
            <button className="btn-primary" onClick={analyze} disabled={busy !== "" || !jdReady || !candReady}>ANALYZE EVIDENCE →</button>
          </div>
        )}
        {analyzing && (
          <div className="card-lg">
            <Eyebrow>BUILDING THE EVIDENCE LAYER</Eyebrow>
            <div className="font-serif-d" style={{ fontSize: 28, color: "#fff", marginBottom: 16 }}>
              {done ? "The evidence is ready." : "Parsing role requirements, grounding claims…"}
            </div>
            {steps.map((s, i) => (
              <div key={i} className="font-mono-d" style={{ fontSize: 12, color: "#cacaca", padding: "6px 0" }}>{s}</div>
            ))}
            {done && <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => router.push(`/workspace/${id}/overview`)}>REVIEW WORKSPACE →</button>}
          </div>
        )}
        {feed.length > 0 && (
          <div className="card">
            <Eyebrow>SESSION ACTIVITY</Eyebrow>
            {feed.map((f) => <div key={f.id} style={{ fontSize: 13, color: "#9f9fa0", padding: "4px 0" }}>{f.msg}</div>)}
          </div>
        )}
        {(!state || state.candidates.length === 0) && !analyzing && (
          <Empty title="Evidence starts with context" body="Upload a role and candidate documents to begin." />
        )}
      </div>
    </Shell>
  );
}
