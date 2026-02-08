"use client";

interface Factor {
  label: string;
  impact: number;
  detail: string;
}

interface Props {
  score: number;
  factors: Factor[];
}

export default function DealHealthScore({ score, factors }: Props) {
  const getColor = (s: number) => {
    if (s >= 80) return { ring: "text-emerald-500", bg: "bg-emerald-500", label: "Healthy" };
    if (s >= 60) return { ring: "text-amber-500", bg: "bg-amber-500", label: "Needs Attention" };
    if (s >= 40) return { ring: "text-orange-500", bg: "bg-orange-500", label: "At Risk" };
    return { ring: "text-red-500", bg: "bg-red-500", label: "Critical" };
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Deal Health Score
      </h3>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              className={color.ring}
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{score}</span>
            <span className="text-xs text-slate-500">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${color.bg} mb-3`}
          >
            {color.label}
          </div>
          <div className="space-y-2">
            {factors.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate mr-2">{f.label}</span>
                <span
                  className={`font-medium flex-shrink-0 ${
                    f.impact > 0
                      ? "text-emerald-600"
                      : f.impact < 0
                        ? "text-red-600"
                        : "text-slate-400"
                  }`}
                >
                  {f.impact > 0 ? "+" : ""}
                  {f.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
