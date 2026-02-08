import { NextRequest, NextResponse } from "next/server";
import { getActivities, addActivity } from "@/lib/data";

export async function GET() {
  const activities = getActivities();
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const activity = addActivity(body);
  return NextResponse.json(activity, { status: 201 });
}
