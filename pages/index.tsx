import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const createWorkspace = async () => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hiring workspace' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/workspace/${data.workspace.id}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm tracking-widest text-gray-500 mb-4">EVIDENT</p>
        <h1 className="text-4xl font-bold mb-4">Evidence-grounded recruitment intelligence.</h1>
        <p className="text-lg text-gray-600 mb-2">
          EVIDENT does not decide who to hire. It organizes, validates, traces and
          updates the evidence recruiters need to make their own hiring decisions.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Job requirement → candidate claim → source evidence → uncertainty → interview
          question → response → updated evidence → auditable report.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/workspace/demo')}
            className="px-6 py-3 bg-gray-900 text-white rounded hover:bg-gray-700"
          >
            Open Demo Workspace
          </button>
          <button
            onClick={createWorkspace}
            className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50"
          >
            New Workspace
          </button>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          Demo uses clearly labelled synthetic data. No real people.
        </p>
      </main>
    </div>
  );
}
