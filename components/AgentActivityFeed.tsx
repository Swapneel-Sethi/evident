import React, { useEffect, useState } from 'react';

interface Activity {
  id: string;
  message: string;
  timestamp: string;
}

const POLL_INTERVAL_MS = 5000;

export const AgentActivityFeed: React.FC<{ workspaceId?: string }> = ({ workspaceId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      const qs = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
      const res = await fetch(`/api/activity${qs}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const data: Activity[] = Array.isArray(json) ? json : json.events ?? [];
      setActivities(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchActivities();
    // Poll periodically
    const timer = setInterval(fetchActivities, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div>Loading activity...</div>;
  }

  if (error) {
    return <div>Error loading activity: {error}</div>;
  }

  return (
    <ul className="space-y-2">
      {activities.map((act) => (
        <li key={act.id} className="border-b pb-2">
          <div className="font-medium">{act.message}</div>
          <div className="text-xs text-gray-500">{new Date(act.timestamp).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
};

export default AgentActivityFeed;
