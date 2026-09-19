# Testing Plan

## Unit Tests
- Zod schema validation for each AI tool output.
- Utility functions for PDF text extraction.
- Database model CRUD operations.

## Integration Tests
- JD upload → requirement extraction → DB persistence.
- Resume upload → candidate profile extraction → evidence mapping.
- End‑to‑end candidate dossier generation.
- Interview plan creation and response analysis flow.
- Natural‑language pool query returns correct evidence.
- Audit event logging for each AI step.

## End‑to‑End Demo Flow
1. Create workspace, upload JD + 3 resumes.
2. Click *Analyze Candidates*.
3. Verify evidence matrix, validation gaps.
4. Open a candidate, run interview plan, submit answer.
5. Confirm follow‑up generation and evidence graph update.
6. Generate evaluation report.
7. Run a pool query.
8. Check audit trail for all steps.

## Tools
- Jest for unit tests.
- Playwright for browser‑level UI tests.
- Supabase CLI for DB migrations.
- GitHub Actions CI script to run tests on each PR.
