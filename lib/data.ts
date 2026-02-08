import { Stakeholder, Activity, Workspace } from "./types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// --- Workspace functions ---

export function getWorkspaces(): Workspace[] {
  const filePath = path.join(DATA_DIR, "workspaces.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

export function getWorkspace(workspaceId: string): Workspace | undefined {
  return getWorkspaces().find((w) => w.id === workspaceId);
}

export function saveWorkspaces(workspaces: Workspace[]): void {
  const filePath = path.join(DATA_DIR, "workspaces.json");
  fs.writeFileSync(filePath, JSON.stringify(workspaces, null, 2));
}

export function addWorkspace(workspace: Workspace): Workspace {
  const workspaces = getWorkspaces();
  if (workspaces.find((w) => w.id === workspace.id)) {
    throw new Error(`Workspace "${workspace.id}" already exists`);
  }
  workspaces.push(workspace);
  saveWorkspaces(workspaces);
  // Create workspace data directory with empty files
  const safe = workspace.id.replace(/[^a-z0-9-]/g, "");
  const dirPath = path.join(DATA_DIR, safe);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, "stakeholders.json"), "[]");
  fs.writeFileSync(path.join(dirPath, "activities.json"), "[]");
  return workspace;
}

function getWorkspacePath(workspaceId: string, file: string): string {
  const safe = workspaceId.replace(/[^a-z0-9-]/g, "");
  return path.join(DATA_DIR, safe, file);
}

// --- Stakeholder functions ---

