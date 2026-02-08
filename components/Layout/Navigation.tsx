"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Brain,
  Calendar,
  Clock,
  Target,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stakeholders", label: "Stakeholders", icon: Users },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/meeting-prep", label: "Meeting Prep", icon: Calendar },
  { href: "/timeline", label: "Timeline", icon: Clock },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-slate-900 text-white flex flex-col z-50">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Target className="w-7 h-7 text-indigo-400" />
          <div>
            <h1 className="text-base font-bold leading-tight">Deal Command</h1>
            <p className="text-[11px] text-slate-400">Enterprise Multi-Threading</p>
          </div>
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

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-300">AI Labs Inc.</p>
          <p className="text-[11px] text-slate-500">Enterprise Account</p>
          <p className="text-[11px] text-slate-500 mt-1">Renewal in ~60 days</p>
        </div>
      </div>
    </nav>
  );
}
