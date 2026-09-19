import { useEffect, useState } from "react";
import Head from "next/head";

export default function Settings() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS).catch(() => setS({ error: true }));
  }, []);
  const row = (k: string, v: boolean) => (
    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14 }}>
      <span>{k}</span>
      <span className="chip" style={{ color: v ? "#64d98b" : "#d9a75f" }}>{v ? "CONNECTED" : "NOT CONFIGURED"}</span>
    </div>
  );
  return (
    <div style={{ background: "#0f1011", minHeight: "100vh", color: "#f5f5f7" }}>
      <Head><title>EVIDENT — Settings</title></Head>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px" }}>
        <div className="eyebrow">SYSTEM</div>
        <h1 className="font-serif-d" style={{ fontSize: 40, color: "#fff", margin: "6px 0 20px 0" }}>Settings</h1>
        <div className="card">
          <div className="eyebrow">CONNECTIONS</div>
          {!s && <div className="skel" style={{ height: 60 }} />}
          {s && !s.error && (<>
            {row("AI ANALYSIS", s.ai)}
            {row("DATABASE", s.db)}
            {row("STORAGE", s.storage)}
          </>)}
          {s?.error && <p style={{ color: "#9f9fa0" }}>Status unavailable.</p>}
          <p className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", marginTop: 12 }}>KEYS LIVE SERVER-SIDE ONLY. NEVER EXPOSED HERE.</p>
        </div>
      </main>
    </div>
  );
}
