import { NextResponse } from "next/server";
import { isConnected, getConnectedEmail, getSyncState } from "@/lib/integrations/google-auth";
import { detectMeetingGaps } from "@/lib/integrations/calendar";

export async function GET() {
  try {
    const connected = isConnected();
    let email: string | null = null;
    let meetingGaps: ReturnType<typeof detectMeetingGaps> = [];

    if (connected) {
      try {
        email = await getConnectedEmail();
      } catch {
        email = null;
      }
      meetingGaps = detectMeetingGaps();
    }

    const syncState = getSyncState();

    return NextResponse.json({
      connected,
      email,
      lastGmailSync: syncState.lastGmailSync,
      lastCalendarSync: syncState.lastCalendarSync,
      gmailResults: syncState.gmailResults,
      calendarResults: syncState.calendarResults,
      meetingGaps,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({
      connected: false,
      email: null,
      lastGmailSync: null,
      lastCalendarSync: null,
      gmailResults: null,
      calendarResults: null,
      meetingGaps: [],
    });
  }
}
