import { NextResponse } from "next/server";
import { syncGmail } from "@/lib/integrations/gmail";

export async function POST() {
  try {
    const result = await syncGmail();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail sync failed";
    console.error("Gmail sync error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
