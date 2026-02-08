"use client";

import { useState, useEffect } from "react";
import { Stakeholder } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace-context";
import StakeholderCard from "@/components/Stakeholders/StakeholderCard";
import StakeholderFilters from "@/components/Stakeholders/StakeholderFilters";
import StakeholderForm from "@/components/Stakeholders/StakeholderForm";
import { Plus } from "lucide-react";

export default function StakeholdersPage() {
  const { activeWorkspace } = useWorkspace();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    team: "",
    role: "",
    relationship: "",
    priority: "",
  });

  useEffect(() => {
    if (!activeWorkspace) return;
    fetch(`/api/stakeholders?workspace=${activeWorkspace?.id || "ai-labs"}`)
      .then((r) => r.json())
      .then((data) => {
        setStakeholders(data);
        setLoading(false);
      });
  }, [activeWorkspace?.id]);

  const filtered = stakeholders.filter((s) => {
    if (
      filters.search &&
      !s.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !s.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.team && s.team !== filters.team) return false;
    if (filters.role && s.role !== filters.role) return false;
    if (filters.relationship && s.relationshipStrength !== filters.relationship)
      return false;
    if (filters.priority && s.priority !== filters.priority) return false;
    return true;
  });

  const handleAdd = async (data: Omit<Stakeholder, "id">) => {
    const res = await fetch(`/api/stakeholders?workspace=${activeWorkspace?.id || "ai-labs"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const newStakeholder = await res.json();
    setStakeholders((prev) => [...prev, newStakeholder]);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-40 animate-shimmer rounded" />
              <div className="h-4 w-64 animate-shimmer rounded mt-2" />
            </div>
            <div className="h-10 w-40 animate-shimmer rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 animate-shimmer rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stakeholders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stakeholders.length} stakeholders across{" "}
            {new Set(stakeholders.map((s) => s.team)).size} teams
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors btn-press"
        >
          <Plus className="w-4 h-4" />
          Add Stakeholder
        </button>
      </div>

      <div className="space-y-4">
        <div className="animate-fade-up stagger-1">
          <StakeholderFilters filters={filters} onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <StakeholderCard key={s.id} stakeholder={s} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 animate-fade-up">
            <p className="text-lg font-medium">No stakeholders found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or add a new stakeholder
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <StakeholderForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}
