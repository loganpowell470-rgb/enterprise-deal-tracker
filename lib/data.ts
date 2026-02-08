import { Stakeholder, Activity } from "./types";
import fs from "fs";
import path from "path";

const STAKEHOLDERS_PATH = path.join(
  process.cwd(),
  "data",
  "stakeholders.json"
);
const ACTIVITIES_PATH = path.join(process.cwd(), "data", "activities.json");

export function getStakeholders(): Stakeholder[] {
  const data = fs.readFileSync(STAKEHOLDERS_PATH, "utf-8");
  return JSON.parse(data);
}

export function getStakeholder(id: string): Stakeholder | undefined {
  const stakeholders = getStakeholders();
  return stakeholders.find((s) => s.id === id);
}

export function saveStakeholders(stakeholders: Stakeholder[]): void {
  fs.writeFileSync(STAKEHOLDERS_PATH, JSON.stringify(stakeholders, null, 2));
}

export function addStakeholder(
  stakeholder: Omit<Stakeholder, "id">
): Stakeholder {
  const stakeholders = getStakeholders();
  const maxId = stakeholders.reduce((max, s) => {
    const num = parseInt(s.id.replace("s", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newStakeholder: Stakeholder = {
    ...stakeholder,
    id: `s${maxId + 1}`,
  };
  stakeholders.push(newStakeholder);
  saveStakeholders(stakeholders);
  return newStakeholder;
}

export function updateStakeholder(
  id: string,
  updates: Partial<Stakeholder>
): Stakeholder | null {
  const stakeholders = getStakeholders();
  const index = stakeholders.findIndex((s) => s.id === id);
  if (index === -1) return null;
  stakeholders[index] = { ...stakeholders[index], ...updates, id };
  saveStakeholders(stakeholders);
  return stakeholders[index];
}

export function deleteStakeholder(id: string): boolean {
  const stakeholders = getStakeholders();
  const filtered = stakeholders.filter((s) => s.id !== id);
  if (filtered.length === stakeholders.length) return false;
  saveStakeholders(filtered);
  // Also remove from activities
  const activities = getActivities();
  const updatedActivities = activities
    .map((a) => ({
      ...a,
      stakeholderIds: a.stakeholderIds.filter((sid) => sid !== id),
    }))
    .filter((a) => a.stakeholderIds.length > 0);
  saveActivities(updatedActivities);
  return true;
}

export function getActivities(): Activity[] {
  const data = fs.readFileSync(ACTIVITIES_PATH, "utf-8");
  return JSON.parse(data);
}

export function saveActivities(activities: Activity[]): void {
  fs.writeFileSync(ACTIVITIES_PATH, JSON.stringify(activities, null, 2));
}

export function addActivity(activity: Omit<Activity, "id">): Activity {
  const activities = getActivities();
  const maxId = activities.reduce((max, a) => {
    const num = parseInt(a.id.replace("a", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newActivity: Activity = {
    ...activity,
    id: `a${maxId + 1}`,
  };
  activities.push(newActivity);
  saveActivities(activities);
  return newActivity;
}

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
  let score = 50; // Base score
  const factors: { label: string; impact: number; detail: string }[] = [];

  // Champion presence (+15 max)
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

  // Economic buyer engagement (+15 max)
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

  // Blocker management (-20 max penalty)
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

  // Team coverage (+10 max)
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

  // Relationship health (+10 max)
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

  // Recency of contact (+10 max)
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
