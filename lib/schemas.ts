// lib/schemas.ts – Zod validation schemas for API endpoints and orchestrator I/O

import { z } from "zod";

/**
 * Shared schema representing a storage source reference.
 */
export const SourceSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  url: z.string().nullable(),
});

/**
 * Request payload for the /api/upload-job endpoint.
 */
export const UploadJobRequestSchema = z.object({
  workspaceId: z.string(),
  title: z.string().optional(),
});

/**
 * Response payload for the /api/upload-job endpoint.
 */
export const UploadJobResponseSchema = z.object({
  id: z.any(), // Primary key from Supabase – could be number or string.
  title: z.string(),
  workspace_id: z.any(),
  content: z.object({
    text: z.string(),
    source: SourceSchema,
  }),
});

/**
 * Optional schema for the generic /api/upload endpoint response.
 */
export const UploadResponseSchema = z.object({
  text: z.string(),
  source: SourceSchema,
});

// ---------------------------------------------------------------------------
// Orchestrator function input / output schemas. These mirror the signatures
// in lib/orchestrator.ts. In many cases the exact shape is dynamic, so we use
// z.any() for outputs while keeping strict inputs.
// ---------------------------------------------------------------------------

export const ExtractJobRequirementsRequestSchema = z.object({
  input: z.string(),
});
export const ExtractJobRequirementsResponseSchema = z.any();

export const ExtractCandidateProfileRequestSchema = z.object({
  input: z.string(),
});
export const ExtractCandidateProfileResponseSchema = z.any();

export const MapCandidateEvidenceRequestSchema = z.object({
  requirements: z.any(),
  candidate: z.any(),
});
export const MapCandidateEvidenceResponseSchema = z.any();

export const IdentifyValidationGapsRequestSchema = z.object({
  requirements: z.any(),
  evidence: z.any(),
});
export const IdentifyValidationGapsResponseSchema = z.any();

export const GenerateInterviewPlanRequestSchema = z.object({
  evidence: z.any(),
  gaps: z.any(),
});
export const GenerateInterviewPlanResponseSchema = z.any();

/**
 * Schema for the request body sent to the interview analysis endpoint.
 * The API expects a `response` (candidate answer) and an `interviewPlan`
 * generated earlier. For richer validation we capture the shape used by the
 * orchestrator.
 */
export const AnalyzeInterviewResponseRequestSchema = z.object({
  question: z.string(),
  answer: z.string(),
  requirement: z.any(),
  evidence: z.any(),
});
export const AnalyzeInterviewResponseResponseSchema = z.any();

export const GenerateFollowUpRequestSchema = z.object({
  evidenceState: z.any(),
});
export const GenerateFollowUpResponseSchema = z.any();

export const UpdateEvidenceMapRequestSchema = z.object({
  newEvidence: z.any(),
});
export const UpdateEvidenceMapResponseSchema = z.any();

export const QueryCandidatePoolRequestSchema = z.object({
  query: z.string(),
});
export const QueryCandidatePoolResponseSchema = z.any();

export const GenerateEvaluationReportRequestSchema = z.object({
  state: z.any(),
});
export const GenerateEvaluationReportResponseSchema = z.any();

export const RecordAuditEventRequestSchema = z.object({
  event: z.any(),
});
export const RecordAuditEventResponseSchema = z.void();
