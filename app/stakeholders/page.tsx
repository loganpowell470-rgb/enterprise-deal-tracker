"use client";

import { useState, useEffect } from "react";
import { Stakeholder } from "@/lib/types";
import StakeholderCard from "@/components/Stakeholders/StakeholderCard";
import StakeholderFilters from "@/components/Stakeholders/StakeholderFilters";
import StakeholderForm from "@/components/Stakeholders/StakeholderForm";
import { Plus } from "lucide-react";

export default function StakeholdersPage() {
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
    fetch("/api/stakeholders")
      .then((r) => r.json())
      .then((data) => {
        setStakeholders(data);
        setLoading(false);
      });
  }, []);

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
    const res = await fetch("/api/stakeholders", {
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
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stakeholders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stakeholders.length} stakeholders across{" "}
            {new Set(stakeholders.map((s) => s.team)).size} teams
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stakeholder
        </button>
      </div>

      <div className="space-y-4">
        <StakeholderFilters filters={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StakeholderCard key={s.id} stakeholder={s} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
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
