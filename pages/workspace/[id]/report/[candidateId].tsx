import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type Report = {
  candidateId: string;
  overallScore: number;
  summary: string;
  recommendations?: string[];
  createdAt: string;
};

export default function ReportPage() {
  const router = useRouter();
  const { id: workspaceId, candidateId } = router.query as { id?: string; candidateId?: string };
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    fetch(`/api/evaluation/${candidateId}?workspaceId=${encodeURIComponent(workspaceId || '')}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Report fetch failed (${res.status})`);
        return res.json();
      })
      .then((json) => setReport(json.report ?? json))
      .catch((e) => setError(e.message));
  }, [candidateId, workspaceId]);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!report) return <div className="p-4">Loading report…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4">← Back</button>
      <h1 className="text-2xl font-bold mb-4">Evaluation Report for {report.candidateId}</h1>
      <p className="mb-2"><strong>Score:</strong> {report.overallScore}</p>
      <p className="mb-2"><strong>Summary:</strong> {report.summary}</p>
      {report.recommendations && report.recommendations.length > 0 && (
        <ul className="list-disc pl-5">
          {report.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
        </ul>
      )}
      <p className="mt-4 text-sm text-gray-500">Human review required. EVIDENT does not make hiring decisions.</p>
    </div>
  );
}
