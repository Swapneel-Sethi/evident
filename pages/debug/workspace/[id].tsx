import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Debug() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [j, setJ] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/state?workspaceId=${encodeURIComponent(id)}`).then((r) => r.json()).then(setJ).catch(() => {});
  }, [id]);
  return (
    <div style={{ background: "#000", color: "#0f0", minHeight: "100vh", padding: 24 }}>
      <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 12 }}>DEBUG / development only / {id}</div>
      <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{JSON.stringify(j, null, 2)}</pre>
    </div>
  );
}
