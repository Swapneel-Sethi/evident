import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/**
 * Side navigation for a specific workspace.
 * Provides links to the main sub‑pages of a workspace: Overview, Candidates,
 * Interview, Report, and Audit.
 *
 * The component derives the workspace id from the Next.js router query and
 * constructs the appropriate relative URLs. If the id is not yet available
 * (e.g., during static generation), the base path falls back to "/workspace".
 */
export default function WorkspaceNav() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const basePath = id ? `/workspace/${id}` : "/workspace";

  const links = [
    { href: `${basePath}/overview`, label: "Overview" },
    { href: `${basePath}/candidates`, label: "Candidates" },
    { href: `${basePath}/interview`, label: "Interview" },
    { href: `${basePath}/report`, label: "Report" },
    { href: `${basePath}/audit`, label: "Audit" },
  ];

  return (
    <nav className="flex flex-col space-y-2 p-4 bg-gray-50 w-48">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="block px-3 py-2 rounded hover:bg-gray-200">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
