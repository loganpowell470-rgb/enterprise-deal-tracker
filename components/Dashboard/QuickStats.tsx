"use client";

import { Users, Building2, Clock, AlertTriangle } from "lucide-react";
import { Stakeholder } from "@/lib/types";
import { daysSince } from "@/lib/utils";

interface Props {
  stakeholders: Stakeholder[];
}

export default function QuickStats({ stakeholders }: Props) {
  const totalStakeholders = stakeholders.length;

  const teams = new Set(stakeholders.map((s) => s.team));
  const engagedTeams = new Set(
    stakeholders
      .filter((s) => {
        const d = daysSince(s.lastContactDate);
        return d !== null && d < 30;
      })
      .map((s) => s.team)
  );

  const avgDaysSinceContact = stakeholders.length > 0
    ? Math.round(
        stakeholders.reduce((sum, s) => {
          const d = daysSince(s.lastContactDate);
          return sum + (d ?? 90);
        }, 0) / stakeholders.length
      )
    : 0;

  const atRiskCount = stakeholders.filter(
    (s) =>
      s.relationshipStrength === "At Risk" ||
      s.relationshipStrength === "Weak" ||
      (s.relationshipStrength === "Unknown" &&
        (s.role === "Economic Buyer" || s.role === "Blocker"))
  ).length;

  const stats = [
    {
      label: "Total Stakeholders",
      value: totalStakeholders,
      icon: Users,
      color: "bg-indigo-50 text-indigo-600",
      detail: `${stakeholders.filter((s) => s.priority === "P0").length} P0 priority`,
    },
    {
      label: "Team Coverage",
      value: `${engagedTeams.size}/${teams.size}`,
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600",
      detail: `${teams.size - engagedTeams.size} teams need attention`,
    },
    {
      label: "Avg Days Since Contact",
      value: avgDaysSinceContact,
      icon: Clock,
      color: avgDaysSinceContact > 25 ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600",
      detail: avgDaysSinceContact > 25 ? "Above target (25 days)" : "Within target",
    },
    {
      label: "At-Risk Relationships",
      value: atRiskCount,
      icon: AlertTriangle,
      color: atRiskCount > 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
      detail: `${stakeholders.filter((s) => s.relationshipStrength === "Strong").length} strong relationships`,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {stat.label}
              </span>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
