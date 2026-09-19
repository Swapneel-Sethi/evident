// scripts/consistency.mjs - canonical-state invariants for a workspace.
// Usage: node scripts/consistency.mjs <baseUrl> <workspaceId>
const [base, wid] = process.argv.slice(2);
if (!base || !wid) { console.error("usage: node scripts/consistency.mjs <base> <workspaceId>"); process.exit(2); }
const s = await (await fetch(`${base}/api/state?workspaceId=${wid}`)).json();
let fail = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`); if (!ok) fail++; };
const R = s.requirements.length;
check("requirements present", R > 0, `n=${R}`);
let fSum = 0, rSum = 0, nSum = 0;
for (const c of s.candidates) {
  const { found, review, none } = c.groups;
  fSum += found; rSum += review; nSum += none;
  check(`groups sum == reqs [${c.displayName}]`, found + review + none === R, `${found}+${review}+${none}=${R}`);
  check(`name not filename [${c.displayName}]`, !/[_]|\.pdf$/i.test(c.displayName) && !/^EVIDENT/i.test(c.displayName), c.displayName);
  check(`initials sane [${c.displayName}]`, /^[A-Z]{1,2}$/.test(c.displayName.split(/[\s_]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()));
}
check("stats.signals == sum(found)", s.stats.signals === fSum, `${s.stats.signals}=${fSum}`);
check("stats.gaps == sum(review+none)", s.stats.gaps === rSum + nSum, `${s.stats.gaps}=${rSum + nSum}`);
check("stats.candidates == rows", s.stats.candidates === s.candidates.length);
process.exit(fail ? 1 : 0);
