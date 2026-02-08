import Anthropic from "@anthropic-ai/sdk";
import { Stakeholder, Activity, ActivityType, Workspace, TEAMS, DEAL_ROLES, PRIORITIES, RELATIONSHIP_STRENGTHS } from "./types";
import { daysSince } from "./data";
import fs from "fs";
import path from "path";

function getApiKey(): string {
  // process.env may have an empty string override from the parent shell,
  // so read directly from .env.local as a fallback
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey && envKey.length > 0) return envKey;

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    // ignore
  }
  throw new Error("ANTHROPIC_API_KEY not found");
}

function getClient() {
  return new Anthropic({
    apiKey: getApiKey(),
  });
}

function buildStakeholderContext(
  stakeholders: Stakeholder[],
  activities: Activity[],
  workspace?: Workspace
): string {
  const stakeholderSummary = stakeholders
    .map((s) => {
      const days = daysSince(s.lastContactDate);
      const daysSinceStr =
        days === null ? "Never contacted" : `${days} days ago`;
      return `- ${s.name} (${s.title}, ${s.team}) | Role: ${s.role} | Priority: ${s.priority} | Relationship: ${s.relationshipStrength} | Last Contact: ${daysSinceStr} | Priorities: ${s.keyPriorities.join(", ")} | Notes: ${s.notes}`;
    })
    .join("\n");

  const recentActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15)
    .map((a) => {
      const names = a.stakeholderIds
        .map((id) => stakeholders.find((s) => s.id === id)?.name || id)
        .join(", ");
      return `- ${a.date} [${a.type}] with ${names}: ${a.summary}`;
    })
    .join("\n");

  const accountName = workspace?.name || "AI Labs Inc.";
  const accountDesc = workspace?.description || "Enterprise AI Platform Account";
  const dealCtx = workspace?.dealContext || "Renewal and expansion deal. Currently at ~$400K ARR, targeting $1M ARR expansion. Renewal window in ~60 days.";

  return `ACCOUNT: ${accountName} (${accountDesc})
DEAL CONTEXT: ${dealCtx}

STAKEHOLDERS (${stakeholders.length} total):
${stakeholderSummary}

RECENT ACTIVITIES:
${recentActivities}

TEAM COVERAGE:
${Array.from(new Set(stakeholders.map((s) => s.team)))
  .map((team) => {
    const teamMembers = stakeholders.filter((s) => s.team === team);
    const engaged = teamMembers.filter((s) => {
      const d = daysSince(s.lastContactDate);
      return d !== null && d < 30;
    });
    return `- ${team}: ${engaged.length}/${teamMembers.length} engaged in last 30 days`;
  })
  .join("\n")}`;
}

export async function generateInsights(
  stakeholders: Stakeholder[],
  activities: Activity[],
  workspace?: Workspace
): Promise<string> {
  const context = buildStakeholderContext(stakeholders, activities, workspace);

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are an expert enterprise sales strategist analyzing an account. Based on the stakeholder data below, generate actionable insights.

${context}

Generate a JSON response with this exact structure:
{
  "dealHealthScore": {
    "score": <number 0-100>,
    "reasoning": "<2-3 sentence explanation>"
  },
  "insights": [
    {
      "type": "coverage_gap" | "engagement_risk" | "missing_stakeholder" | "strategic",
      "severity": "critical" | "warning" | "info",
      "title": "<short title>",
      "description": "<2-3 sentence description>",
      "actionItem": "<specific next step>"
    }
  ]
}

Generate 5-7 insights, ordered by severity. Be specific with names, dates, and numbers. Focus on:
1. Coverage gaps (unengaged teams or roles)
2. Engagement risks (relationships cooling, long gaps since contact)
3. Missing stakeholder connections
4. Strategic suggestions for advancing the deal

Respond with ONLY the JSON, no markdown code blocks.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text || "{}";
}

export async function generateMeetingPrep(
  stakeholders: Stakeholder[],
  selectedIds: string[],
  activities: Activity[],
  meetingContext?: string,
  workspace?: Workspace
): Promise<string> {
  const selectedStakeholders = stakeholders.filter((s) =>
    selectedIds.includes(s.id)
  );
  const allContext = buildStakeholderContext(stakeholders, activities, workspace);

  const attendeeDetails = selectedStakeholders
    .map((s) => {
      const days = daysSince(s.lastContactDate);
      const daysSinceStr =
        days === null ? "Never contacted" : `${days} days ago`;
      const relevantActivities = activities
        .filter((a) => a.stakeholderIds.includes(s.id))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 3);
      const activityStr = relevantActivities.length
        ? relevantActivities
            .map((a) => `  * ${a.date} [${a.type}]: ${a.summary}`)
            .join("\n")
        : "  * No recorded interactions";
      return `ATTENDEE: ${s.name}
  Title: ${s.title} (${s.team})
  Deal Role: ${s.role} | Priority: ${s.priority}
  Relationship: ${s.relationshipStrength} | Last Contact: ${daysSinceStr}
  Key Priorities: ${s.keyPriorities.join(", ")}
  Notes: ${s.notes}
  Recent Interactions:
${activityStr}`;
    })
    .join("\n\n");

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are an expert enterprise sales strategist preparing a meeting brief. Create a comprehensive, actionable meeting prep document.

