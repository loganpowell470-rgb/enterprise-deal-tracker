export type DealRole =
  | "Economic Buyer"
  | "Champion"
  | "Influencer"
  | "Technical Buyer"
  | "End User"
  | "Blocker";

export type Priority = "P0" | "P1" | "P2";

export type RelationshipStrength =
  | "Strong"
  | "Neutral"
  | "Weak"
  | "At Risk"
  | "Unknown";

export type ActivityType = "Meeting" | "Email" | "Call" | "Slack";

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  team: string;
  role: DealRole;
  priority: Priority;
  lastContactDate: string | null; // ISO date string or null for "never"
  relationshipStrength: RelationshipStrength;
  keyPriorities: string[];
  notes: string;
  email?: string;
}

export interface Activity {
  id: string;
  date: string; // ISO date string
  stakeholderIds: string[];
  type: ActivityType;
  summary: string;
}

export interface DealHealthData {
  score: number;
  reasoning: string;
  alerts: string[];
  suggestions: string[];
}

export interface MeetingBrief {
  attendees: {
    name: string;
    title: string;
    role: DealRole;
    relationshipStatus: RelationshipStrength;
    priorities: string[];
    recentInteractions: string;
  }[];
  talkingPoints: string[];
  openQuestions: string[];
  recommendedNextSteps: string[];
  fullBrief: string;
}

export interface InsightItem {
  type: "coverage_gap" | "engagement_risk" | "missing_stakeholder" | "strategic";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionItem: string;
}

export const TEAMS = [
  "Engineering Infrastructure",
  "Finance",
  "Legal/Compliance",
  "Product Team A",
  "Product Team B",
  "Security",
  "Procurement",
] as const;

export const DEAL_ROLES: DealRole[] = [
  "Economic Buyer",
  "Champion",
  "Influencer",
  "Technical Buyer",
  "End User",
  "Blocker",
];

export const PRIORITIES: Priority[] = ["P0", "P1", "P2"];

export const RELATIONSHIP_STRENGTHS: RelationshipStrength[] = [
  "Strong",
  "Neutral",
  "Weak",
  "At Risk",
  "Unknown",
];

export const ACTIVITY_TYPES: ActivityType[] = [
  "Meeting",
  "Email",
  "Call",
  "Slack",
];
