import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, addStakeholder } from "@/lib/data";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace") || "ai-labs";
  const stakeholders = getStakeholders(workspaceId);
  return NextResponse.json(stakeholders);
}

export async function POST(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspace") || "ai-labs";
  const body = await request.json();
  const stakeholder = addStakeholder(workspaceId, body);
  return NextResponse.json(stakeholder, { status: 201 });
}
