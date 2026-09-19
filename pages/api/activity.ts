// pages/api/activity.ts
// API route to list recent audit events for a workspace (GET) and record a new activity event (POST).

import type { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabaseClient';
import type { AuditEvent } from '@/lib/types';

/**
 * GET  – expects a query parameter `workspaceId` and returns the most recent audit events.
 * POST – expects JSON body `{ workspaceId, type, payload }` and inserts a new audit event.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ---------------------------------------------------------------------
  //  GET – List recent audit events for a workspace
  // ---------------------------------------------------------------------
  if (req.method === 'GET') {
    const { workspaceId } = req.query as { workspaceId?: string };
    if (!workspaceId) {
      return res.status(200).json({ events: [] });
    }

    const { data, error } = await supabase
      .from('audit_events')
      .select('id, created_at, event_type, payload')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch audit events:', error);
      return res.status(500).json({ error: 'Failed to fetch audit events' });
    }

    // Convert rows to the AuditEvent interface shape. The DB stores the timestamp in `created_at`.
    const events: AuditEvent[] = (data ?? []).map((row: any) => ({
      id: row.id,
      timestamp: row.created_at,
      type: row.event_type,
      performedBy: row.payload?.performedBy ?? '',
      details: row.payload?.details ?? '',
      entityId: row.payload?.entityId,
    }));

    return res.status(200).json({ events });
  }

  // ---------------------------------------------------------------------
  //  POST – Record a new activity / audit event
  // ---------------------------------------------------------------------
  if (req.method === 'POST') {
    const {
      workspaceId,
      type,
      payload,
    } = req.body as {
      workspaceId?: string;
      type?: string;
      payload?: any;
    };

    if (!workspaceId || !type || payload === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: workspaceId, type, payload',
      });
    }

    const { data, error } = await supabase
      .from('audit_events')
      .insert([
        {
          workspace_id: workspaceId,
          event_type: type,
          payload,
        },
      ])
      .select();

    if (error) {
      console.error('Failed to insert audit event:', error);
      return res.status(500).json({ error: 'Failed to record activity' });
    }

    const inserted = data && data[0];
    const event: AuditEvent = {
      id: inserted.id,
      timestamp: inserted.created_at,
      type: inserted.event_type,
      performedBy: inserted.payload?.performedBy ?? '',
      details: inserted.payload?.details ?? '',
      entityId: inserted.payload?.entityId,
    };

    return res.status(201).json({ event });
  }

  // ---------------------------------------------------------------------
  //  Unsupported method handling
  // ---------------------------------------------------------------------
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
