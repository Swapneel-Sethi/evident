// lib/demoData.ts - clearly labelled SYNTHETIC demo data. No real people.
export const DEMO_JD = `Backend Engineer (Node + Python)
Requirements: Production FastAPI experience, PostgreSQL schema design,
Docker containerization, AWS deployment (ECS or EKS), CI/CD with GitHub Actions.
Preferred: Redis caching, system design for high-throughput APIs.`;

export type DemoCandidate = {
  id: string;
  name: string;
  person: string;
  synthetic: true;
  resumeText: string;
  evidence: { requirement: string; status: string; claim: string; source: string; observation: string; question: string }[];
};

export const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: "demo-rahul",
    name: "Candidate A (synthetic)",
    person: "Rahul Mehta",
    synthetic: true,
    resumeText: "Name: Rahul Mehta. Built REST APIs using FastAPI for FinServe Platform. PostgreSQL schema design with 20+ tables. Docker listed in skills.",
    evidence: [
      { requirement: "FastAPI", status: "EVIDENCE FOUND", claim: "Built REST APIs using FastAPI", source: "Synthetic resume, Projects, FinServe Platform", observation: "Project evidence present.", question: "Describe request validation and auth in your FastAPI service." },
      { requirement: "PostgreSQL", status: "EVIDENCE FOUND", claim: "PostgreSQL schema design", source: "Synthetic resume, Experience", observation: "Schema work described.", question: "How did you handle migrations at scale?" },
      { requirement: "Docker", status: "NEEDS VALIDATION", claim: "Docker", source: "Synthetic resume, Skills section", observation: "Tool listed but no project evidence shows how used.", question: "Walk through a system you containerized and explain env config." },
      { requirement: "AWS", status: "NO EVIDENCE FOUND", claim: "-", source: "NO SOURCE EVIDENCE FOUND", observation: "No AWS mention.", question: "Have you deployed to any cloud? Describe setup." },
    ],
  },
  {
    id: "demo-neha",
    name: "Candidate B (synthetic)",
    person: "Neha Sharma",
    synthetic: true,
    resumeText: "Name: Neha Sharma. AWS ECS deployments, Docker multi-stage builds, CI/CD. Minor FastAPI bugfixes only.",
    evidence: [
      { requirement: "FastAPI", status: "PARTIAL EVIDENCE", claim: "Minor FastAPI bugfixes", source: "Synthetic resume, Experience", observation: "No owned FastAPI project.", question: "What FastAPI endpoints did you own end-to-end?" },
      { requirement: "Docker", status: "EVIDENCE FOUND", claim: "Docker multi-stage builds", source: "Synthetic resume, Projects", observation: "Build evidence present.", question: "How did you keep images small and secure?" },
      { requirement: "AWS", status: "EVIDENCE FOUND", claim: "AWS ECS deployments", source: "Synthetic resume, Experience", observation: "Prod deploy evidence present.", question: "How did prod differ from dev setup?" },
      { requirement: "PostgreSQL", status: "NEEDS VALIDATION", claim: "PostgreSQL", source: "Synthetic resume, Skills section", observation: "Listed only.", question: "Describe a schema you designed." },
    ],
  },
  {
    id: "demo-arjun",
    name: "Candidate C (synthetic)",
    person: "Arjun Patel",
    synthetic: true,
    resumeText: "Name: Arjun Patel. Backend services in Python, PostgreSQL queries, Docker Compose local dev. System design unclear.",
    evidence: [
      { requirement: "FastAPI", status: "NEEDS VALIDATION", claim: "Python backend services", source: "Synthetic resume, Experience", observation: "Framework unclear.", question: "Which framework? Show one endpoint you built." },
      { requirement: "PostgreSQL", status: "EVIDENCE FOUND", claim: "PostgreSQL queries", source: "Synthetic resume, Experience", observation: "Query evidence only.", question: "Did you design schemas or only query?" },
      { requirement: "Docker", status: "PARTIAL EVIDENCE", claim: "Docker Compose local dev", source: "Synthetic resume, Projects", observation: "Local only, prod unclear.", question: "How did production deployment differ from Compose?" },
      { requirement: "AWS", status: "NO EVIDENCE FOUND", claim: "-", source: "NO SOURCE EVIDENCE FOUND", observation: "No cloud evidence.", question: "Any cloud deploy experience?" },
    ],
  },
];

export const DEMO_FOLLOWUP_EXAMPLE = {
  answer: "I used Docker Compose with FastAPI, PostgreSQL and Redis for dev.",
  analysis: "Docker usage now stronger. Production deployment still unclear.",
  followUp: "You described the local Compose setup. How did production deployment differ from dev?",
  statusChange: "Docker: NEEDS VALIDATION -> PARTIALLY VALIDATED",
};
