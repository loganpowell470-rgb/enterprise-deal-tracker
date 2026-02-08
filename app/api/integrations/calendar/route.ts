import { NextResponse } from "next/server";
import { syncCalendar } from "@/lib/integrations/calendar";

export async function POST() {
  try {
    const result = await syncCalendar();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendar sync failed";
    console.error("Calendar sync error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
