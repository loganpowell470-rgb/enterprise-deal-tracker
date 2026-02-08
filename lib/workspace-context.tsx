"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WorkspaceData {
  id: string;
  name: string;
  description: string;
  dealContext: string;
  dealSummary: string;
  renewalInfo: string;
  teams: string[];
  color: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceData[];
  activeWorkspace: WorkspaceData | null;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  setActiveWorkspaceId: () => {},
  refreshWorkspaces: async () => {},
  loading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeWorkspace") || "ai-labs";
    }
    return "ai-labs";
  });
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      setWorkspaces(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const setActiveWorkspaceId = (id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeWorkspace", id);
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeId) || null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, activeWorkspace, setActiveWorkspaceId, refreshWorkspaces: fetchWorkspaces, loading }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
