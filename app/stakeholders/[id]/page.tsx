"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Stakeholder, Activity } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace-context";
import { daysSince, formatDate } from "@/lib/utils";
import StakeholderForm from "@/components/Stakeholders/StakeholderForm";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Clock,
  Mail,
  Phone,
  Video,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const roleColors: Record<string, string> = {
  "Economic Buyer": "bg-purple-100 text-purple-700",
  Champion: "bg-emerald-100 text-emerald-700",
  Influencer: "bg-blue-100 text-blue-700",
  "Technical Buyer": "bg-cyan-100 text-cyan-700",
  "End User": "bg-slate-100 text-slate-700",
  Blocker: "bg-red-100 text-red-700",
};

const strengthColors: Record<string, string> = {
  Strong: "bg-emerald-100 text-emerald-700",
  Neutral: "bg-slate-100 text-slate-600",
  Weak: "bg-amber-100 text-amber-700",
  "At Risk": "bg-red-100 text-red-700",
  Unknown: "bg-slate-100 text-slate-500",
};

const priorityColors: Record<string, string> = {
  P0: "bg-red-600 text-white",
  P1: "bg-amber-500 text-white",
  P2: "bg-slate-400 text-white",
};

const typeIcons: Record<string, typeof Video> = {
  Meeting: Video,
  Email: Mail,
  Call: Phone,
  Slack: MessageSquare,
};

export default function StakeholderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allStakeholders, setAllStakeholders] = useState<Stakeholder[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    Promise.all([
      fetch(`/api/stakeholders/${id}?workspace=${activeWorkspace?.id || "ai-labs"}`).then((r) => r.json()),
      fetch(`/api/activities?workspace=${activeWorkspace?.id || "ai-labs"}`).then((r) => r.json()),
      fetch(`/api/stakeholders?workspace=${activeWorkspace?.id || "ai-labs"}`).then((r) => r.json()),
    ]).then(([s, a, all]) => {
      setStakeholder(s);
      setActivities(a);
      setAllStakeholders(all);
      setLoading(false);
    });
  }, [id, activeWorkspace?.id]);

  const handleUpdate = async (data: Omit<Stakeholder, "id">) => {
    const res = await fetch(`/api/stakeholders/${id}?workspace=${activeWorkspace?.id || "ai-labs"}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setStakeholder(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this stakeholder?")) return;
    await fetch(`/api/stakeholders/${id}?workspace=${activeWorkspace?.id || "ai-labs"}`, { method: "DELETE" });
    router.push("/stakeholders");
  };

  if (loading || !stakeholder) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const days = daysSince(stakeholder.lastContactDate);
  const daysLabel = days === null ? "Never contacted" : `${days} days ago`;
  const relatedActivities = activities
    .filter((a) => a.stakeholderIds.includes(id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/stakeholders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Stakeholders
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {stakeholder.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {stakeholder.name}
              </h1>
              <p className="text-sm text-slate-500">
                {stakeholder.title} &middot; {stakeholder.team}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[stakeholder.role]}`}
          >
            {stakeholder.role}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[stakeholder.priority]}`}
          >
            {stakeholder.priority}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${strengthColors[stakeholder.relationshipStrength]}`}
          >
            {stakeholder.relationshipStrength}
          </span>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              days === null || days > 30
                ? "bg-red-50 text-red-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Clock className="w-3 h-3" />
            {daysLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Key Priorities
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {stakeholder.keyPriorities.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {stakeholder.notes}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Activity History ({relatedActivities.length})
        </h3>

        {relatedActivities.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No recorded interactions yet
          </p>
        ) : (
          <div className="space-y-4">
            {relatedActivities.map((activity) => {
              const Icon = typeIcons[activity.type] || Video;
              const otherNames = activity.stakeholderIds
                .filter((sid) => sid !== id)
                .map(
                  (sid) =>
                    allStakeholders.find((s) => s.id === sid)?.name ||
                    "Unknown"
                );
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">
                        {formatDate(activity.date)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                        {activity.type}
                      </span>
                      {otherNames.length > 0 && (
                        <span className="text-xs text-slate-400">
                          with {otherNames.join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{activity.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <StakeholderForm
          stakeholder={stakeholder}
          onSave={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
