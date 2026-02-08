"use client";

import { Stakeholder } from "@/lib/types";
import { daysSince } from "@/lib/utils";

interface Props {
  stakeholders: Stakeholder[];
}

const roleOrder = [
  "Economic Buyer",
  "Champion",
  "Technical Buyer",
  "Blocker",
  "Influencer",
  "End User",
];

export default function CoverageMap({ stakeholders }: Props) {
  const teams = [...new Set(stakeholders.map(s => s.team))].sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Stakeholder Coverage Map
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 font-medium text-slate-600 w-44">
                Team
              </th>
              <th className="text-center py-2 px-2 font-medium text-slate-600">
                Members
              </th>
              <th className="text-center py-2 px-2 font-medium text-slate-600">
                Engaged
              </th>
              <th className="text-left py-2 pl-4 font-medium text-slate-600">
                Key Roles
              </th>
              <th className="text-center py-2 px-2 font-medium text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const members = stakeholders.filter((s) => s.team === team);
              const engaged = members.filter((s) => {
                const d = daysSince(s.lastContactDate);
                return d !== null && d < 30;
              });
              const hasBlocker = members.some(
                (s) =>
                  s.role === "Blocker" &&
                  (s.relationshipStrength === "At Risk" ||
                    s.relationshipStrength === "Unknown" ||
                    s.relationshipStrength === "Weak")
              );
              const neverContacted = members.filter(
                (s) => s.lastContactDate === null
              );
              const coveragePercent =
                members.length > 0
                  ? Math.round((engaged.length / members.length) * 100)
                  : 0;

              let statusColor = "bg-emerald-100 text-emerald-700";
              let statusLabel = "Good";
              if (neverContacted.length === members.length) {
                statusColor = "bg-red-100 text-red-700";
                statusLabel = "No Contact";
              } else if (hasBlocker || coveragePercent < 33) {
                statusColor = "bg-red-100 text-red-700";
                statusLabel = "At Risk";
              } else if (coveragePercent < 66) {
                statusColor = "bg-amber-100 text-amber-700";
                statusLabel = "Partial";
              }

              return (
                <tr key={team} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-slate-900">{team}</span>
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600">
                    {members.length}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={
                        engaged.length === members.length
                          ? "text-emerald-600 font-medium"
                          : engaged.length === 0
                            ? "text-red-600 font-medium"
                            : "text-amber-600 font-medium"
                      }
                    >
                      {engaged.length}/{members.length}
                    </span>
                  </td>
                  <td className="py-3 pl-4">
                    <div className="flex flex-wrap gap-1">
                      {members
                        .sort(
                          (a, b) =>
                            roleOrder.indexOf(a.role) -
                            roleOrder.indexOf(b.role)
                        )
                        .map((m) => {
                          const d = daysSince(m.lastContactDate);
                          const isEngaged = d !== null && d < 30;
                          return (
                            <span
                              key={m.id}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                isEngaged
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-red-50 text-red-600 ring-1 ring-red-200"
                              }`}
                              title={`${m.name} - ${m.role} - ${m.relationshipStrength}`}
                            >
                              {m.name.split(" ")[0]}
                              <span className="ml-0.5 opacity-60">
                                ({m.role.split(" ")[0]})
                              </span>
                            </span>
                          );
                        })}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
