# Decisions

- Next.js pages/API routes only, no separate backend — simplest robust deploy.
- One orchestrator, not multi-agent theater.
- Canonical persisted evidence (`evidence_states`) over recompute-per-view.
- Combined single-call candidate analysis (quota: 4 calls/analyze fits 5/min free tier).
- `unpdf` extraction (pdfjs worker missing on Vercel; pdf-parse can't read fpdf2 XRefs).
- Obsidian editorial design system; Tailwind removed (v4 PostCSS breakage, custom CSS suffices).
- Sample workspaces run the REAL pipeline on labelled synthetic docs.
- No scores/rankings anywhere — product principle, not a missing feature.
- Supabase anon + RLS demo policies; service key never shipped.
