// lib/types.ts
/**
 * Core data‑model interfaces for the Evident hiring platform.
 */

export interface JobRequirement {
  /** Unique identifier for the job requirement */
  id: string;
  /** Human‑readable title of the position */
  title: string;
  /** Detailed description of the role */
  description: string;
  /** List of required skills */
  requiredSkills: string[];
  /** Minimum years of relevant experience */
  minExperienceYears?: number;
  /** Location of the role (e.g. "New York, NY") */
  location?: string;
  /** Whether the role can be performed remotely */
  remoteAllowed?: boolean;
}

export interface CandidateProfile {
  /** Unique identifier for the candidate */
  id: string;
  /** Full name of the candidate */
  name: string;
  /** Contact email */
  email: string;
  /** Phone number (optional) */
  phone?: string;
  /** List of skills the candidate claims */
  skills: string[];
  /** Years of professional experience */
  experienceYears?: number;
  /** Educational background */
  education?: string[];
  /** URL to the candidate's resume */
  resumeUrl?: string;
  /** URL to a portfolio or personal website */
  portfolioUrl?: string;
}

export interface EvidenceItem {
  /** Unique identifier for the evidence item */
  id: string;
  /** Identifier of the candidate this evidence belongs to */
  candidateId: string;
  /** Type of evidence (e.g. "Resume", "Portfolio", "Reference", "Test") */
  type: "Resume" | "Portfolio" | "Reference" | "Test" | string;
  /** Short description of the evidence */
  description?: string;
  /** URL where the evidence can be accessed */
  url: string;
  /** Timestamp when the evidence was added (ISO‑8601) */
  createdAt: string;
}

export interface ValidationGap {
  /** Unique identifier for the validation gap */
  id: string;
  /** The evidence item this gap refers to */
  evidenceItemId: string;
  /** Field or aspect that is missing/invalid */
  field: string;
  /** Description of the issue */
  issue: string;
  /** Severity of the gap (e.g. "low", "medium", "high") */
  severity?: "low" | "medium" | "high" | string;
  /** Whether the gap has been resolved */
  resolved: boolean;
  /** Timestamp of last update (ISO‑8601) */
  updatedAt?: string;
}

export interface InterviewQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Identifier of the job requirement this question belongs to (optional) */
  jobRequirementId?: string;
  /** The question text */
  text: string;
  /** Category of the question */
  category?: "Technical" | "Behavioral" | "Cultural" | "HR" | string;
  /** Difficulty rating from 1 (easy) to 5 (hard) */
  difficulty?: number;
}

export interface InterviewResponse {
  /** Unique identifier for the response */
  id: string;
  /** Identifier of the related question */
  questionId: string;
  /** Identifier of the candidate */
  candidateId: string;
  /** Free‑form answer text */
  answer: string;
  /** Numeric rating given by the interviewer (optional) */
  rating?: number;
  /** Timestamp when the response was recorded (ISO‑8601) */
  recordedAt: string;
}

export interface EvaluationReport {
  /** Unique identifier for the report */
  id: string;
  /** Identifier of the candidate being evaluated */
  candidateId: string;
  /** Identifier of the job requirement */
  jobRequirementId: string;
  /** Overall score (0–100) */
  overallScore: number;
  /** Executive summary of the evaluation */
  summary: string;
  /** Recommendations for next steps */
  recommendations?: string[];
  /** When the report was generated (ISO‑8601) */
  createdAt: string;
}

export interface AuditEvent {
  /** Unique identifier for the audit event */
  id: string;
  /** Timestamp of the event (ISO-8601) */
  timestamp: string;
  /** Event type, e.g. extract_job_requirements, analyze_candidates */
  type: string;
  /** Who performed the action */
  performedBy: string;
  /** Human-readable details */
  details: string;
  /** Optional related entity id */
  entityId?: string;
}
