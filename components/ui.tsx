import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

export type WsState = {
  workspace: { id: string; title: string; created_at: string } | null;
  requirements: any[];
  jobDocs: any[];
  candidates: any[];
  interviews: any[];
  activity: any[];
  stats: { candidates: number; requirements: number; signals: number; gaps: number };
  analyzed: boolean;
};

export function useWorkspaceState(workspaceId?: string) {
  const [state, setState] = useState<WsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = () => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/state?workspaceId=${encodeURIComponent(workspaceId)}`)
      .then((r) => { if (!r.ok) throw new Error("load failed"); return r.json(); })
      .then((j) => { setState(j); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, [workspaceId]);
  return { state, loading, error, reload };
}

const STATUS_STYLE: Record<string, { color: string; icon: string; label: string }> = {
  "EVIDENCE FOUND": { color: "#64d98b", icon: "●", label: "EVIDENCE FOUND" },
  "PARTIAL EVIDENCE": { color: "#d9a75f", icon: "◐", label: "PARTIAL EVIDENCE" },
  "NEEDS VALIDATION": { color: "#00b3dd", icon: "○", label: "NEEDS VALIDATION" },
  "NO EVIDENCE FOUND": { color: "#6a6b6b", icon: "○", label: "NO EVIDENCE" },
  "SUPPORTED BY INTERVIEW": { color: "#847dff", icon: "◆", label: "SUPPORTED BY INTERVIEW" },
  "CONFLICTING INFORMATION": { color: "#d97a6a", icon: "▲", label: "CONFLICTING" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || { color: "#9f9fa0", icon: "○", label: status };
  return (
    <span className="chip" title={s.label} style={{ color: s.color, borderColor: "rgba(255,255,255,0.12)" }}>
      <span aria-hidden>{s.icon}</span> {s.label}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow" style={{ marginBottom: 12 }}>{children}</div>;
}

export function Shell({ workspaceId, title, subtitle, actions, children }: {
  workspaceId?: string; title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const base = workspaceId ? `/workspace/${workspaceId}` : "";
  const nav = [
    { href: `${base}/overview`, label: "Overview" },
    { href: `${base}/candidates`, label: "Candidates" },
    { href: `${base}/requirements`, label: "Requirements" },
    { href: `${base}/matrix`, label: "Evidence Map" },
    { href: `${base}/ask`, label: "Ask EVIDENT" },
    { href: `${base}/audit`, label: "Audit Trail" },
  ];
  const side = (
    <div style={{ padding: 20 }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f7", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 }}>E</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>EVIDENT</div>
            <div className="font-mono-d" style={{ fontSize: 9, letterSpacing: "0.14em", color: "#6a6b6b" }}>EVIDENCE INTELLIGENCE</div>
          </div>
        </div>
      </Link>
      <nav style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 2 }} aria-label="Workspace">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={"navlink" + (router.asPath === n.href ? " active" : "")} onClick={() => setMenu(false)}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
        <Link href="/settings" className="navlink">Settings</Link>
        <div className="font-mono-d" style={{ fontSize: 10, color: "#6a6b6b", marginTop: 10, padding: "0 12px" }}>SYSTEM / OPERATIONAL</div>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f1011" }}>
      <Head><title>EVIDENT — {title}</title></Head>
      <aside className="sidebar-d" style={{ width: 248, flexShrink: 0, background: "#090a0b", borderRight: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>{side}</aside>
      {menu && (<><div className="drawer-veil" onClick={() => setMenu(false)} /><div className="drawer" style={{ right: "auto", left: 0, borderLeft: "none", borderRight: "1px solid rgba(255,255,255,0.1)" }}>{side}</div></>)}
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ padding: "28px 40px 0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <button className="btn-tertiary menubtn-d" onClick={() => setMenu(true)} aria-label="Open menu" style={{ marginBottom: 8 }}>☰ MENU</button>
              <div className="eyebrow">HIRING WORKSPACE / ACTIVE</div>
              <h1 className="font-serif-d" style={{ fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.02, margin: "6px 0 4px 0", color: "#fff" }}>{title}</h1>
              {subtitle && <p style={{ color: "#9f9fa0", fontSize: 14, margin: 0 }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
          </div>
        </header>
        <main style={{ padding: "28px 40px 80px 40px" }} className="mainpad-d">{children}</main>
      </div>
      <style jsx>{`
        .menubtn-d { display: none; }
        @media (max-width: 900px) {
          .sidebar-d { display: none; }
          .menubtn-d { display: block; }
          .mainpad-d { padding: 20px 20px 64px 20px !important; }
        }
      `}</style>
    </div>
  );
}

export function Stat({ value, label, inverted }: { value: React.ReactNode; label: string; inverted?: boolean }) {
  return (
    <div className={inverted ? "card-lg" : "card"} style={inverted ? { background: "#cacaca", color: "#000", border: "none" } : {}}>
      <div className="font-mono-d" style={{ fontSize: 34, lineHeight: 1 }}>{value}</div>
      <div className="font-mono-d" style={{ fontSize: 11, letterSpacing: "0.1em", marginTop: 8, color: inverted ? "#222" : "#9f9fa0" }}>{label}</div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 48 }}>
      <div className="font-serif-d" style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>{title}</div>
      <p style={{ color: "#9f9fa0", fontSize: 14 }}>{body}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function Err({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="card" style={{ borderColor: "rgba(217,122,106,0.4)" }}>
      <div className="eyebrow" style={{ color: "#d97a6a" }}>SOMETHING FAILED</div>
      <p style={{ fontSize: 14 }}>{message}</p>
      {retry && <button className="btn-secondary" onClick={retry}>RETRY →</button>}
    </div>
  );
}

export function Skeletons({ n = 3 }: { n?: number }) {
  return (<div style={{ display: "grid", gap: 12 }}>{Array.from({ length: n }).map((_, i) => <div key={i} className="skel" style={{ height: 64 }} />)}</div>);
}

export function Timeline({ events }: { events: { id: string; time: string; title: string; body?: string }[] }) {
  if (!events.length) return <Empty title="No activity yet" body="Activity will appear here as EVIDENT processes evidence." />;
  return (
    <div>
      {events.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="font-mono-d" style={{ fontSize: 11, color: "#6a6b6b", minWidth: 64 }}>{e.time}</div>
          <div>
            <div style={{ fontSize: 14, color: "#f5f5f7" }}>{e.title}</div>
            {e.body && <div style={{ fontSize: 13, color: "#9f9fa0" }}>{e.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return ""; }
}

export function initials(name: string) {
  return name.split(/[\s_]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
