// scripts/consistency.mjs - canonical-state invariants for a workspace.
// Usage: node scripts/consistency.mjs <baseUrl> <workspaceId>
const [base, wid] = process.argv.slice(2);
if (!base || !wid) {
  console.error("usage: node scripts/consistency.mjs <base> <workspaceId>");
  process.exit(2);
}

const s = await (await fetch(`${base}/api/state?workspaceId=${wid}`)).json();
let fail = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name} ${extra}`);
  if (!ok) fail++;
};

const R = s.requirements.length;
check("requirements present", R > 0, `n=${R}`);

let fSum = 0, rSum = 0, nSum = 0;
for (const c of s.candidates) {
  const { found, review, none } = c.groups;
  fSum += found; rSum += review; nSum += none;

  // Invariant 1: Summary groups sum === total role requirements R
  check(`groups sum == reqs [${c.displayName}]`, found + review + none === R, `${found}+${review}+${none}=${R}`);

  // Invariant 2: Candidate evidence array length === total role requirements R
  check(`dossier evidence count == reqs [${c.displayName}]`, c.evidence && c.evidence.length === R, `count=${c.evidence?.length}/${R}`);

  // Invariant 3: Sane display name & initials
  check(`name not filename [${c.displayName}]`, !/[_]|\.pdf$/i.test(c.displayName) && !/^EVIDENT/i.test(c.displayName), c.displayName);
  check(`initials sane [${c.displayName}]`, /^[A-Z]{1,2}$/.test(c.displayName.split(/[\s_]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()));

  // Invariant 4: Docker / shallow evidence semantics: if observation says "depth not yet established" or "tool listed", status MUST NOT be EVIDENCE FOUND
  const dockerEv = c.evidence.find((e) => e.requirement.toLowerCase() === "docker" || e.req_key.includes("docker"));
  if (dockerEv && (dockerEv.observation || "").toLowerCase().includes("depth not yet established")) {
    check(`docker shallow evidence semantics [${c.displayName}]`, dockerEv.status !== "EVIDENCE FOUND", `status=${dockerEv.status}`);
  }
}

// Invariant 5: Workspace stats consistency
check("stats.signals == sum(found)", s.stats.signals === fSum, `${s.stats.signals}=${fSum}`);
check("stats.gaps == sum(review+none)", s.stats.gaps === rSum + nSum, `${s.stats.gaps}=${rSum + nSum}`);
check("stats.candidates == rows", s.stats.candidates === s.candidates.length);

process.exit(fail ? 1 : 0);
