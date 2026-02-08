"use client";

import { useState } from "react";
import {
  Stakeholder,
  TEAMS,
  DEAL_ROLES,
  PRIORITIES,
  RELATIONSHIP_STRENGTHS,
  DealRole,
  Priority,
  RelationshipStrength,
} from "@/lib/types";
import { X } from "lucide-react";

interface Props {
  stakeholder?: Stakeholder;
  onSave: (data: Omit<Stakeholder, "id">) => void;
  onCancel: () => void;
}

export default function StakeholderForm({ stakeholder, onSave, onCancel }: Props) {
  const [name, setName] = useState(stakeholder?.name ?? "");
  const [title, setTitle] = useState(stakeholder?.title ?? "");
  const [team, setTeam] = useState(stakeholder?.team ?? TEAMS[0]);
  const [role, setRole] = useState<DealRole>(stakeholder?.role ?? "Influencer");
  const [priority, setPriority] = useState<Priority>(stakeholder?.priority ?? "P1");
  const [lastContactDate, setLastContactDate] = useState(
    stakeholder?.lastContactDate ?? ""
  );
  const [relationshipStrength, setRelationshipStrength] =
    useState<RelationshipStrength>(stakeholder?.relationshipStrength ?? "Unknown");
  const [keyPriorities, setKeyPriorities] = useState(
    stakeholder?.keyPriorities.join(", ") ?? ""
  );
  const [notes, setNotes] = useState(stakeholder?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      title,
      team,
      role,
      priority,
      lastContactDate: lastContactDate || null,
      relationshipStrength,
      keyPriorities: keyPriorities
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      notes,
    });
  };

  const inputClass =
    "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {stakeholder ? "Edit Stakeholder" : "Add Stakeholder"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Job title"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className={inputClass}
              >
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Role in Deal</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as DealRole)}
                className={inputClass}
              >
                {DEAL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Relationship Strength</label>
              <select
                value={relationshipStrength}
                onChange={(e) =>
                  setRelationshipStrength(e.target.value as RelationshipStrength)
                }
                className={inputClass}
              >
                {RELATIONSHIP_STRENGTHS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Last Contact Date</label>
              <input
                type="date"
                value={lastContactDate ?? ""}
                onChange={(e) => setLastContactDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Key Priorities (comma-separated)</label>
            <input
              type="text"
              value={keyPriorities}
              onChange={(e) => setKeyPriorities(e.target.value)}
              className={inputClass}
              placeholder="e.g., Cost reduction, Performance, Security"
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Context, history, observations..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              {stakeholder ? "Save Changes" : "Add Stakeholder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
