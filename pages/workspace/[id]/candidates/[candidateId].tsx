// pages/workspace/[id]/candidates/[candidateId].tsx
// Candidate dossier page – shows requirement status chips, evidence snippets, and validation gaps.

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import EvidenceMatrix from '../../../../components/EvidenceMatrix';
import { CandidateProfile, EvidenceItem, ValidationGap, JobRequirement } from '../../../../lib/types';

interface DossierData {
  candidate: CandidateProfile | null;
  requirements: JobRequirement[];
  evidence: EvidenceItem[];
  gaps: ValidationGap[];
}

export default function CandidateDossierPage() {
  const router = useRouter();
  const { id: workspaceId, candidateId } = router.query as {
    id?: string;
    candidateId?: string;
  };

  const [data, setData] = useState<DossierData>({
    candidate: null,
    requirements: [],
    evidence: [],
    gaps: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !candidateId) return;
    setLoading(true);
    // Placeholder endpoint – replace with real API when available.
    fetch(`/api/dossier?workspaceId=${workspaceId}&candidateId=${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dossier');
        return res.json();
      })
      .then((json) => {
        setData({
          candidate: json.candidate ?? null,
          requirements: json.requirements ?? [],
          evidence: json.evidence ?? [],
          gaps: json.gaps ?? [],
        });
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, candidateId]);

  const { candidate, requirements, evidence, gaps } = data;

  // Build a simple evidence map for the matrix – status derived heuristically.
  const evidenceMap: Record<string, "pass" | "fail" | "unknown"> = {};
  // For demo, mark requirement as "pass" if any evidence item references it (placeholder logic).
  // In this codebase EvidenceItem does not contain a requirementId; a real implementation would join on that.

  const candidateRow = {
    id: candidate?.id ?? "",
    name: candidate?.name ?? "",
    evidence: evidenceMap,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Navigation back */}
      <nav className="mb-4">
        <button
          className="text-blue-600 hover:underline"
          onClick={() => router.back()}
        >
          ← Back to workspace
        </button>
      </nav>

      {loading && <p>Loading candidate dossier…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {candidate && (
        <>
          <h1 className="text-2xl font-bold mb-4">{candidate.name}</h1>
          <p className="mb-2"><strong>Email:</strong> {candidate.email}</p>
          {candidate.phone && <p className="mb-2"><strong>Phone:</strong> {candidate.phone}</p>}

          {/* Requirements status chips – using EvidenceMatrix for visual chips */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Requirements Status</h2>
            <EvidenceMatrix
              candidates={[candidateRow]}
              requirements={requirements.map((r) => ({ id: r.id, label: r.title }))}
            />
          </section>

          {/* Evidence snippets */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Evidence Snippets</h2>
            {evidence.length === 0 ? (
              <p className="text-gray-500">No evidence items found.</p>
            ) : (
              <ul className="space-y-2">
                {evidence.map((ev) => (
                  <li key={ev.id} className="border p-2 rounded">
                    <p className="font-medium">{ev.type}</p>
                    {ev.description && <p className="text-sm">{ev.description}</p>}
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View source
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Validation gaps */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Validation Gaps</h2>
            {gaps.length === 0 ? (
              <p className="text-gray-500">No validation gaps.</p>
            ) : (
              <ul className="space-y-2">
                {gaps.map((g) => (
                  <li key={g.id} className="border p-2 rounded bg-yellow-50">
                    <p className="font-medium">{g.field}</p>
                    <p className="text-sm">{g.issue}</p>
                    {g.severity && (
                      <span className="text-xs text-gray-600">Severity: {g.severity}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
