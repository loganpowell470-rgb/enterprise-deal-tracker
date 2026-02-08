import { NextResponse } from "next/server";
import { getAuthUrl, clearTokens } from "@/lib/integrations/google-auth";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Auth URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL. Check Google OAuth credentials." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  clearTokens();
  return NextResponse.json({ success: true });
}
