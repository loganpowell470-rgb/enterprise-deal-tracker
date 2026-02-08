"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  UserPlus,
  UserCheck,
  AlertTriangle,
  ThumbsUp,
  Minus,
  CheckCircle2,
  Upload,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-context";
import {
  ActivityType,
  ACTIVITY_TYPES,
  SmartImportParseResult,
  ExtractedStakeholder,
  SmartImportConfirmResult,
} from "@/lib/types";

export default function SmartImportPage() {
  const { activeWorkspace } = useWorkspace();
  const [transcript, setTranscript] = useState("");
  const [sourceType, setSourceType] = useState<ActivityType>("Meeting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] =
    useState<SmartImportParseResult | null>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<
    Record<number, boolean>
  >({});
  const [editedActivity, setEditedActivity] = useState<{
    date: string;
    type: ActivityType;
    summary: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [importResult, setImportResult] =
    useState<SmartImportConfirmResult | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    stakeholders: true,
    actions: true,
    sentiment: true,
    activity: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Please paste a transcript or email content to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    setParseResult(null);
    setImportResult(null);
    setSyncResult(null);

    try {
      const res = await fetch(`/api/smart-import?workspace=${activeWorkspace?.id || "ai-labs"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "parse",
          transcript: transcript.trim(),
          sourceType,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setParseResult(data);
        // Select all stakeholders by default
        const selected: Record<number, boolean> = {};
        data.stakeholders?.forEach((_: ExtractedStakeholder, i: number) => {
          selected[i] = true;
        });
        setSelectedStakeholders(selected);
        // Set editable activity
        if (data.proposedActivity) {
          setEditedActivity({
            date: data.proposedActivity.date,
            type: data.proposedActivity.type,
            summary: data.proposedActivity.summary,
          });
        }
      }
    } catch {
      setError("Failed to analyze content. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  // This is intentionally unused in the initial version but the state setter is called
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!parseResult || !editedActivity) return;
    setConfirmLoading(true);
    setError(null);

    try {
      const selectedStakeholdersList = parseResult.stakeholders.filter(
        (_, i) => selectedStakeholders[i]
      );

      const stakeholderUpdates = selectedStakeholdersList
        .filter((s) => s.matchStatus === "existing" && s.matchedStakeholderId)
        .map((s) => ({
          id: s.matchedStakeholderId!,
          keyPriorities: s.keyPriorities,
          relationshipStrength: s.relationshipStrength,
          notes: s.notes,
          lastContactDate: editedActivity.date,
        }));

      const res = await fetch(`/api/smart-import?workspace=${activeWorkspace?.id || "ai-labs"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          payload: {
            stakeholders: selectedStakeholdersList,
            activity: editedActivity,
            stakeholderUpdates,
          },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setImportResult(data);
      }
    } catch {
      setError("Failed to import data. Please try again.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setParseResult(null);
    setImportResult(null);
    setEditedActivity(null);
    setSelectedStakeholders({});
    setError(null);
    setSyncResult(null);
  };

  const selectedCount = Object.values(selectedStakeholders).filter(Boolean).length;
  const newCount =
    parseResult?.stakeholders.filter(
      (s, i) => selectedStakeholders[i] && s.matchStatus === "new"
    ).length ?? 0;
  const existingCount =
    parseResult?.stakeholders.filter(
      (s, i) => selectedStakeholders[i] && s.matchStatus === "existing"
    ).length ?? 0;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          AI Smart Import
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste a meeting transcript or email thread and Claude will extract
          stakeholders, action items, and relationship signals
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success State */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-emerald-900">
              Import Complete
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">
                {importResult.createdStakeholders.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">New Stakeholders</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-700">
                {importResult.updatedStakeholders.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Updated Stakeholders</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">1</p>
              <p className="text-xs text-slate-500 mt-1">Activity Added</p>
            </div>
          </div>

          {importResult.createdStakeholders.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-emerald-800 font-medium mb-1">
                Created:
              </p>
              <div className="flex flex-wrap gap-2">
                {importResult.createdStakeholders.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stakeholders/${s.id}`}
                    className="bg-white text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {importResult.updatedStakeholders.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-indigo-800 font-medium mb-1">
                Updated:
              </p>
              <div className="flex flex-wrap gap-2">
                {importResult.updatedStakeholders.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stakeholders/${s.id}`}
                    className="bg-white text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Link
              href="/stakeholders"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View Stakeholders &rarr;
            </Link>
            <Link
              href="/timeline"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              View Timeline &rarr;
            </Link>
            <button
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 ml-auto"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Input + Preview Grid */}
      {!importResult && (
        <div className="grid grid-cols-5 gap-6">
          {/* Left Column - Input */}
          <div className={parseResult ? "col-span-2" : "col-span-5 max-w-2xl"}>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Source Content
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Content Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) =>
                    setSourceType(e.target.value as ActivityType)
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t} Transcript
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Paste Transcript or Email
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={`Paste your ${sourceType.toLowerCase()} transcript here...\n\nExample:\n"Thanks for joining today's call. Sarah from Finance mentioned budget concerns about the renewal pricing. Alex from Engineering is very supportive and wants to expand usage across Team B..."`}
                  rows={parseResult ? 12 : 16}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  {transcript.length.toLocaleString()} characters
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !transcript.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing with Claude...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {parseResult ? "Re-analyze" : "Analyze Content"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          {loading && !parseResult && (
            <div className="col-span-3 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  Parsing content...
                </h3>
                <p className="text-sm text-slate-500">
                  Claude is extracting stakeholders, action items, and
                  relationship signals
                </p>
              </div>
            </div>
          )}

          {parseResult && !loading && (
            <div className="col-span-3 space-y-4">
              {/* Summary Bar */}
              <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-indigo-700">
                      {parseResult.stakeholders.length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">
                      People
                    </p>
                  </div>
                  <div className="w-px h-8 bg-indigo-200" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-indigo-700">
                      {parseResult.actionItems.length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">
                      Actions
                    </p>
                  </div>
                  <div className="w-px h-8 bg-indigo-200" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-indigo-700">
                      {parseResult.sentimentSignals.length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-indigo-500 font-medium">
                      Signals
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={confirmLoading || selectedCount === 0}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {confirmLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Confirm Import ({selectedCount})
                    </>
                  )}
                </button>
              </div>

              {/* Stakeholders Section */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleSection("stakeholders")}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Extracted Stakeholders
                    </h3>
                    <span className="text-xs text-slate-400">
                      {newCount > 0 && (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium mr-1">
                          {newCount} new
                        </span>
                      )}
                      {existingCount > 0 && (
                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          {existingCount} existing
                        </span>
                      )}
                    </span>
                  </div>
                  {expandedSections.stakeholders ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {expandedSections.stakeholders && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {parseResult.stakeholders.map((s, i) => (
                      <div
                        key={i}
                        className={`p-4 flex items-start gap-3 ${
                          !selectedStakeholders[i] ? "opacity-40" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStakeholders[i] ?? false}
                          onChange={() =>
                            setSelectedStakeholders((prev) => ({
                              ...prev,
                              [i]: !prev[i],
                            }))
                          }
                          className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-900">
                              {s.name}
                            </span>
                            {s.matchStatus === "existing" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <UserCheck className="w-3 h-3" />
                                Match {s.matchConfidence}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <UserPlus className="w-3 h-3" />
                                New
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                s.priority === "P0"
                                  ? "bg-red-50 text-red-600"
                                  : s.priority === "P1"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {s.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {s.title} &middot; {s.team} &middot;{" "}
                            <span className="font-medium">{s.role}</span>
                          </p>
                          {s.keyPriorities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {s.keyPriorities.map((p, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                          {s.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">
                              {s.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              s.relationshipStrength === "Strong"
                                ? "bg-emerald-50 text-emerald-600"
                                : s.relationshipStrength === "Neutral"
                                  ? "bg-slate-100 text-slate-500"
                                  : s.relationshipStrength === "Weak"
                                    ? "bg-amber-50 text-amber-600"
                                    : s.relationshipStrength === "At Risk"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {s.relationshipStrength}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Items Section */}
              {parseResult.actionItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("actions")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Action Items
                      </h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {parseResult.actionItems.length}
                      </span>
                    </div>
                    {expandedSections.actions ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.actions && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {parseResult.actionItems.map((item, i) => (
                        <div key={i} className="p-4 flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-900">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500">
                                Owner:{" "}
                                <span className="font-medium text-slate-700">
                                  {item.owner}
                                </span>
                              </span>
                              {item.deadline && (
                                <span className="text-xs text-slate-500">
                                  Due:{" "}
                                  <span className="font-medium text-slate-700">
                                    {item.deadline}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment Signals Section */}
              {parseResult.sentimentSignals.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("sentiment")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Relationship Signals
                      </h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {parseResult.sentimentSignals.length}
                      </span>
                    </div>
                    {expandedSections.sentiment ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.sentiment && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {parseResult.sentimentSignals.map((sig, i) => (
                        <div
                          key={i}
                          className={`p-4 flex items-start gap-3 border-l-3 ${
                            sig.sentiment === "positive"
                              ? "border-l-emerald-500"
                              : sig.sentiment === "negative"
                                ? "border-l-red-500"
                                : "border-l-slate-300"
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {sig.sentiment === "positive" ? (
                              <ThumbsUp className="w-4 h-4 text-emerald-500" />
                            ) : sig.sentiment === "negative" ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {sig.stakeholderName}
                              <span
                                className={`ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                  sig.sentiment === "positive"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : sig.sentiment === "negative"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {sig.sentiment}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 italic">
                              &ldquo;{sig.signal}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Proposed Activity Section */}
              {editedActivity && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection("activity")}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        Timeline Entry
                      </h3>
                    </div>
                    {expandedSections.activity ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedSections.activity && (
                    <div className="border-t border-slate-100 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editedActivity.date}
                            onChange={(e) =>
                              setEditedActivity((prev) =>
                                prev ? { ...prev, date: e.target.value } : null
                              )
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Type
                          </label>
                          <select
                            value={editedActivity.type}
                            onChange={(e) =>
                              setEditedActivity((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      type: e.target.value as ActivityType,
                                    }
                                  : null
                              )
                            }
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {ACTIVITY_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Summary
                        </label>
                        <textarea
                          value={editedActivity.summary}
                          onChange={(e) =>
                            setEditedActivity((prev) =>
                              prev
                                ? { ...prev, summary: e.target.value }
                                : null
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
