import { NextRequest, NextResponse } from "next/server";
import { getActivities, addActivity } from "@/lib/data";

function getWorkspaceId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("workspace") || "ai-labs";
}

export async function GET(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const activities = getActivities(workspaceId);
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const body = await request.json();
  const activity = addActivity(workspaceId, body);
  return NextResponse.json(activity, { status: 201 });
}
