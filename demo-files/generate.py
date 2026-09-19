"""Generate synthetic demo PDFs for EVIDENT (clearly labelled, no real people)."""
from fpdf import FPDF
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))

def pdf(title: str, sections: list[tuple[str, list[str]]], filename: str):
    doc = FPDF()
    doc.set_auto_page_break(auto=True, margin=20)
    doc.add_page()
    doc.set_font("Helvetica", "B", 18)
    doc.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
    doc.set_font("Helvetica", "I", 9)
    doc.set_text_color(120, 120, 120)
    doc.cell(0, 6, "SYNTHETIC TEST DOCUMENT for EVIDENT - not a real person or vacancy.", new_x="LMARGIN", new_y="NEXT")
    doc.set_text_color(0, 0, 0)
    doc.ln(4)
    for heading, bullets in sections:
        doc.set_font("Helvetica", "B", 13)
        doc.cell(0, 8, heading, new_x="LMARGIN", new_y="NEXT")
        doc.set_font("Helvetica", "", 11)
        for b in bullets:
            doc.set_x(10)
            doc.multi_cell(190, 6, "- " + b)
        doc.ln(2)
    path = os.path.join(OUT, filename)
    doc.output(path)
    print("wrote", path)

pdf("Senior Backend Engineer - FinServe Labs", [
    ("Role Overview", [
        "Design and operate reliable Python APIs and event-driven services for a fintech platform.",
        "Location: Bengaluru / Hybrid. Employment: Full-time. Experience: 3+ years.",
    ]),
    ("Required Qualifications", [
        "Python: strong production experience writing maintainable backend services.",
        "FastAPI: hands-on experience building REST APIs using FastAPI in a real project.",
        "PostgreSQL: schema design, non-trivial SQL, query performance.",
        "Docker: containerizing backend services; explain dev vs production deployments.",
        "AWS: deploying or operating services on EC2, ECS, RDS, S3 or CloudWatch.",
        "CI/CD: automated build, test and deploy pipelines (GitHub Actions or similar).",
    ]),
    ("Preferred Qualifications", [
        "Redis caching, background jobs, tracing and monitoring.",
        "Terraform infrastructure as code.",
    ]),
], "EVIDENT_Test_JD_Backend_Engineer.pdf")

pdf("Rahul Mehta - Backend Engineer (SYNTHETIC)", [
    ("Contact", ["rahul.mehta.synthetic@example.com | Bengaluru, India"]),
    ("Experience", [
        "Backend Engineer, FinServe Labs (2022-Present): built REST APIs using FastAPI serving 50k requests per day; added request validation and JWT authentication.",
        "Designed PostgreSQL schemas with 20+ tables; rewrote slow queries cutting p95 latency by 40 percent.",
    ]),
    ("Projects", [
        "FinServe Platform: FastAPI + PostgreSQL service for transaction reporting, deployed with CI/CD.",
    ]),
    ("Skills", ["Python, FastAPI, PostgreSQL, Docker, Git, Linux"]),
    ("Education", ["B.E. Computer Science, 2021"]),
], "EVIDENT_Test_Resume_Rahul_Mehta.pdf")

pdf("Neha Sharma - Cloud Backend Engineer (SYNTHETIC)", [
    ("Contact", ["neha.sharma.synthetic@example.com | Remote, India"]),
    ("Experience", [
        "Backend Engineer, CloudKart (2021-Present): own AWS ECS deployments across staging and production; Docker multi-stage builds cutting image size by 60 percent.",
        "Built GitHub Actions CI/CD with automated migrations and rollback.",
        "Minor FastAPI bugfixes on internal admin endpoints.",
    ]),
    ("Projects", [
        "ECS rollout: migrated three services from EC2 to ECS with CloudWatch alarms.",
    ]),
    ("Skills", ["AWS, Docker, Python, PostgreSQL, Terraform, GitHub Actions"]),
    ("Education", ["B.Tech Information Technology, 2020"]),
], "EVIDENT_Test_Resume_Neha_Sharma.pdf")

pdf("Arjun Patel - Python Developer (SYNTHETIC)", [
    ("Contact", ["arjun.patel.synthetic@example.com | Pune, India"]),
    ("Experience", [
        "Python Developer, DataWings (2022-Present): backend services in Python; wrote PostgreSQL queries for analytics dashboards.",
        "Used Docker Compose with FastAPI, PostgreSQL and Redis for the local development environment.",
    ]),
    ("Projects", [
        "Reporting API: Python service exposing CSV exports; local-only Docker Compose setup.",
    ]),
    ("Skills", ["Python, PostgreSQL, Docker, REST APIs"]),
    ("Education", ["B.Sc Computer Science, 2021"]),
], "EVIDENT_Test_Resume_Arjun_Patel.pdf")
