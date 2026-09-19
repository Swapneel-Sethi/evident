import { useRouter } from "next/router";
import { Shell, Eyebrow, Err, Skeletons, Timeline, fmtTime, useWorkspaceState } from "../../../components/ui";

const LABELS: Record<string, string> = {
  jd_uploaded: "DOCUMENT INGESTION", resume_uploaded: "DOCUMENT INGESTION",
  analysis_started: "ANALYSIS", requirements_extracted: "REQUIREMENT EXTRACTION",
  evidence_mapped: "EVIDENCE MAPPING", analysis_complete: "ANALYSIS",
  response_analyzed: "INTERVIEW ANALYSIS", evidence_updated: "EVIDENCE UPDATE",
  followup_generated: "FOLLOW-UP", query_executed: "EVIDENCE QUERY",
  sample_loaded: "SAMPLE", analyze_candidate_once: "EVIDENCE MAPPING",
  extract_job_requirements: "REQUIREMENT EXTRACTION", extract_candidate_profile: "DOCUMENT EXTRACTION",
  map_candidate_evidence: "EVIDENCE MAPPING", generate_interview_plan: "INTERVIEW PLANNING",
  analyze_interview_response: "INTERVIEW ANALYSIS", generate_follow_up: "FOLLOW-UP",
};

export default function Audit() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { state, loading, error, reload } = useWorkspaceState(id);

  if (loading) return <Shell workspaceId={id} title="Every conclusion leaves a trail."><Skeletons n={5} /></Shell>;
  if (error || !state) return <Shell workspaceId={id} title="Every conclusion leaves a trail."><Err message="Failed to load audit trail." retry={reload} /></Shell>;

  return (
    <Shell workspaceId={id} title="Every conclusion leaves a trail."
      subtitle="Chronological record of document processing, AI operations, evidence links and interview updates.">
      <Eyebrow>AUDITABILITY</Eyebrow>
      <div className="card">
        <Timeline events={state.activity.map((a: any) => {
          const { reqKey, req_key, candidateDocId, candidate_doc_id, ...rest } = a.payload || {};
          void reqKey; void req_key; void candidateDocId; void candidate_doc_id;
          const body = [a.label, Object.entries(rest).slice(0, 2).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v)}`).join(" · ")]
            .filter(Boolean).join(" — ");
          return {
            id: a.id, time: fmtTime(a.created_at),
            title: `${LABELS[a.event_type] || a.event_type.replace(/_/g, " ").toUpperCase()} — ${(a.event_type || "").replace(/_/g, " ")}`,
            body: body || undefined,
          };
        })} />
      </div>
    </Shell>
  );
}
