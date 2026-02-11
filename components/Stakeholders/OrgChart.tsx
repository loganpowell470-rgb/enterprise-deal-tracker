"use client";

import { Stakeholder } from "@/lib/types";
import Link from "next/link";
import { useMemo } from "react";

interface TreeNode {
  stakeholder: Stakeholder;
  children: TreeNode[];
}

const roleColors: Record<string, string> = {
  "Economic Buyer": "bg-purple-100 text-purple-700 border-purple-200",
  Champion: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Influencer: "bg-blue-100 text-blue-700 border-blue-200",
  "Technical Buyer": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "End User": "bg-slate-100 text-slate-600 border-slate-200",
  Blocker: "bg-red-100 text-red-700 border-red-200",
};

const strengthBorder: Record<string, string> = {
  Strong: "border-l-emerald-500",
  Neutral: "border-l-slate-400",
  Weak: "border-l-amber-500",
  "At Risk": "border-l-red-500",
  Unknown: "border-l-slate-300",
};

const strengthDot: Record<string, string> = {
  Strong: "bg-emerald-500",
  Neutral: "bg-slate-400",
  Weak: "bg-amber-500",
  "At Risk": "bg-red-500",
  Unknown: "bg-slate-300",
};

const priorityColors: Record<string, string> = {
  P0: "bg-red-600 text-white",
  P1: "bg-amber-500 text-white",
  P2: "bg-slate-400 text-white",
};

function OrgChartNode({ node, depth }: { node: TreeNode; depth: number }) {
  const s = node.stakeholder;
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <Link
        href={`/stakeholders/${s.id}`}
        className={`relative block bg-white rounded-lg border-l-4 ${strengthBorder[s.relationshipStrength]} border border-slate-200 px-3 py-2.5 w-48 card-hover group shadow-sm`}
        style={{ animation: `fadeUp 0.4s ease-out ${depth * 0.12}s both` }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0 transition-transform group-hover:scale-110">
            {s.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {s.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{s.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${roleColors[s.role]}`}
          >
            {s.role}
          </span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${strengthDot[s.relationshipStrength]}`} />
            <span className="text-[9px] text-slate-500">{s.relationshipStrength}</span>
          </div>
          <span
            className={`ml-auto px-1 py-0.5 rounded text-[8px] font-bold ${priorityColors[s.priority]}`}
          >
            {s.priority}
          </span>
        </div>
      </Link>

      {/* Connector lines + children */}
      {hasChildren && (
        <>
          {/* Vertical line down from parent */}
          <div className="w-px h-5 bg-slate-300" />

          {/* Horizontal bar + children */}
          {node.children.length === 1 ? (
            /* Single child: just vertical line continues */
            <OrgChartNode node={node.children[0]} depth={depth + 1} />
          ) : (
            /* Multiple children: horizontal bar with branches */
            <div className="relative">
              {/* Horizontal connector bar spanning from first to last child center */}
              <div
                className="absolute top-0 bg-slate-300"
                style={{
                  height: "1px",
                  left: `calc(${(100 / node.children.length) * 0.5}%)`,
                  right: `calc(${(100 / node.children.length) * 0.5}%)`,
                }}
              />
              <div className="flex gap-3">
                {node.children.map((child) => (
                  <div key={child.stakeholder.id} className="relative flex flex-col items-center">
                    {/* Vertical line from horizontal bar to child */}
                    <div className="w-px h-5 bg-slate-300" />
                    <OrgChartNode node={child} depth={depth + 1} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrgChart({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const trees = useMemo(() => {
    const idMap = new Map<string, Stakeholder>();
    stakeholders.forEach((s) => idMap.set(s.id, s));

    // Build children map
    const childrenMap = new Map<string, Stakeholder[]>();
    const roots: Stakeholder[] = [];

    stakeholders.forEach((s) => {
      if (!s.reportsTo || !idMap.has(s.reportsTo)) {
        roots.push(s);
      } else {
        const list = childrenMap.get(s.reportsTo) || [];
        list.push(s);
        childrenMap.set(s.reportsTo, list);
      }
    });

    function buildTree(s: Stakeholder): TreeNode {
      const children = (childrenMap.get(s.id) || []).map(buildTree);
      return { stakeholder: s, children };
    }

    return roots.map(buildTree);
  }, [stakeholders]);

  if (stakeholders.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 animate-fade-up">
        <p className="text-lg font-medium">No stakeholders found</p>
        <p className="text-sm mt-1">Try adjusting your filters or add a new stakeholder</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-flex gap-10 min-w-full justify-center pt-4">
        {trees.map((tree) => (
          <OrgChartNode key={tree.stakeholder.id} node={tree} depth={0} />
        ))}
      </div>
    </div>
  );
}
