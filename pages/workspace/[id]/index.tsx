import { useRouter } from 'next/router';
import { useState } from 'react';

interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
}

// Simple activity feed component
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="text-lg font-semibold mb-2">Activity Feed</h2>
      {events.length === 0 ? (
        <p className="text-gray-500">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="text-sm">
              <span className="text-gray-500">{new Date(ev.timestamp).toLocaleString()}:</span>{' '}
              {ev.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addActivity = (msg: string) => {
    setActivity((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), message: msg },
    ]);
  };

  const uploadJobFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('workspaceId', id || '');
    const res = await fetch('/api/upload-job', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return await res.json();
  };

  const uploadResumeFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('workspaceId', id || '');
    const res = await fetch('/api/upload-resume', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return await res.json();
  };

  const handleJdUpload = async () => {
    if (!jdFile) return;
    setLoading(true);
    try {
      addActivity('Uploading Job Description...');
      await uploadJobFile(jdFile);
      addActivity('Job Description uploaded.');
    } catch (e: any) {
      addActivity(`JD upload error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async () => {
    if (resumeFiles.length === 0) return;
    setLoading(true);
    try {
      for (const file of resumeFiles) {
        addActivity(`Uploading resume ${file.name}...`);
        await uploadResumeFile(file);
        addActivity(`Resume ${file.name} uploaded.`);
      }
    } catch (e: any) {
      addActivity(`Resume upload error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      addActivity('Analyzing candidates...');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analyze failed');
      }
      const data = await res.json();
      setAnalysisResult(JSON.stringify(data, null, 2));
      addActivity('Analysis completed.');
    } catch (e: any) {
      addActivity(`Analysis error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Workspace navigation */}
      <nav className="flex items-center mb-6">
        <button
          className="text-blue-600 hover:underline mr-2"
          onClick={() => router.push('/workspace')}
        >
          ← Back to workspaces
        </button>
        <span className="font-medium">Workspace {id}</span>
      </nav>

      {/* JD upload */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Job Description</h2>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="mb-2"
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleJdUpload}
          disabled={!jdFile || loading}
        >
          Upload JD
        </button>
      </section>

      {/* Resume multi‑upload */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Resumes</h2>
        <input
          type="file"
          accept=".pdf,.txt"
          multiple
          onChange={(e) => setResumeFiles(Array.from(e.target.files ?? []))}
          disabled={loading}
          className="mb-2"
        />
        <button
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={handleResumeUpload}
          disabled={resumeFiles.length === 0 || loading}
        >
          Upload Resumes
        </button>
      </section>

      {/* Analyze Candidates */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={loading}
        >
          Analyze Candidates
        </button>
        {analysisResult && (
          <pre className="mt-4 p-2 bg-gray-100 overflow-auto rounded">
            {analysisResult}
          </pre>
        )}
      </section>

      {/* Activity Feed */}
      <section className="mb-6">
        <ActivityFeed events={activity} />
      </section>
    </div>
  );
}
