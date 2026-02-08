import { google } from "googleapis";
import { getAuthenticatedClient, SyncResult, saveSyncState } from "./google-auth";
import { getStakeholders, addStakeholder, addActivity, getActivities, updateStakeholder } from "../data";
import { Stakeholder } from "../types";
import { daysSince } from "../data";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: { name: string; email: string; responseStatus: string }[];
  description: string;
  location: string;
}

export interface MeetingGap {
  stakeholder: Stakeholder;
  daysSinceLastMeeting: number | null;
  lastMeetingDate: string | null;
  upcomingMeeting: string | null;
}

function matchStakeholderByEmail(
  email: string,
  name: string,
  stakeholders: Stakeholder[]
): Stakeholder | null {
  const byEmail = stakeholders.find(
    (s) => s.email?.toLowerCase() === email.toLowerCase()
  );
  if (byEmail) return byEmail;

  const lowerName = name.toLowerCase();
  const byName = stakeholders.find((s) => {
    const sName = s.name.toLowerCase();
    return (
      sName === lowerName ||
      sName.includes(lowerName) ||
      lowerName.includes(sName)
    );
  });
  return byName || null;
}

export async function syncCalendar(): Promise<SyncResult> {
  const auth = getAuthenticatedClient();
  if (!auth) {
    throw new Error("Not connected to Google. Please authenticate first.");
  }

  const calendar = google.calendar({ version: "v3", auth });
  const result: SyncResult = {
    newContacts: 0,
    newActivities: 0,
    updatedStakeholders: 0,
    details: [],
  };

  try {
    // Fetch events from last 30 days and next 14 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const twoWeeksAhead = new Date();
    twoWeeksAhead.setDate(twoWeeksAhead.getDate() + 14);

    const eventsList = await calendar.events.list({
      calendarId: "primary",
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: twoWeeksAhead.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsList.data.items || [];
    const stakeholders = getStakeholders("ai-labs");
    const existingActivities = getActivities("ai-labs");
    const calendarEvents: CalendarEvent[] = [];

    for (const event of events) {
      if (!event.start?.dateTime && !event.start?.date) continue;

      const startDate = event.start.dateTime || event.start.date || "";
      const dateStr = startDate.split("T")[0];
      const attendees = (event.attendees || []).map((a) => ({
        name: a.displayName || a.email?.split("@")[0] || "Unknown",
        email: a.email || "",
        responseStatus: a.responseStatus || "needsAction",
      }));

      calendarEvents.push({
        id: event.id || "",
        summary: event.summary || "Untitled",
        start: dateStr,
        end: (event.end?.dateTime || event.end?.date || startDate).split("T")[0],
        attendees,
        description: event.description || "",
        location: event.location || "",
      });
    }

    // Process: auto-populate meeting attendees as stakeholders
    for (const event of calendarEvents) {
      const matchedStakeholderIds: string[] = [];

      for (const attendee of event.attendees) {
        if (!attendee.email || attendee.email.includes("resource.calendar")) continue;

        let match = matchStakeholderByEmail(
          attendee.email,
          attendee.name,
          stakeholders
        );

        if (!match) {
          // Check if from account domain
          const domain = attendee.email.split("@")[1];
          const isAccountDomain =
            domain?.includes("ailab") ||
            domain?.includes("ai-lab") ||
            domain?.includes("example.com");

          if (isAccountDomain) {
            const newStakeholder = addStakeholder("ai-labs", {
              name: attendee.name,
              title: "Unknown",
              team: "Unknown",
              role: "Influencer",
              priority: "P2",
              lastContactDate: event.start,
              relationshipStrength: "Unknown",
              keyPriorities: [],
              notes: `Auto-detected from Google Calendar. First seen in meeting: "${event.summary}"`,
              email: attendee.email,
            });
            stakeholders.push(newStakeholder);
            match = newStakeholder;
            result.newContacts++;
            result.details.push(
              `New attendee detected: ${attendee.name} (${attendee.email}) from "${event.summary}"`
            );
          }
        }

        if (match) {
          matchedStakeholderIds.push(match.id);

          // Update last contact date if this is a past event and more recent
          const isPast = new Date(event.start) <= new Date();
          if (isPast) {
            if (!match.lastContactDate || event.start > match.lastContactDate) {
              updateStakeholder("ai-labs", match.id, { lastContactDate: event.start });
              result.updatedStakeholders++;
            }

            // Update email if missing
            if (!match.email && attendee.email) {
              updateStakeholder("ai-labs", match.id, { email: attendee.email });
            }
          }
        }
      }

      // Log past meetings as activities
      const isPastEvent = new Date(event.start) <= new Date();
      if (isPastEvent && matchedStakeholderIds.length > 0) {
        const existingActivity = existingActivities.find(
          (a) =>
            a.date === event.start &&
            a.type === "Meeting" &&
            matchedStakeholderIds.some((id) => a.stakeholderIds.includes(id))
        );

        if (!existingActivity) {
          const stakeholderNames = matchedStakeholderIds
            .map((id) => stakeholders.find((s) => s.id === id)?.name)
            .filter(Boolean)
            .join(", ");

          addActivity("ai-labs", {
            date: event.start,
            stakeholderIds: matchedStakeholderIds,
            type: "Meeting",
            summary: `[Auto-logged from Calendar] ${event.summary}${stakeholderNames ? ` with ${stakeholderNames}` : ""}${event.location ? ` at ${event.location}` : ""}`,
          });
          result.newActivities++;
          result.details.push(
            `Logged meeting: "${event.summary}" on ${event.start} with ${matchedStakeholderIds.length} stakeholders`
          );
        }
      }
    }

    saveSyncState({
      lastCalendarSync: new Date().toISOString(),
      calendarResults: result,
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    if (errorMsg.includes("invalid_grant") || errorMsg.includes("Token has been")) {
      throw new Error("Google authentication expired. Please reconnect.");
    }
    throw new Error(`Calendar sync failed: ${errorMsg}`);
  }
}

export function detectMeetingGaps(): MeetingGap[] {
  const stakeholders = getStakeholders("ai-labs");
  const activities = getActivities("ai-labs");

  return stakeholders
    .filter((s) => s.priority === "P0" || s.priority === "P1")
    .map((s) => {
      const meetings = activities
        .filter(
          (a) => a.stakeholderIds.includes(s.id) && a.type === "Meeting"
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      const lastMeeting = meetings[0];
      const lastMeetingDate = lastMeeting?.date || null;
      const daysSinceLastMeeting = lastMeetingDate
        ? daysSince(lastMeetingDate)
        : null;

      return {
        stakeholder: s,
        daysSinceLastMeeting,
        lastMeetingDate,
        upcomingMeeting: null, // Would need future calendar events
      };
    })
    .filter(
      (g) =>
        g.daysSinceLastMeeting === null || g.daysSinceLastMeeting > 14
    )
    .sort((a, b) => {
      if (a.daysSinceLastMeeting === null) return -1;
      if (b.daysSinceLastMeeting === null) return 1;
      return b.daysSinceLastMeeting - a.daysSinceLastMeeting;
    });
}
