// scripts/ask-regression.mjs - exact-query regression for Ask EVIDENT.
// Usage: node scripts/ask-regression.mjs <baseUrl> <workspaceId>
const [base, wid] = process.argv.slice(2);
if (!base || !wid) { console.error("usage: node scripts/ask-regression.mjs <base> <workspaceId>"); process.exit(2); }
const q = "Show candidates with FastAPI project evidence but no AWS evidence.";
const r = await fetch(`${base}/api/query`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ workspaceId: wid, query: q }),
});
const j = await r.json();
let fail = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`); if (!ok) fail++; };
const st = await (await fetch(`${base}/api/state?workspaceId=${wid}`)).json();
const nameOf = (id) => st.candidates.find((c) => c.id === id)?.displayName || id;
const names = j.results.map((x) => nameOf(x.candidateId));
check("Arjun Patel included", names.includes("Arjun Patel"), names.join(","));
check("Rahul Mehta included", names.includes("Rahul Mehta"), names.join(","));
check("Neha Sharma excluded (has AWS)", !names.includes("Neha Sharma"), names.join(","));
const BANNED = ["hire", "reject", "best", "top candidate", "recommend", "score", "ranking"];
for (const x of j.results) {
  const f = x.detail.find((d) => d.skill === "fastapi");
  const a = x.detail.find((d) => d.skill === "aws");
  check(`${nameOf(x.candidateId)} fastapi present+status`, Boolean(f) && !!f.status, f?.status || "missing");
  check(`${nameOf(x.candidateId)} aws absent+status`, Boolean(a) && a.status === "NO EVIDENCE FOUND", a?.status || "missing");
  check(`${nameOf(x.candidateId)} sources present`, Boolean(f?.source) && Boolean(a?.source));
  const blob = JSON.stringify(x).toLowerCase();
  check(`${nameOf(x.candidateId)} no recommendations`, !BANNED.some((w) => blob.includes(w)));
}
process.exit(fail ? 1 : 0);
