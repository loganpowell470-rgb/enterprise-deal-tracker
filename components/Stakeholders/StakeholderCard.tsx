"use client";

import { Stakeholder } from "@/lib/types";
import { daysSince } from "@/lib/utils";
import { User, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  stakeholder: Stakeholder;
  index?: number;
}

const roleColors: Record<string, string> = {
  "Economic Buyer": "bg-purple-100 text-purple-700",
  Champion: "bg-emerald-100 text-emerald-700",
  Influencer: "bg-blue-100 text-blue-700",
  "Technical Buyer": "bg-cyan-100 text-cyan-700",
  "End User": "bg-slate-100 text-slate-700",
  Blocker: "bg-red-100 text-red-700",
};

const strengthColors: Record<string, string> = {
  Strong: "text-emerald-600",
  Neutral: "text-slate-500",
  Weak: "text-amber-600",
  "At Risk": "text-red-600",
  Unknown: "text-slate-400",
};

const strengthDots: Record<string, string> = {
  Strong: "bg-emerald-500",
  Neutral: "bg-slate-400",
  Weak: "bg-amber-500",
  "At Risk": "bg-red-500",
  Unknown: "bg-slate-300",
};

const priorityColors: Record<string, string> = {
  P0: "bg-red-600 text-white",
  P1: "bg-amber-500 text-white",
  P2: "bg-slate-400 text-white",
};

export default function StakeholderCard({ stakeholder: s, index = 0 }: Props) {
  const days = daysSince(s.lastContactDate);
  const daysLabel = days === null ? "Never" : `${days}d ago`;
  const isOverdue = days === null || days > 30;

  return (
    <Link
      href={`/stakeholders/${s.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 card-hover group"
      style={{ animation: `fadeUp 0.4s ease-out ${index * 0.05}s both` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm transition-transform group-hover:scale-110">
            {s.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
              {s.name}
            </h3>
            <p className="text-xs text-slate-500">
              {s.title} &middot; {s.team}
            </p>
          </div>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityColors[s.priority]}`}
        >
          {s.priority}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${roleColors[s.role]}`}
        >
          {s.role}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${strengthDots[s.relationshipStrength]}`} />
          <span className={`text-[11px] font-medium ${strengthColors[s.relationshipStrength]}`}>
            {s.relationshipStrength}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1 text-xs ${
            isOverdue ? "text-red-600" : "text-slate-500"
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{daysLabel}</span>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
          {s.keyPriorities.slice(0, 2).map((p) => (
            <span
              key={p}
              className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] truncate max-w-[120px]"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
