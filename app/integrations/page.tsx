"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plug,
  Mail,
  CalendarDays,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Unplug,
  ArrowRight,
  Database,
  ArrowUpDown,
  Building2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface SyncResult {
  newContacts: number;
  newActivities: number;
  updatedStakeholders: number;
  details: string[];
}

interface MeetingGap {
  stakeholder: {
    id: string;
    name: string;
    title: string;
    team: string;
    priority: string;
    role: string;
  };
  daysSinceLastMeeting: number | null;
  lastMeetingDate: string | null;
  upcomingMeeting: string | null;
}

interface IntegrationStatus {
  connected: boolean;
  email: string | null;
  lastGmailSync: string | null;
  lastCalendarSync: string | null;
  gmailResults: SyncResult | null;
  calendarResults: SyncResult | null;
  meetingGaps: MeetingGap[];
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<"gmail" | "calendar" | null>(null);
  const [syncResult, setSyncResult] = useState<{
    type: string;
    result: SyncResult;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to check integration status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check URL for auth callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      setError(null);
      fetchStatus();
      window.history.replaceState({}, "", "/integrations");
    }
    if (params.get("error")) {
      setError(
        `Authentication failed: ${params.get("error")?.replace(/_/g, " ")}`
      );
      window.history.replaceState({}, "", "/integrations");
    }
  }, [fetchStatus]);

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/integrations/auth");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to get auth URL");
      }
    } catch {
      setError("Failed to initiate Google connection");
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/auth", { method: "DELETE" });
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              connected: false,
              email: null,
              lastGmailSync: null,
              lastCalendarSync: null,
              gmailResults: null,
              calendarResults: null,
              meetingGaps: [],
            }
          : null
      );
      setSyncResult(null);
    } catch {
      setError("Failed to disconnect");
    }
  };

  const handleSync = async (type: "gmail" | "calendar") => {
    setSyncing(type);
    setSyncResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${type}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSyncResult({ type, result: data });
        await fetchStatus();
      }
    } catch {
      setError(`Failed to sync ${type}`);
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Plug className="w-6 h-6 text-indigo-600" />
          Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your Google Workspace to auto-detect contacts, log
          interactions, and track meeting coverage
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status?.connected
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Google Workspace
              </h2>
              {status?.connected ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600">
                    Connected as {status.email || "unknown"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">Not connected</span>
                </div>
              )}
            </div>
          </div>

          {status?.connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Unplug className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Connect Google Account
            </button>
          )}
        </div>

        {!status?.connected && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Plug className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Connect to unlock powerful automation
              </p>
              <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
                Link your Google Workspace to automatically discover stakeholders from emails,
                log meeting activity to your timeline, and detect engagement gaps with key contacts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Gmail Integration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Gmail</h3>
                <p className="text-xs text-slate-500">
                  Email scanning & auto-logging
                </p>
              </div>
            </div>
            {status?.connected && (
              <button
                onClick={() => handleSync("gmail")}
                disabled={syncing === "gmail"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                {syncing === "gmail" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {syncing === "gmail" ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Feature
              icon={<UserPlus className="w-4 h-4" />}
              title="Auto-detect contacts"
              description="Discover new stakeholders from email threads"
            />
            <Feature
              icon={<CalendarDays className="w-4 h-4" />}
              title="Parse meeting invites"
              description="Identify stakeholders from calendar invitations"
            />
            <Feature
              icon={<MessageSquare className="w-4 h-4" />}
              title="Extract conversation summaries"
              description="Auto-generate interaction summaries from email content"
            />
            <Feature
              icon={<Clock className="w-4 h-4" />}
              title="Auto-log interactions"
              description="Automatically record email touchpoints with timestamps"
            />
          </div>

          {status?.lastGmailSync && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Last synced: {formatDate(status.lastGmailSync.split("T")[0])}
              </p>
            </div>
          )}
        </div>

        {/* Google Calendar Integration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Google Calendar
                </h3>
                <p className="text-xs text-slate-500">
                  Meeting tracking & gap detection
                </p>
              </div>
            </div>
            {status?.connected && (
              <button
                onClick={() => handleSync("calendar")}
                disabled={syncing === "calendar"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                {syncing === "calendar" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {syncing === "calendar" ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Feature
              icon={<UserPlus className="w-4 h-4" />}
              title="Auto-populate attendees"
              description="Add meeting participants as stakeholders automatically"
            />
            <Feature
              icon={<Clock className="w-4 h-4" />}
              title="Log meetings as activities"
              description="Past meetings appear in your activity timeline"
            />
            <Feature
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Detect meeting gaps"
              description="Identify P0/P1 stakeholders you haven't met with recently"
            />
          </div>

          {status?.lastCalendarSync && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Last synced:{" "}
                {formatDate(status.lastCalendarSync.split("T")[0])}
              </p>
            </div>
          )}
        </div>

        {/* Salesforce - Coming Soon */}
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.005 16.945c-.567 0-1.093-.148-1.553-.407a2.86 2.86 0 0 1-1.257.29c-1.6 0-2.895-1.322-2.895-2.953a2.96 2.96 0 0 1 .544-1.715 2.478 2.478 0 0 1-.206-1.001c0-1.378 1.1-2.494 2.457-2.494.268 0 .526.044.768.124A3.362 3.362 0 0 1 10.926 7c1.27 0 2.373.72 2.952 1.783a2.67 2.67 0 0 1 1.085-.23c1.514 0 2.742 1.253 2.742 2.798 0 .234-.029.461-.082.678A2.32 2.32 0 0 1 18.7 14.14c0 1.283-1.023 2.322-2.285 2.322a2.24 2.24 0 0 1-.98-.224 2.83 2.83 0 0 1-2.21 1.073 2.78 2.78 0 0 1-1.46-.414 2.49 2.49 0 0 1-1.76.748z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Salesforce</h3>
              <p className="text-xs text-slate-500">
                CRM sync & bi-directional data
              </p>
            </div>
          </div>

          <div className="space-y-3 opacity-60">
            <Feature
              icon={<UserPlus className="w-4 h-4" />}
              title="Pull contact data"
              description="Sync names, titles, and company info from your CRM"
            />
            <Feature
              icon={<Building2 className="w-4 h-4" />}
              title="Pull account hierarchy"
              description="Import team structures and department mappings"
            />
            <Feature
              icon={<ArrowUpDown className="w-4 h-4" />}
              title="Push deal health scores"
              description="Write AI insights and health scores back to CRM"
            />
            <Feature
              icon={<Database className="w-4 h-4" />}
              title="Auto-update contact dates"
              description="Keep last contact dates in sync across platforms"
            />
          </div>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">
              {syncResult.type === "gmail" ? "Gmail" : "Calendar"} Sync Complete
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {syncResult.result.newContacts}
              </p>
              <p className="text-xs text-slate-500">New Contacts</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">
                {syncResult.result.newActivities}
              </p>
              <p className="text-xs text-slate-500">Activities Logged</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">
                {syncResult.result.updatedStakeholders}
              </p>
              <p className="text-xs text-slate-500">Stakeholders Updated</p>
            </div>
          </div>

          {syncResult.result.details.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Details
              </p>
              {syncResult.result.details.map((d, i) => (
                <p key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">&#8226;</span>
                  {d}
                </p>
              ))}
            </div>
          )}

          {syncResult.result.details.length === 0 && (
            <p className="text-sm text-emerald-600">
              Everything is up to date. No new data found since last sync.
            </p>
          )}
        </div>
      )}

      {/* Meeting Gaps */}
      {status?.connected && status.meetingGaps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Meeting Gap Detection
            </h3>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              {status.meetingGaps.length} stakeholders need meetings
            </span>
          </div>

          <div className="space-y-2">
            {status.meetingGaps.map((gap) => (
              <div
                key={gap.stakeholder.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  gap.daysSinceLastMeeting === null
                    ? "bg-red-50 border-red-200"
                    : gap.daysSinceLastMeeting > 30
                      ? "bg-amber-50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    {gap.stakeholder.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {gap.stakeholder.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {gap.stakeholder.title} &middot; {gap.stakeholder.team} &middot;{" "}
                      <span className="font-medium">{gap.stakeholder.priority}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        gap.daysSinceLastMeeting === null
                          ? "text-red-600"
                          : gap.daysSinceLastMeeting > 30
                            ? "text-amber-600"
                            : "text-slate-600"
                      }`}
                    >
                      {gap.daysSinceLastMeeting === null
                        ? "No meetings"
                        : `${gap.daysSinceLastMeeting}d since last meeting`}
                    </p>
                    {gap.lastMeetingDate && (
                      <p className="text-xs text-slate-400">
                        Last: {formatDate(gap.lastMeetingDate)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/stakeholders/${gap.stakeholder.id}`}
                    className="text-slate-400 hover:text-indigo-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Sync Results (persistent) */}
      {status?.connected && !syncResult && (status?.gmailResults || status?.calendarResults) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Previous Sync Results
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {status.gmailResults && (
              <SyncSummary
                label="Gmail"
                icon={<Mail className="w-4 h-4" />}
                result={status.gmailResults}
                lastSync={status.lastGmailSync}
              />
            )}
            {status.calendarResults && (
              <SyncSummary
                label="Calendar"
                icon={<CalendarDays className="w-4 h-4" />}
                result={status.calendarResults}
                lastSync={status.lastCalendarSync}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function SyncSummary({
  label,
  icon,
  result,
  lastSync,
}: {
  label: string;
  icon: React.ReactNode;
  result: SyncResult;
  lastSync: string | null;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-slate-500">{icon}</div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{result.newContacts} contacts</span>
        <span>{result.newActivities} activities</span>
        <span>{result.updatedStakeholders} updates</span>
      </div>
      {lastSync && (
        <p className="text-[10px] text-slate-400 mt-2">
          Synced {formatDate(lastSync.split("T")[0])}
        </p>
      )}
    </div>
  );
}
