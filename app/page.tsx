"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { Stakeholder, Activity } from "@/lib/types";
import DealHealthScore from "@/components/Dashboard/DealHealthScore";
import QuickStats from "@/components/Dashboard/QuickStats";
import CoverageMap from "@/components/Dashboard/CoverageMap";
import CriticalAlerts from "@/components/Dashboard/CriticalAlerts";
import RecentActivity from "@/components/Dashboard/RecentActivity";

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function computeScore(stakeholders: Stakeholder[]) {
  if (stakeholders.length === 0) {
    return { score: 0, factors: [{ label: "No stakeholders", impact: 0, detail: "Add stakeholders to start tracking deal health" }] };
  }

  let score = 50;
  const factors: { label: string; impact: number; detail: string }[] = [];

  const champions = stakeholders.filter((s) => s.role === "Champion");
  const strongChampions = champions.filter((s) => s.relationshipStrength === "Strong");
  if (strongChampions.length >= 2) { score += 15; factors.push({ label: "Strong champions", impact: 15, detail: `${strongChampions.length} strong champion relationships` }); }
  else if (strongChampions.length === 1) { score += 8; factors.push({ label: "Champion coverage", impact: 8, detail: "1 strong champion, need backup" }); }

  const econBuyers = stakeholders.filter((s) => s.role === "Economic Buyer");
  const engagedBuyers = econBuyers.filter((s) => { const d = daysSince(s.lastContactDate); return d !== null && d < 30 && s.relationshipStrength !== "Weak"; });
  if (engagedBuyers.length === econBuyers.length && econBuyers.length > 0) { score += 15; factors.push({ label: "Economic buyer engagement", impact: 15, detail: "All economic buyers recently engaged" }); }
  else { score -= 10; factors.push({ label: "Economic buyer gap", impact: -10, detail: `${econBuyers.length - engagedBuyers.length} of ${econBuyers.length} economic buyers not recently engaged` }); }

  const blockers = stakeholders.filter((s) => s.role === "Blocker");
  const unengaged = blockers.filter((s) => { const d = daysSince(s.lastContactDate); return d === null || d > 30 || s.relationshipStrength === "At Risk" || s.relationshipStrength === "Unknown"; });
  if (unengaged.length > 0) { const p = -8 * unengaged.length; score += p; factors.push({ label: "Unmanaged blockers", impact: p, detail: `${unengaged.length} blocker(s) not engaged or at risk` }); }

  const teams = new Set(stakeholders.map((s) => s.team));
  const engagedTeams = new Set(stakeholders.filter((s) => { const d = daysSince(s.lastContactDate); return d !== null && d < 45; }).map((s) => s.team));
  const cp = teams.size > 0 ? Math.round(engagedTeams.size / teams.size * 10) : 0;
  score += cp; factors.push({ label: "Team coverage", impact: cp, detail: `${engagedTeams.size} of ${teams.size} teams recently engaged` });

  const strong = stakeholders.filter((s) => s.relationshipStrength === "Strong").length;
  const atRisk = stakeholders.filter((s) => s.relationshipStrength === "At Risk" || s.relationshipStrength === "Weak").length;
  const hp = Math.min(10, Math.round((strong / stakeholders.length) * 15) - Math.round((atRisk / stakeholders.length) * 10));
  score += hp; factors.push({ label: "Relationship health", impact: hp, detail: `${strong} strong, ${atRisk} weak/at-risk` });

  const recent = stakeholders.filter((s) => { const d = daysSince(s.lastContactDate); return d !== null && d < 14; }).length;
  const rp = Math.min(10, Math.round((recent / stakeholders.length) * 15));
  score += rp; factors.push({ label: "Contact recency", impact: rp, detail: `${recent} stakeholders contacted in last 2 weeks` });

  return { score: Math.max(0, Math.min(100, score)), factors };
}

export default function Dashboard() {
  const { activeWorkspace } = useWorkspace();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/stakeholders?workspace=${activeWorkspace.id}`).then((r) => r.json()),
      fetch(`/api/activities?workspace=${activeWorkspace.id}`).then((r) => r.json()),
    ]).then(([s, a]) => {
      setStakeholders(s);
      setActivities(a);
      setLoading(false);
    });
  }, [activeWorkspace?.id]);

  if (loading || !activeWorkspace) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-shimmer rounded" />
          <div className="h-4 w-80 animate-shimmer rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-shimmer rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 animate-shimmer rounded-xl" />
            <div className="h-48 animate-shimmer rounded-xl" />
          </div>
          <div className="h-64 animate-shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  const { score, factors } = computeScore(stakeholders);

  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-2xl font-bold text-slate-900">Deal Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeWorkspace.name} &middot; {activeWorkspace.description} &middot;{" "}
          {activeWorkspace.dealSummary}
        </p>
      </div>
      <div className="space-y-6">
        <div className="animate-fade-up stagger-1">
          <QuickStats stakeholders={stakeholders} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="animate-fade-up stagger-2">
            <DealHealthScore score={score} factors={factors} />
          </div>
          <div className="animate-fade-up stagger-3">
            <CriticalAlerts stakeholders={stakeholders} />
          </div>
        </div>
        <div className="animate-fade-up stagger-4">
          <CoverageMap stakeholders={stakeholders} />
        </div>
        <div className="animate-fade-up stagger-5">
          <RecentActivity activities={activities} stakeholders={stakeholders} />
        </div>
      </div>
    </div>
  );
}