export function getStakeholders(workspaceId: string): Stakeholder[] {
  const filePath = getWorkspacePath(workspaceId, "stakeholders.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

export function getStakeholder(
  workspaceId: string,
  id: string
): Stakeholder | undefined {
  const stakeholders = getStakeholders(workspaceId);
  return stakeholders.find((s) => s.id === id);
}

export function saveStakeholders(
  workspaceId: string,
  stakeholders: Stakeholder[]
): void {
  const filePath = getWorkspacePath(workspaceId, "stakeholders.json");
  fs.writeFileSync(filePath, JSON.stringify(stakeholders, null, 2));
}

export function addStakeholder(
  workspaceId: string,
  stakeholder: Omit<Stakeholder, "id">
): Stakeholder {
  const stakeholders = getStakeholders(workspaceId);
  const maxId = stakeholders.reduce((max, s) => {
    const num = parseInt(s.id.replace("s", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newStakeholder: Stakeholder = {
    ...stakeholder,
    id: `s${maxId + 1}`,
  };
  stakeholders.push(newStakeholder);
  saveStakeholders(workspaceId, stakeholders);
  return newStakeholder;
}

export function updateStakeholder(
  workspaceId: string,
  id: string,
  updates: Partial<Stakeholder>
): Stakeholder | null {
  const stakeholders = getStakeholders(workspaceId);
  const index = stakeholders.findIndex((s) => s.id === id);
  if (index === -1) return null;
  stakeholders[index] = { ...stakeholders[index], ...updates, id };
  saveStakeholders(workspaceId, stakeholders);
  return stakeholders[index];
}

export function deleteStakeholder(workspaceId: string, id: string): boolean {
  const stakeholders = getStakeholders(workspaceId);
  const filtered = stakeholders.filter((s) => s.id !== id);
  if (filtered.length === stakeholders.length) return false;
  saveStakeholders(workspaceId, filtered);
  const activities = getActivities(workspaceId);
  const updatedActivities = activities
    .map((a) => ({
      ...a,
      stakeholderIds: a.stakeholderIds.filter((sid) => sid !== id),
    }))
    .filter((a) => a.stakeholderIds.length > 0);
  saveActivities(workspaceId, updatedActivities);
  return true;
}

// --- Activity functions ---

export function getActivities(workspaceId: string): Activity[] {
  const filePath = getWorkspacePath(workspaceId, "activities.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

export function saveActivities(
  workspaceId: string,
  activities: Activity[]
): void {
  const filePath = getWorkspacePath(workspaceId, "activities.json");
  fs.writeFileSync(filePath, JSON.stringify(activities, null, 2));
}

export function addActivity(
  workspaceId: string,
  activity: Omit<Activity, "id">
): Activity {
  const activities = getActivities(workspaceId);
  const maxId = activities.reduce((max, a) => {
    const num = parseInt(a.id.replace("a", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newActivity: Activity = {
    ...activity,
    id: `a${maxId + 1}`,
  };
  activities.push(newActivity);
  saveActivities(workspaceId, activities);
  return newActivity;
}

// --- Utility functions ---

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function computeDealHealthScore(stakeholders: Stakeholder[]): {
  score: number;
  factors: { label: string; impact: number; detail: string }[];
} {
  let score = 50;
  const factors: { label: string; impact: number; detail: string }[] = [];

  const champions = stakeholders.filter((s) => s.role === "Champion");
  const strongChampions = champions.filter(
    (s) => s.relationshipStrength === "Strong"
  );
  if (strongChampions.length >= 2) {
    score += 15;
    factors.push({
      label: "Strong champions",
      impact: 15,
      detail: `${strongChampions.length} strong champion relationships`,
    });
  } else if (strongChampions.length === 1) {
    score += 8;
    factors.push({
      label: "Champion coverage",
      impact: 8,
      detail: "1 strong champion, need backup",
    });
  }

  const econBuyers = stakeholders.filter((s) => s.role === "Economic Buyer");
  const engagedBuyers = econBuyers.filter((s) => {
    const days = daysSince(s.lastContactDate);
    return days !== null && days < 30 && s.relationshipStrength !== "Weak";
  });
  if (engagedBuyers.length === econBuyers.length && econBuyers.length > 0) {
    score += 15;
    factors.push({
      label: "Economic buyer engagement",
      impact: 15,
      detail: "All economic buyers recently engaged",
    });
  } else {
    const penalty = -10;
    score += penalty;
    factors.push({
      label: "Economic buyer gap",
      impact: penalty,
      detail: `${econBuyers.length - engagedBuyers.length} of ${econBuyers.length} economic buyers not recently engaged`,
    });
  }

  const blockers = stakeholders.filter((s) => s.role === "Blocker");
  const unengagedBlockers = blockers.filter((s) => {
    const days = daysSince(s.lastContactDate);
    return (
      days === null ||
      days > 30 ||
      s.relationshipStrength === "At Risk" ||
      s.relationshipStrength === "Unknown"
    );
  });
  if (unengagedBlockers.length > 0) {
    const penalty = -8 * unengagedBlockers.length;
    score += penalty;
    factors.push({
      label: "Unmanaged blockers",
      impact: penalty,
      detail: `${unengagedBlockers.length} blocker(s) not engaged or at risk`,
    });
  }

  const teams = new Set(stakeholders.map((s) => s.team));
  const engagedTeams = new Set(
    stakeholders
      .filter((s) => {
        const days = daysSince(s.lastContactDate);
        return days !== null && days < 45;
      })
      .map((s) => s.team)
  );
  const coverageRatio = engagedTeams.size / teams.size;
  const coveragePoints = Math.round(coverageRatio * 10);
  score += coveragePoints;
  factors.push({
    label: "Team coverage",
    impact: coveragePoints,
    detail: `${engagedTeams.size} of ${teams.size} teams recently engaged`,
  });

  const strongRelationships = stakeholders.filter(
    (s) => s.relationshipStrength === "Strong"
  ).length;
  const atRisk = stakeholders.filter(
    (s) =>
      s.relationshipStrength === "At Risk" ||
      s.relationshipStrength === "Weak"
  ).length;
  const healthPoints = Math.min(
    10,
    Math.round((strongRelationships / stakeholders.length) * 15) -
      Math.round((atRisk / stakeholders.length) * 10)
  );
  score += healthPoints;
  factors.push({
    label: "Relationship health",
    impact: healthPoints,
    detail: `${strongRelationships} strong, ${atRisk} weak/at-risk`,
  });

  const recentContacts = stakeholders.filter((s) => {
    const days = daysSince(s.lastContactDate);
    return days !== null && days < 14;
  }).length;
  const recencyPoints = Math.min(
    10,
    Math.round((recentContacts / stakeholders.length) * 15)
  );
  score += recencyPoints;
  factors.push({
    label: "Contact recency",
    impact: recencyPoints,
    detail: `${recentContacts} stakeholders contacted in last 2 weeks`,
  });

  return { score: Math.max(0, Math.min(100, score)), factors };
}
