import { NextResponse } from "next/server";
import { getStakeholders, getActivities } from "@/lib/data";
import { generateInsights } from "@/lib/claude";

export async function POST() {
  try {
    const stakeholders = getStakeholders();
    const activities = getActivities();
    const result = await generateInsights(stakeholders, activities);

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
