import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [sampleLoading, setSampleLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const createWorkspace = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Hiring workspace" }),
      });
      const data = await res.json();
      router.push(`/workspace/${data.workspace.id}`);
    } finally { setCreating(false); }
  };

  const loadSample = async () => {
    setSampleLoading(true);
    try {
      const res = await fetch("/api/sample", { method: "POST" });
      const data = await res.json();
      if (data.workspaceId) router.push(`/workspace/${data.workspaceId}/overview`);
    } finally { setSampleLoading(false); }
  };

  return (
    <div style={{ background: "#0f1011", minHeight: "100vh", color: "#f5f5f7" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f7", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>E</div>
          <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>EVIDENT</span>
        </div>
        <button className="btn-tertiary" onClick={createWorkspace}>OPEN WORKSPACE →</button>
      </header>
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 48px 40px 48px" }}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>EVIDENT / RECRUITMENT INTELLIGENCE</div>
        <h1 className="font-serif-d" style={{ fontSize: "clamp(56px, 8vw, 88px)", lineHeight: 0.98, margin: 0, color: "#fff" }}>
          Evidence<br />before judgment.
        </h1>
        <p style={{ fontSize: 18, color: "#9f9fa0", maxWidth: 620, marginTop: 24 }}>
          Turn job requirements, resumes and interview responses into traceable
          evidence — without handing hiring decisions to an algorithm.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={createWorkspace} disabled={creating}>
            {creating ? "CREATING…" : "OPEN WORKSPACE →"}
          </button>
          <button className="btn-secondary" onClick={loadSample} disabled={sampleLoading}>
            {sampleLoading ? "LOADING SAMPLE…" : "LOAD SAMPLE WORKSPACE"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 80 }}>
          {[
            ["SOURCE-GROUNDED", "Every claim links back to the document, section and snippet it came from."],
            ["INTERVIEW-ADAPTIVE", "Gaps become targeted questions; answers update the evidence state."],
            ["HUMAN-CONTROLLED", "No scores, no rankings, no hire/reject. Humans decide; EVIDENT traces."],
          ].map(([t, b]) => (
            <div key={t} className="card">
              <div className="font-mono-d" style={{ fontSize: 11, letterSpacing: "0.12em", color: "#00b3dd", marginBottom: 10 }}>{t}</div>
              <div style={{ fontSize: 14, color: "#cacaca" }}>{b}</div>
            </div>
          ))}
        </div>
        <div className="card-lg" style={{ marginTop: 16, background: "#847dff", border: "none", color: "#0f1011" }}>
          <div className="font-serif-d" style={{ fontSize: "clamp(24px, 3vw, 34px)", lineHeight: 1.1 }}>
            “What can you actually prove?”
          </div>
          <div style={{ marginTop: 10, fontSize: 15 }}>
            Most hiring tools answer “who is best”. EVIDENT asks what evidence supports
            each requirement, what is missing, and what to ask next.
          </div>
        </div>
      </main>
      <footer style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 48px 48px 48px" }}>
        <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b" }}>EVIDENT / PRODUCT SPACE AGENTIC AI HACKATHON 2026</div>
      </footer>
    </div>
  );
}
