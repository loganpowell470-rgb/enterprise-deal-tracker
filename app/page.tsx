import { getStakeholders, getActivities, computeDealHealthScore } from "@/lib/data";
import DealHealthScore from "@/components/Dashboard/DealHealthScore";
import QuickStats from "@/components/Dashboard/QuickStats";
import CoverageMap from "@/components/Dashboard/CoverageMap";
import CriticalAlerts from "@/components/Dashboard/CriticalAlerts";
import RecentActivity from "@/components/Dashboard/RecentActivity";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const stakeholders = getStakeholders();
  const activities = getActivities();
  const { score, factors } = computeDealHealthScore(stakeholders);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI Labs Inc. &middot; Enterprise Account &middot; $400K &rarr; $1M ARR
          expansion
        </p>
      </div>

      <div className="space-y-6">
        <QuickStats stakeholders={stakeholders} />

        <div className="grid grid-cols-2 gap-6">
          <DealHealthScore score={score} factors={factors} />
          <CriticalAlerts stakeholders={stakeholders} />
        </div>

        <CoverageMap stakeholders={stakeholders} />

        <RecentActivity activities={activities} stakeholders={stakeholders} />
      </div>
    </div>
  );
}
