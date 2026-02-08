"use client";

import { useState, useEffect } from "react";
import { Stakeholder } from "@/lib/types";
import {
  Calendar,
  Loader2,
  Copy,
  Check,
  Download,
  Users,
} from "lucide-react";

export default function MeetingPrepPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stakeholders")
      .then((r) => r.json())
      .then(setStakeholders);
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one stakeholder");
      return;
    }
    setLoading(true);
    setError(null);
    setBrief(null);
    try {
      const res = await fetch("/api/meeting-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderIds: selectedIds, context }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBrief(data.brief);
      }
    } catch {
      setError("Failed to generate meeting prep. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBrief = () => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-brief-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group stakeholders by team
  const grouped = stakeholders.reduce(
    (acc, s) => {
      if (!acc[s.team]) acc[s.team] = [];
      acc[s.team].push(s);
      return acc;
    },
    {} as Record<string, Stakeholder[]>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Meeting Prep Assistant
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select attendees and Claude will generate a comprehensive meeting
          brief
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Select Attendees ({selectedIds.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {Object.entries(grouped).map(([team, members]) => (
                <div key={team}>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    {team}
                  </p>
                  <div className="space-y-1">
                    {members.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          selectedIds.includes(s.id)
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => toggle(s.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {s.title}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Meeting Context (Optional)
            </h3>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="e.g., Quarterly business review, Technical deep-dive, Contract negotiation..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || selectedIds.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {loading ? "Generating Brief..." : "Generate Meeting Prep"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="col-span-2">
          {!brief && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Select Attendees to Get Started
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Choose the stakeholders who will be in the meeting, add optional
                context, and Claude will generate a comprehensive prep document.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Preparing Meeting Brief...
              </h3>
              <p className="text-sm text-slate-500">
                Claude is analyzing stakeholder profiles, recent interactions,
                and priorities...
              </p>
            </div>
          )}

          {brief && !loading && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Meeting Brief</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={downloadBrief}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
              <div className="p-6 prose text-sm text-slate-700 max-h-[700px] overflow-y-auto">
                {brief.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2 key={i}>
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("### ")) {
                    return (
                      <h3 key={i}>
                        {line.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <li key={i} style={{ listStyleType: "disc" }}>
                        {renderBold(line.replace("- ", ""))}
                      </li>
                    );
                  }
                  if (line.trim() === "") {
                    return <br key={i} />;
                  }
                  return <p key={i}>{renderBold(line)}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
