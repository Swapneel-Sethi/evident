# Testing

- `npm run build` (typecheck + lint + prod bundle) — gates every deploy.
- Live API E2E on production: workspace → JD/resume uploads → analyze (gemini) → interview → query → activity roundtrip. Re-run after each backend change.
- UI walkthrough: landing → ingest → overview → matrix cell → drawer → dossier tabs → interview answer → follow-up → status change → ask → audit → report, at 1440px and 390px.
- Failure drills: malformed PDF, empty resume, missing key (keyword fallback), 429 pacing, bad workspace id redirect.
- Canonical consistency: matrix counts == dossier counts == overview stats == `/api/state`.
