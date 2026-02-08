import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, getActivities, getWorkspace } from "@/lib/data";
import { generateMeetingPrep } from "@/lib/claude";

function getWorkspaceId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("workspace") || "ai-labs";
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = getWorkspaceId(request);
    const { stakeholderIds, context } = await request.json();

    if (!stakeholderIds || !Array.isArray(stakeholderIds) || stakeholderIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one stakeholder" },
        { status: 400 }
      );
    }

    const stakeholders = getStakeholders(workspaceId);
    const activities = getActivities(workspaceId);
    const workspace = getWorkspace(workspaceId);
    const brief = await generateMeetingPrep(
      stakeholders,
      stakeholderIds,
      activities,
      context,
      workspace
    );

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Meeting prep error:", error);
    return NextResponse.json(
      { error: "Failed to generate meeting prep. Please check your API key." },
      { status: 500 }
    );
  }
}
