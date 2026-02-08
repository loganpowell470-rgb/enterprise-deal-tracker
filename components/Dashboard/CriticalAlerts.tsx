"use client";

import { AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Stakeholder } from "@/lib/types";
import { daysSince } from "@/lib/utils";
import Link from "next/link";

interface Props {
  stakeholders: Stakeholder[];
}

interface Alert {
  severity: "critical" | "warning" | "info";
  message: string;
  stakeholderId?: string;
}

function generateAlerts(stakeholders: Stakeholder[]): Alert[] {
  const alerts: Alert[] = [];

  // Never contacted P0/blockers
  stakeholders
    .filter(
      (s) =>
        s.lastContactDate === null &&
        (s.priority === "P0" || s.role === "Blocker")
    )
    .forEach((s) => {
      alerts.push({
        severity: "critical",
        message: `${s.name} (${s.title}, ${s.role}) has NEVER been contacted`,
        stakeholderId: s.id,
      });
    });

  // At risk relationships with P0
  stakeholders
    .filter(
      (s) =>
        s.relationshipStrength === "At Risk" && s.priority === "P0"
    )
    .forEach((s) => {
      alerts.push({
        severity: "critical",
        message: `${s.name} (${s.role}) relationship is At Risk - ${daysSince(s.lastContactDate) ?? "never"} days since contact`,
        stakeholderId: s.id,
      });
    });

  // Long gap for Economic Buyers
  stakeholders
    .filter((s) => {
      const d = daysSince(s.lastContactDate);
      return s.role === "Economic Buyer" && d !== null && d > 40;
    })
    .forEach((s) => {
      alerts.push({
        severity: "critical",
        message: `Economic Buyer ${s.name} last contacted ${daysSince(s.lastContactDate)} days ago - renewal in ~60 days`,
        stakeholderId: s.id,
      });
    });

  // Entire teams unengaged
  const teams = new Map<string, Stakeholder[]>();
  stakeholders.forEach((s) => {
    if (!teams.has(s.team)) teams.set(s.team, []);
    teams.get(s.team)!.push(s);
  });
  teams.forEach((members, team) => {
    const allUncontacted = members.every((m) => m.lastContactDate === null);
    if (allUncontacted) {
      alerts.push({
        severity: "critical",
        message: `${team} team (${members.length} members) has zero engagement`,
      });
    }
  });

  // Champions cooling off
  stakeholders
    .filter((s) => {
      const d = daysSince(s.lastContactDate);
      return s.role === "Champion" && d !== null && d > 20;
    })
    .forEach((s) => {
      alerts.push({
        severity: "warning",
        message: `Champion ${s.name} hasn't been contacted in ${daysSince(s.lastContactDate)} days - keep momentum`,
        stakeholderId: s.id,
      });
    });

  // Weak relationships on key stakeholders
  stakeholders
    .filter(
      (s) =>
        s.relationshipStrength === "Weak" &&
        (s.role === "Economic Buyer" ||
          s.role === "Blocker" ||
          s.role === "Champion")
    )
    .forEach((s) => {
      if (!alerts.some((a) => a.stakeholderId === s.id)) {
        alerts.push({
          severity: "warning",
          message: `${s.name} (${s.role}) has a Weak relationship - invest in strengthening`,
          stakeholderId: s.id,
        });
      }
    });

  return alerts.slice(0, 8);
}

export default function CriticalAlerts({ stakeholders }: Props) {
  const alerts = generateAlerts(stakeholders);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Critical Alerts
        </h3>
        {criticalCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {criticalCount} critical
          </span>
        )}
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const Icon =
            alert.severity === "critical"
              ? AlertTriangle
              : alert.severity === "warning"
                ? AlertCircle
                : Info;
          const colors =
            alert.severity === "critical"
              ? "bg-red-50 border-red-200 text-red-800"
              : alert.severity === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-blue-50 border-blue-200 text-blue-800";
          const iconColor =
            alert.severity === "critical"
              ? "text-red-500"
              : alert.severity === "warning"
                ? "text-amber-500"
                : "text-blue-500";

          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${colors}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <span className="flex-1">{alert.message}</span>
              {alert.stakeholderId && (
                <Link
                  href={`/stakeholders/${alert.stakeholderId}`}
                  className="flex-shrink-0 opacity-60 hover:opacity-100"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href="/insights"
        className="flex items-center gap-1 mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        View AI-powered insights
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
