import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, getActivities, addStakeholder, updateStakeholder, addActivity, getWorkspace } from "@/lib/data";
import { parseTranscript, findStakeholderMatch } from "@/lib/claude";
import {
  ActivityType,
  SmartImportParseResult,
  SmartImportConfirmPayload,
  SmartImportConfirmResult,
  Stakeholder,
} from "@/lib/types";

function getWorkspaceId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("workspace") || "ai-labs";
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(request);
    const body = await request.json();
    const { action } = body;

    if (action === "parse") {
      return handleParse(workspaceId, body);
    } else if (action === "confirm") {
      return handleConfirm(workspaceId, body);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'parse' or 'confirm'." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Smart import error:", error);
    const message = error instanceof Error ? error.message : "Smart import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleParse(workspaceId: string, body: {
  transcript: string;
  sourceType: ActivityType;
}) {
  const { transcript, sourceType } = body;

  if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json(
      { error: "Please provide a transcript or email content to analyze." },
      { status: 400 }
    );
  }

  if (!sourceType) {
    return NextResponse.json(
      { error: "Please select a source type." },
      { status: 400 }
    );
  }

  const stakeholders = getStakeholders(workspaceId);
  const workspace = getWorkspace(workspaceId);
  const result = await parseTranscript(transcript, sourceType, stakeholders, workspace?.teams);

  // Strip markdown code blocks if present
  let cleaned = result.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: SmartImportParseResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response. Please try again." },
      { status: 500 }
    );
  }

  // Enrich with stakeholder matching
  if (parsed.stakeholders) {
    parsed.stakeholders = parsed.stakeholders.map((extracted) => {
      const match = findStakeholderMatch(extracted.name, stakeholders);
      if (match) {
        const existingStakeholder = stakeholders.find((s) => s.id === match.id);
        return {
          ...extracted,
          name: existingStakeholder?.name || extracted.name,
          matchStatus: "existing" as const,
          matchedStakeholderId: match.id,
          matchConfidence: match.confidence,
        };
      }
      return {
        ...extracted,
        matchStatus: "new" as const,
      };
    });
  }

  return NextResponse.json(parsed);
}

async function handleConfirm(workspaceId: string, body: { payload: SmartImportConfirmPayload }) {
  const { payload } = body;

  if (!payload) {
    return NextResponse.json(
      { error: "No import payload provided." },
      { status: 400 }
    );
  }

  const result: SmartImportConfirmResult = {
    createdStakeholders: [],
    updatedStakeholders: [],
    createdActivity: null as unknown as SmartImportConfirmResult["createdActivity"],
  };

  const stakeholderIdMap: Record<string, string> = {};

  // Create new stakeholders
  for (const s of payload.stakeholders) {
    if (s.matchStatus === "new") {
      const created = addStakeholder(workspaceId, {
        name: s.name,
        title: s.title,
        team: s.team,
        role: s.role,
        priority: s.priority,
        lastContactDate: payload.activity.date,
        relationshipStrength: s.relationshipStrength,
        keyPriorities: s.keyPriorities,
        notes: s.notes,
        email: s.email,
      });
      result.createdStakeholders.push(created);
      stakeholderIdMap[s.name] = created.id;
    } else if (s.matchedStakeholderId) {
      stakeholderIdMap[s.name] = s.matchedStakeholderId;
    }
  }

  // Update existing stakeholders
  if (payload.stakeholderUpdates) {
    for (const update of payload.stakeholderUpdates) {
      const existing = getStakeholders(workspaceId).find((s) => s.id === update.id);
      if (!existing) continue;

      const updates: Partial<Stakeholder> = {};

      if (update.lastContactDate) {
        if (!existing.lastContactDate || update.lastContactDate > existing.lastContactDate) {
          updates.lastContactDate = update.lastContactDate;
        }
      }

      if (update.keyPriorities && update.keyPriorities.length > 0) {
        const merged = [...new Set([...existing.keyPriorities, ...update.keyPriorities])];
        updates.keyPriorities = merged;
      }

      if (update.relationshipStrength) {
        updates.relationshipStrength = update.relationshipStrength;
      }

      if (update.notes) {
        updates.notes = existing.notes
          ? `${existing.notes}\n\n[Smart Import ${payload.activity.date}] ${update.notes}`
          : update.notes;
      }

      if (Object.keys(updates).length > 0) {
        const updated = updateStakeholder(workspaceId, update.id, updates);
        if (updated) {
          result.updatedStakeholders.push(updated);
        }
      }
    }
  }

  // Create activity
  const allStakeholderIds = Object.values(stakeholderIdMap);
  const activity = addActivity(workspaceId, {
    date: payload.activity.date,
    type: payload.activity.type,
    summary: `[Smart Import] ${payload.activity.summary}`,
    stakeholderIds: allStakeholderIds,
  });
  result.createdActivity = activity;

  return NextResponse.json(result);
}
