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

// --- Workspace Types ---

export interface Workspace {
  id: string;
  name: string;
  description: string;
  dealContext: string;
  dealSummary: string;
  renewalInfo: string;
  teams: string[];
  color: string;
}

// --- Smart Import Types ---

export interface ExtractedStakeholder {
  name: string;
  title: string;
  team: string;
  role: DealRole;
  priority: Priority;
  relationshipStrength: RelationshipStrength;
  keyPriorities: string[];
  notes: string;
  email?: string;
  matchStatus: "new" | "existing";
  matchedStakeholderId?: string;
  matchConfidence?: number;
}

export interface ExtractedActionItem {
  description: string;
  owner: string;
  deadline?: string;
}

export interface SentimentSignal {
  stakeholderName: string;
  sentiment: "positive" | "negative" | "neutral";
  signal: string;
}

export interface SmartImportParseResult {
  stakeholders: ExtractedStakeholder[];
  actionItems: ExtractedActionItem[];
  sentimentSignals: SentimentSignal[];
  proposedActivity: {
    date: string;
    type: ActivityType;
    summary: string;
    stakeholderNames: string[];
  };
}

export interface SmartImportConfirmPayload {
  stakeholders: ExtractedStakeholder[];
  activity: {
    date: string;
    type: ActivityType;
    summary: string;
  };
  stakeholderUpdates: {
    id: string;
    keyPriorities?: string[];
    relationshipStrength?: RelationshipStrength;
    notes?: string;
    lastContactDate?: string;
  }[];
}

export interface SmartImportConfirmResult {
  createdStakeholders: Stakeholder[];
  updatedStakeholders: Stakeholder[];
  createdActivity: Activity;
}
