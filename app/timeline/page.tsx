"use client";

import { useState, useEffect } from "react";
import { Activity, Stakeholder, ACTIVITY_TYPES, ActivityType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  Plus,
  Mail,
  Phone,
  Video,
  MessageSquare,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";

const typeIcons = {
  Meeting: Video,
  Email: Mail,
  Call: Phone,
  Slack: MessageSquare,
};

const typeColors = {
  Meeting: "bg-indigo-100 text-indigo-600 border-indigo-200",
  Email: "bg-emerald-100 text-emerald-600 border-emerald-200",
  Call: "bg-amber-100 text-amber-600 border-amber-200",
  Slack: "bg-purple-100 text-purple-600 border-purple-200",
};

export default function TimelinePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStakeholder, setFilterStakeholder] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formStakeholders, setFormStakeholders] = useState<string[]>([]);
  const [formType, setFormType] = useState<ActivityType>("Meeting");
  const [formSummary, setFormSummary] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/stakeholders").then((r) => r.json()),
    ]).then(([a, s]) => {
      setActivities(a);
      setStakeholders(s);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStakeholders.length === 0 || !formSummary.trim()) return;

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: formDate,
        stakeholderIds: formStakeholders,
        type: formType,
        summary: formSummary,
      }),
    });
    const newActivity = await res.json();
    setActivities((prev) => [...prev, newActivity]);
    setShowForm(false);
    setFormStakeholders([]);
    setFormSummary("");
    setFormType("Meeting");
  };

  const filtered = activities
    .filter((a) => {
      if (filterStakeholder && !a.stakeholderIds.includes(filterStakeholder))
        return false;
      if (filterType && a.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const grouped = filtered.reduce(
    (acc, a) => {
      if (!acc[a.date]) acc[a.date] = [];
      acc[a.date].push(a);
      return acc;
    },
    {} as Record<string, Activity[]>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Activity Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activities.length} interactions tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Log Activity"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-slate-900">Log New Activity</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as ActivityType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stakeholders
              </label>
              <select
                multiple
                value={formStakeholders}
                onChange={(e) =>
                  setFormStakeholders(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[72px]"
              >
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Summary
            </label>
            <textarea
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              rows={3}
              required
              placeholder="What happened? Key takeaways, action items..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formStakeholders.length === 0 || !formSummary.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Save Activity
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterStakeholder}
          onChange={(e) => setFilterStakeholder(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Stakeholders</option>
          {stakeholders.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(filterStakeholder || filterType) && (
          <button
            onClick={() => {
              setFilterStakeholder("");
              setFilterType("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, acts]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-slate-900">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">
                {acts.length} {acts.length === 1 ? "activity" : "activities"}
              </span>
            </div>
            <div className="space-y-3 ml-2">
              {acts.map((activity) => {
                const Icon = typeIcons[activity.type];
                const color = typeColors[activity.type];
                const names = activity.stakeholderIds.map((id) => {
                  const s = stakeholders.find((st) => st.id === id);
                  return s ? { name: s.name, id: s.id } : null;
                }).filter(Boolean) as { name: string; id: string }[];

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4"
                  >
                    <div
                      className={`p-2 rounded-lg border flex-shrink-0 ${color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {activity.type}
                        </span>
                        {names.map((n) => (
                          <Link
                            key={n.id}
                            href={`/stakeholders/${n.id}`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded"
                          >
                            {n.name}
                          </Link>
                        ))}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {activity.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium">No activities found</p>
          <p className="text-sm mt-1">
            {filterStakeholder || filterType
              ? "Try adjusting your filters"
              : "Start by logging your first activity"}
          </p>
        </div>
      )}
    </div>
  );
}
