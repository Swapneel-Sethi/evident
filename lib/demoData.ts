// lib/demoData.ts - clearly labelled SYNTHETIC demo data. No real people.
export const DEMO_JD = `Backend Engineer (Node + Python)
Requirements: Production FastAPI experience, PostgreSQL schema design,
Docker containerization, AWS deployment (ECS or EKS), CI/CD with GitHub Actions.
Preferred: Redis caching, Infrastructure as Code with Terraform.`;

export const DEMO_REQUIREMENTS = [
  { key: "python", name: "Python", category: "technical_skill", importance: "required", description: "Python backend services" },
  { key: "fastapi", name: "FastAPI", category: "technical_skill", importance: "required", description: "Production FastAPI experience" },
  { key: "postgresql", name: "PostgreSQL", category: "technical_skill", importance: "required", description: "PostgreSQL schema design" },
  { key: "docker", name: "Docker", category: "technical_skill", importance: "required", description: "Docker containerization" },
  { key: "aws", name: "AWS", category: "infrastructure", importance: "required", description: "AWS deployment (ECS or EKS)" },
  { key: "cicd", name: "CI/CD", category: "infrastructure", importance: "required", description: "CI/CD with GitHub Actions" },
  { key: "redis", name: "Redis", category: "technical_skill", importance: "preferred", description: "Redis caching" },
  { key: "terraform", name: "Terraform", category: "infrastructure", importance: "preferred", description: "Infrastructure as Code with Terraform" },
];

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
    resumeText: "Name: Rahul Mehta. Python backend services. Built REST APIs using FastAPI for FinServe Platform. PostgreSQL schema design with 20+ tables. Docker listed in skills.",
    evidence: [
      { requirement: "Python", status: "EVIDENCE FOUND", claim: "Python backend services", source: "Synthetic resume, Experience", observation: "Python experience present.", question: "" },
      { requirement: "FastAPI", status: "EVIDENCE FOUND", claim: "Built REST APIs using FastAPI", source: "Synthetic resume, Projects, FinServe Platform", observation: "Project evidence present.", question: "" },
      { requirement: "PostgreSQL", status: "EVIDENCE FOUND", claim: "PostgreSQL schema design", source: "Synthetic resume, Experience", observation: "Schema work described.", question: "" },
      { requirement: "Docker", status: "NEEDS VALIDATION", claim: "Docker listed in skills", source: "Synthetic resume, Skills section", observation: "Tool listed but depth not yet established.", question: "Walk through a system you containerized and explain env config." },
      { requirement: "AWS", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Have you deployed to any cloud? Describe setup." },
      { requirement: "CI/CD", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Do you have experience with CI/CD pipelines?" },
      { requirement: "Redis", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Have you used Redis for caching?" },
      { requirement: "Terraform", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Do you have experience with IaC or Terraform?" },
    ],
  },
  {
    id: "demo-neha",
    name: "Candidate B (synthetic)",
    person: "Neha Sharma",
    synthetic: true,
    resumeText: "Name: Neha Sharma. AWS ECS deployments, Docker multi-stage builds, CI/CD with GitHub Actions. Minor FastAPI bugfixes only. PostgreSQL listed.",
    evidence: [
      { requirement: "Python", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Do you have experience with Python?" },
      { requirement: "FastAPI", status: "PARTIAL EVIDENCE", claim: "Minor FastAPI bugfixes", source: "Synthetic resume, Experience", observation: "No owned FastAPI project.", question: "What FastAPI endpoints did you own end-to-end?" },
      { requirement: "PostgreSQL", status: "NEEDS VALIDATION", claim: "PostgreSQL listed", source: "Synthetic resume, Skills section", observation: "Listed only.", question: "Describe a schema you designed." },
      { requirement: "Docker", status: "EVIDENCE FOUND", claim: "Docker multi-stage builds", source: "Synthetic resume, Projects", observation: "Build evidence present.", question: "" },
      { requirement: "AWS", status: "EVIDENCE FOUND", claim: "AWS ECS deployments", source: "Synthetic resume, Experience", observation: "Prod deploy evidence present.", question: "" },
      { requirement: "CI/CD", status: "EVIDENCE FOUND", claim: "CI/CD with GitHub Actions", source: "Synthetic resume, Projects", observation: "Pipeline evidence present.", question: "" },
      { requirement: "Redis", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Have you used Redis for caching?" },
      { requirement: "Terraform", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Do you have experience with Terraform?" },
    ],
  },
  {
    id: "demo-arjun",
    name: "Candidate C (synthetic)",
    person: "Arjun Patel",
    synthetic: true,
    resumeText: "Name: Arjun Patel. Backend services in Python, PostgreSQL queries, Docker Compose local dev. Framework unclear.",
    evidence: [
      { requirement: "Python", status: "EVIDENCE FOUND", claim: "Backend services in Python", source: "Synthetic resume, Experience", observation: "Python experience present.", question: "" },
      { requirement: "FastAPI", status: "NEEDS VALIDATION", claim: "Backend services", source: "Synthetic resume, Experience", observation: "Framework unclear.", question: "Which framework? Show one endpoint you built." },
      { requirement: "PostgreSQL", status: "EVIDENCE FOUND", claim: "PostgreSQL queries", source: "Synthetic resume, Experience", observation: "Query evidence present.", question: "" },
      { requirement: "Docker", status: "PARTIAL EVIDENCE", claim: "Docker Compose local dev", source: "Synthetic resume, Projects", observation: "Local only, prod unclear.", question: "How did production deployment differ from Compose?" },
      { requirement: "AWS", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No cloud evidence.", question: "Any cloud deploy experience?" },
      { requirement: "CI/CD", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Any CI/CD experience?" },
      { requirement: "Redis", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Any caching experience?" },
      { requirement: "Terraform", status: "NO EVIDENCE FOUND", claim: "", source: "NO SOURCE EVIDENCE FOUND", observation: "No mention found in document.", question: "Any Terraform experience?" },
    ],
  },
];

export const DEMO_FOLLOWUP_EXAMPLE = {
  answer: "I used Docker Compose with FastAPI, PostgreSQL and Redis for dev.",
  analysis: "Docker usage now stronger. Production deployment still unclear.",
  followUp: "You described the local Compose setup. How did production deployment differ from dev?",
  statusChange: "Docker: NEEDS VALIDATION -> PARTIALLY VALIDATED",
};
