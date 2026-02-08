"use client";

import { useState } from "react";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Target,
  Loader2,
} from "lucide-react";

interface Insight {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionItem: string;
}

interface AnalysisResult {
  dealHealthScore?: { score: number; reasoning: string };
  insights?: Insight[];
  raw?: string;
  error?: string;
}

export default function InsightsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) {
        throw new Error("Analysis failed");
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
      }
    } catch {
      setError(
        "Failed to generate analysis. Please check your Anthropic API key."
      );
    } finally {
      setLoading(false);
    }
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const severityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-amber-200 bg-amber-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "coverage_gap":
        return { label: "Coverage Gap", color: "bg-purple-100 text-purple-700" };
      case "engagement_risk":
        return { label: "Engagement Risk", color: "bg-red-100 text-red-700" };
      case "missing_stakeholder":
        return { label: "Missing Stakeholder", color: "bg-amber-100 text-amber-700" };
      case "strategic":
        return { label: "Strategic", color: "bg-indigo-100 text-indigo-700" };
      default:
        return { label: type, color: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            AI-Powered Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Claude analyzes your stakeholder data and generates actionable
            recommendations
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {loading ? "Analyzing..." : "Generate Insights"}
        </button>
      </div>

      {!analysis && !loading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Ready to Analyze
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Click &ldquo;Generate Insights&rdquo; to have Claude analyze all 20
            stakeholders, identify coverage gaps, engagement risks, and generate
            strategic recommendations for your deal.
          </p>
          <button
            onClick={runAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Brain className="w-4 h-4" />
            Run Analysis Now
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Analyzing Your Deal...
          </h3>
          <p className="text-sm text-slate-500">
            Claude is reviewing all stakeholder data, engagement patterns, and
            coverage gaps...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {analysis.dealHealthScore && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                    analysis.dealHealthScore.score >= 80
                      ? "bg-emerald-500"
                      : analysis.dealHealthScore.score >= 60
                        ? "bg-amber-500"
                        : analysis.dealHealthScore.score >= 40
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                >
                  {analysis.dealHealthScore.score}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    AI Deal Health Score
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {analysis.dealHealthScore.reasoning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysis.insights && analysis.insights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Insights & Recommendations ({analysis.insights.length})
              </h2>
              {analysis.insights.map((insight, i) => {
                const tl = typeLabel(insight.type);
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-5 ${severityBg(insight.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {severityIcon(insight.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-slate-900">
                            {insight.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tl.color}`}
                          >
                            {tl.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-start gap-2 bg-white/60 rounded-lg p-3">
                          <Target className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-semibold text-indigo-700 uppercase">
                              Action Item
                            </span>
                            <p className="text-sm text-slate-700 mt-0.5">
                              {insight.actionItem}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {analysis.raw && !analysis.insights && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-500 mb-3">
                Raw Analysis
              </h3>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                {analysis.raw}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