FULL ACCOUNT CONTEXT:
${allContext}

MEETING ATTENDEES:
${attendeeDetails}

${meetingContext ? `MEETING CONTEXT: ${meetingContext}` : ""}

Create a meeting prep brief in clean markdown format with these sections:

## Meeting Brief: [Meeting Title based on attendees]

### Attendee Profiles
For each attendee, provide:
- Name, title, and role in the deal
- Current relationship status and what they care about
- Recent interaction summary
- Watch-outs or sensitivities

### Suggested Talking Points
- 5-7 specific talking points tailored to this audience
- Reference their priorities and concerns

### Open Questions to Address
- 3-5 questions or concerns these stakeholders likely have
- Include any unresolved items from past interactions

### Recommended Next Steps
- 3-5 specific follow-up actions after this meeting
- Include timeline suggestions

### Pre-Meeting Preparation Checklist
- Materials to prepare or bring
- People to align with before the meeting
- Key messages to reinforce

Be specific, use names, reference actual data points and history. Make it immediately actionable.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text || "";
}

export function findStakeholderMatch(
  extractedName: string,
  existingStakeholders: Stakeholder[]
): { id: string; confidence: number } | null {
  const normalize = (s: string) => s.toLowerCase().trim();
  const extracted = normalize(extractedName);

  for (const s of existingStakeholders) {
    const existing = normalize(s.name);

    if (extracted === existing) {
      return { id: s.id, confidence: 100 };
    }

    const extractedParts = extracted.split(/\s+/);
    const existingParts = existing.split(/\s+/);

    // Full first + last name match with different middle/suffix
    if (
      extractedParts.length > 1 &&
      existingParts.length > 1 &&
      extractedParts[0] === existingParts[0] &&
      extractedParts[extractedParts.length - 1] === existingParts[existingParts.length - 1]
    ) {
      return { id: s.id, confidence: 95 };
    }

    // First name only match
    if (
      extractedParts[0] === existingParts[0] &&
      (extractedParts.length === 1 || existingParts.length === 1)
    ) {
      return { id: s.id, confidence: 75 };
    }

    // Last name match
    if (
      extractedParts.length > 1 &&
      existingParts.length > 1 &&
      extractedParts[extractedParts.length - 1] === existingParts[existingParts.length - 1]
    ) {
      return { id: s.id, confidence: 60 };
    }

    // Check if either name contains the other
    if (existing.includes(extracted) || extracted.includes(existing)) {
      return { id: s.id, confidence: 70 };
    }
  }

  return null;
}

export async function parseTranscript(
  transcript: string,
  sourceType: ActivityType,
  existingStakeholders: Stakeholder[],
  teams?: string[]
): Promise<string> {
  const existingList = existingStakeholders
    .map((s) => `- ${s.name} (${s.title}, ${s.team}, ${s.role})`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  const message = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are an expert enterprise sales analyst. Parse the following ${sourceType.toLowerCase()} transcript/content and extract structured intelligence about stakeholders, action items, and relationship signals.

EXISTING STAKEHOLDERS IN OUR SYSTEM:
${existingList || "(none)"}

VALID VALUES FOR FIELDS:
- Teams: ${(teams && teams.length > 0 ? teams : TEAMS).join(", ")}
- Deal Roles: ${DEAL_ROLES.join(", ")}
- Priorities: ${PRIORITIES.join(", ")}
- Relationship Strengths: ${RELATIONSHIP_STRENGTHS.join(", ")}

TODAY'S DATE: ${today}

TRANSCRIPT/CONTENT:
---
${transcript}
---

Extract the following and return as JSON:

{
  "stakeholders": [
    {
      "name": "Full Name",
      "title": "Job Title (infer if not explicit)",
      "team": "One of the valid teams above (infer best match)",
      "role": "One of the valid deal roles above",
      "priority": "P0, P1, or P2",
      "relationshipStrength": "One of the valid values above",
      "keyPriorities": ["priority1", "priority2"],
      "notes": "Key observations about this person from the transcript",
      "email": "email@example.com (if mentioned, otherwise omit)"
    }
  ],
  "actionItems": [
    {
      "description": "What needs to be done",
      "owner": "Person responsible",
      "deadline": "When it's due (if mentioned)"
    }
  ],
  "sentimentSignals": [
    {
      "stakeholderName": "Person's name",
      "sentiment": "positive | negative | neutral",
      "signal": "The specific phrase, behavior, or context that indicates this sentiment"
    }
  ],
  "proposedActivity": {
    "date": "${today}",
    "type": "${sourceType}",
    "summary": "A concise 1-2 sentence summary of this interaction, including key topics discussed and any decisions made",
    "stakeholderNames": ["Name1", "Name2"]
  }
}

RULES:
- Only include people who are clearly stakeholders in the deal (not your own team members)
- For existing stakeholders, use their exact name as shown in the existing list
- For the team field, always choose from the valid teams list. Pick the closest match.
- Include ALL action items mentioned, even informal ones
- Sentiment signals should be specific and tied to observable behavior or quotes
- The activity summary should be suitable for a timeline entry

Respond with ONLY the JSON, no markdown code blocks.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text || "{}";
}
