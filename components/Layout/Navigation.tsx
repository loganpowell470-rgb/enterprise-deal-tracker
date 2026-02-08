"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Brain,
  Calendar,
  Clock,
  Sparkles,
  Plug,
  Target,
  ChevronUp,
  ChevronDown,
  Check,
  Plus,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stakeholders", label: "Stakeholders", icon: Users },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/meeting-prep", label: "Meeting Prep", icon: Calendar },
  { href: "/smart-import", label: "Smart Import", icon: Sparkles },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
};

const colorOptions = [
  { name: "indigo", bg: "bg-indigo-500", ring: "ring-indigo-400" },
  { name: "rose", bg: "bg-rose-500", ring: "ring-rose-400" },
  { name: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { name: "amber", bg: "bg-amber-500", ring: "ring-amber-400" },
  { name: "cyan", bg: "bg-cyan-500", ring: "ring-cyan-400" },
  { name: "violet", bg: "bg-violet-500", ring: "ring-violet-400" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, refreshWorkspaces } =
    useWorkspace();
  const { logout } = useAuth();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDealSummary, setFormDealSummary] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTimeline, setFormTimeline] = useState("");
  const [formDealContext, setFormDealContext] = useState("");
  const [formTeams, setFormTeams] = useState("");
  const [formColor, setFormColor] = useState("emerald");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setShowSwitcher(false);
        setShowCreateForm(false);
      }
    }
    if (showSwitcher || showCreateForm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSwitcher, showCreateForm]);

  const handleSwitch = (id: string) => {
    setActiveWorkspaceId(id);
    setShowSwitcher(false);
    window.location.reload();
  };

  const resetForm = () => {
    setFormName("");
    setFormDealSummary("");
    setFormDescription("");
    setFormTimeline("");
    setFormDealContext("");
    setFormTeams("");
    setFormColor("emerald");
    setFormError("");
    setShowMoreDetails(false);
  };

  const openCreateForm = () => {
    setShowSwitcher(false);
    resetForm();
    setShowCreateForm(true);
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError("Company name is required");
      return;
    }
    if (!formDealSummary.trim()) {
      setFormError("Deal summary is required");
      return;
    }

    setFormError("");
    setFormLoading(true);

    try {
      const teams = formTeams
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          dealContext: formDealContext,
          dealSummary: formDealSummary,
          renewalInfo: formTimeline,
          teams,
          color: formColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create workspace");
      }

      const created = await res.json();
      await refreshWorkspaces();
      setActiveWorkspaceId(created.id);
      setShowCreateForm(false);
      window.location.reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-slate-900 text-white flex flex-col z-50">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-400" />
            <div>
              <h1 className="text-base font-bold leading-tight">Deal Command</h1>
              <p className="text-[11px] text-slate-400">
                Enterprise Multi-Threading
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 py-4">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Navigation
          </span>
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Workspace Switcher */}
      <div className="relative p-4 border-t border-slate-700" ref={switcherRef}>
        {/* Workspace List Popover */}
        {showSwitcher && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Workspace
              </p>
            </div>
            <div className="py-2">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspace?.id;
                const dotColor = colorMap[ws.color] || "bg-slate-500";
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitch(ws.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-slate-700/50"
                        : "hover:bg-slate-700/30"
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {ws.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ws.description}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-slate-700">
              <button
                onClick={openCreateForm}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Workspace
              </button>
            </div>
          </div>
        )}

        {/* Create Workspace Form Popover */}
        {showCreateForm && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                New Workspace
              </p>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Deal Summary */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Deal Summary *
                </label>
                <input
                  type="text"
                  value={formDealSummary}
                  onChange={(e) => setFormDealSummary(e.target.value)}
                  placeholder="e.g. $500K expansion deal"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setFormColor(c.name)}
                      className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                        formColor === c.name
                          ? `ring-2 ${c.ring} ring-offset-2 ring-offset-slate-800 scale-110`
                          : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* More Details Toggle */}
              <button
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showMoreDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {showMoreDetails ? "Less details" : "More details"}
              </button>

              {showMoreDetails && (
                <div className="space-y-3">
                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Enterprise SaaS Account"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Timeline
                    </label>
                    <input
                      type="text"
                      value={formTimeline}
                      onChange={(e) => setFormTimeline(e.target.value)}
                      placeholder="e.g. Renewal in 90 days"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Deal Context */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Deal Context
                    </label>
                    <textarea
                      value={formDealContext}
                      onChange={(e) => setFormDealContext(e.target.value)}
                      placeholder="Describe the deal background, strategy, and goals..."
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Teams */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Teams
                    </label>
                    <input
                      type="text"
                      value={formTeams}
                      onChange={(e) => setFormTeams(e.target.value)}
                      placeholder="e.g. Engineering, Finance, Legal"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Comma-separated team names
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={formLoading}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={formLoading}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account Card (clickable) */}
        <button
          onClick={() => {
            if (showCreateForm) {
              setShowCreateForm(false);
            } else {
              setShowSwitcher(!showSwitcher);
            }
          }}
          className="w-full bg-slate-800 rounded-lg p-3 text-left hover:bg-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {activeWorkspace && (
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      colorMap[activeWorkspace.color] || "bg-slate-500"
                    }`}
                  />
                )}
                <p className="text-xs font-medium text-slate-300 truncate">
                  {activeWorkspace?.name || "Loading..."}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-4">
                {activeWorkspace?.description || ""}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-4">
                {activeWorkspace?.renewalInfo || ""}
              </p>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform ${
                showSwitcher || showCreateForm ? "" : "rotate-180"
              }`}
            />
          </div>
        </button>
      </div>
    </nav>
  );
}
