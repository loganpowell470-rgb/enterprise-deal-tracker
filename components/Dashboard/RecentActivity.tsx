"use client";

import { Activity, Stakeholder } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, Video, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Props {
  activities: Activity[];
  stakeholders: Stakeholder[];
}

const typeIcons = {
  Meeting: Video,
  Email: Mail,
  Call: Phone,
  Slack: MessageSquare,
};

const typeColors = {
  Meeting: "bg-indigo-100 text-indigo-600",
  Email: "bg-emerald-100 text-emerald-600",
  Call: "bg-amber-100 text-amber-600",
  Slack: "bg-purple-100 text-purple-600",
};

export default function RecentActivity({ activities, stakeholders }: Props) {
  const sorted = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Recent Activity
        </h3>
        <Link
          href="/timeline"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {sorted.map((activity) => {
          const Icon = typeIcons[activity.type];
          const color = typeColors[activity.type];
          const names = activity.stakeholderIds
            .map(
              (id) =>
                stakeholders.find((s) => s.id === id)?.name ?? "Unknown"
            )
            .join(", ");

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-900">
                    {names}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(activity.date)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {activity.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
