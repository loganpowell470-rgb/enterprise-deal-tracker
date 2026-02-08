import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, getActivities, getWorkspace } from "@/lib/data";
import { generateInsights } from "@/lib/claude";

function getWorkspaceId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("workspace") || "ai-labs";
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(request);
    const stakeholders = getStakeholders(workspaceId);
    const activities = getActivities(workspaceId);
    const workspace = getWorkspace(workspaceId);
    const result = await generateInsights(stakeholders, activities, workspace);

    // Strip markdown code blocks if present, then parse JSON
    let cleaned = result.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ raw: result });
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis. Please check your API key." },
      { status: 500 }
    );
  }
}
