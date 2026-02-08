import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, getActivities } from "@/lib/data";
import { generateMeetingPrep } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { stakeholderIds, context } = await request.json();

    if (!stakeholderIds || !Array.isArray(stakeholderIds) || stakeholderIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one stakeholder" },
        { status: 400 }
      );
    }

    const stakeholders = getStakeholders();
    const activities = getActivities();
    const brief = await generateMeetingPrep(
      stakeholders,
      stakeholderIds,
      activities,
      context
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
