// EvidenceMatrix component – renders a matrix of candidates vs requirements
// with status icons (✅ pass, ❌ fail, ❓ unknown).
//
// Props:
//   candidates: array of objects containing id, name, and an evidence map.
//   requirements: array of requirement objects with id and label.
//
// Example shape:
//   candidates = [{ id: "c1", name: "Alice", evidence: { r1: "pass", r2: "fail" } }];
//   requirements = [{ id: "r1", label: "Requirement 1" }, { id: "r2", label: "Requirement 2" }];

import React from "react";

type EvidenceMatrixProps = {
  candidates: {
    id: string;
    name: string;
    // Map from requirement id to status string
    evidence: { [requirementId: string]: "pass" | "fail" | "unknown" };
  }[];
  requirements: {
    id: string;
    label: string;
  }[];
};

function statusIcon(status: "pass" | "fail" | "unknown"): React.ReactElement {
  switch (status) {
    case "pass":
      return <span title="Pass">✅</span>;
    case "fail":
      return <span title="Fail">❌</span>;
    case "unknown":
    default:
      return <span title="Unknown">❓</span>;
  }
}

export default function EvidenceMatrix({ candidates, requirements }: EvidenceMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b"></th>
            {requirements.map((req) => (
              <th key={req.id} className="px-4 py-2 border-b text-center">
                {req.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((cand) => (
            <tr key={cand.id} className="border-t">
              <th className="px-4 py-2 border-r text-left bg-gray-50">
                {cand.name}
              </th>
              {requirements.map((req) => (
                <td key={req.id} className="px-4 py-2 text-center border-r">
                  {statusIcon(cand.evidence?.[req.id] ?? "unknown")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
