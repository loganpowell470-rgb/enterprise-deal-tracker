import { google } from "googleapis";
import { getAuthenticatedClient, SyncResult, saveSyncState } from "./google-auth";
import { getStakeholders, addStakeholder, addActivity, getActivities, updateStakeholder } from "../data";
import { Stakeholder } from "../types";

interface EmailThread {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string[];
  date: string;
  snippet: string;
  bodyPreview: string;
  hasCalendarInvite: boolean;
}

function extractNameFromEmail(emailStr: string): { name: string; email: string } {
  // Formats: "John Doe <john@example.com>" or "john@example.com"
  const match = emailStr.match(/^"?([^"<]+)"?\s*<?([^>]+@[^>]+)>?$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  }
  const email = emailStr.trim().toLowerCase().replace(/[<>]/g, "");
  const namePart = email.split("@")[0].replace(/[._-]/g, " ");
  const name = namePart
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { name, email };
}

function matchStakeholderByEmail(
  email: string,
  name: string,
  stakeholders: Stakeholder[]
): Stakeholder | null {
  // Match by email field
  const byEmail = stakeholders.find(
    (s) => s.email?.toLowerCase() === email.toLowerCase()
  );
  if (byEmail) return byEmail;

  // Match by name (fuzzy)
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

export async function syncGmail(): Promise<SyncResult> {
  const auth = getAuthenticatedClient();
  if (!auth) {
    throw new Error("Not connected to Google. Please authenticate first.");
  }

  const gmail = google.gmail({ version: "v1", auth });
  const result: SyncResult = {
    newContacts: 0,
    newActivities: 0,
    updatedStakeholders: 0,
    details: [],
  };

  try {
    // Fetch recent email threads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const afterDate = Math.floor(thirtyDaysAgo.getTime() / 1000);

    const threadList = await gmail.users.threads.list({
      userId: "me",
      maxResults: 50,
      q: `after:${afterDate}`,
    });

    const threads = threadList.data.threads || [];
    const stakeholders = getStakeholders("ai-labs");
    const existingActivities = getActivities("ai-labs");
    const processedEmails = new Set<string>();
    const emailThreads: EmailThread[] = [];

    for (const threadRef of threads.slice(0, 30)) {
      try {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: threadRef.id!,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date", "Content-Type"],
        });

        const messages = thread.data.messages || [];
        if (messages.length === 0) continue;

        for (const msg of messages) {
          const headers = msg.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          const from = getHeader("From");
          const to = getHeader("To");
          const subject = getHeader("Subject");
          const date = getHeader("Date");
          const contentType = getHeader("Content-Type");

          const { name: fromName, email: fromEmail } = extractNameFromEmail(from);
          if (processedEmails.has(fromEmail)) continue;

          const hasCalendarInvite =
            contentType.includes("calendar") ||
            subject.toLowerCase().includes("invite") ||
            subject.toLowerCase().includes("accepted:") ||
            subject.toLowerCase().includes("declined:");

          const toEmails = to
            .split(",")
            .map((e) => extractNameFromEmail(e.trim()).email);

          emailThreads.push({
            id: msg.id || "",
            subject,
            from: fromName,
            fromEmail,
            to: toEmails,
            date: new Date(date).toISOString().split("T")[0],
            snippet: msg.snippet || "",
            bodyPreview: msg.snippet || "",
            hasCalendarInvite,
          });

          processedEmails.add(fromEmail);
        }
      } catch {
        // Skip threads that error
        continue;
      }
    }

    // Process: detect new contacts from email threads
    const uniqueContacts = new Map<string, { name: string; email: string; subjects: string[]; lastDate: string }>();
    for (const thread of emailThreads) {
      const key = thread.fromEmail;
      if (!uniqueContacts.has(key)) {
        uniqueContacts.set(key, {
          name: thread.from,
          email: thread.fromEmail,
          subjects: [thread.subject],
          lastDate: thread.date,
        });
      } else {
        const existing = uniqueContacts.get(key)!;
        existing.subjects.push(thread.subject);
        if (thread.date > existing.lastDate) {
          existing.lastDate = thread.date;
        }
      }
    }

    // Match or create stakeholders, update last contact dates
    for (const [, contact] of uniqueContacts) {
      const match = matchStakeholderByEmail(contact.email, contact.name, stakeholders);

      if (match) {
        // Update email if missing and update last contact date if more recent
        let updated = false;
        const updates: Partial<Stakeholder> = {};

        if (!match.email) {
          updates.email = contact.email;
          updated = true;
        }

        if (
          !match.lastContactDate ||
          contact.lastDate > match.lastContactDate
        ) {
          updates.lastContactDate = contact.lastDate;
          updated = true;
        }

        if (updated) {
          updateStakeholder("ai-labs", match.id, updates);
          result.updatedStakeholders++;
          result.details.push(
            `Updated ${match.name}: ${!match.email ? "added email, " : ""}${updates.lastContactDate ? "updated last contact" : ""}`
          );
        }
      } else {
        // New contact - check if from the account domain (ailabs.inc, ailabsinc.com, etc.)
        const domain = contact.email.split("@")[1];
        const isAccountDomain =
          domain.includes("ailab") ||
          domain.includes("ai-lab") ||
          domain.includes("example.com"); // demo mode

        if (isAccountDomain && contact.subjects.length >= 2) {
          // Auto-create as new stakeholder candidate
          const newStakeholder = addStakeholder("ai-labs", {
            name: contact.name,
            title: "Unknown",
            team: "Unknown",
            role: "Influencer",
            priority: "P2",
            lastContactDate: contact.lastDate,
            relationshipStrength: "Unknown",
            keyPriorities: [],
            notes: `Auto-detected from Gmail. ${contact.subjects.length} email threads found. Subjects: ${contact.subjects.slice(0, 3).join("; ")}`,
            email: contact.email,
          });
          stakeholders.push(newStakeholder);
          result.newContacts++;
          result.details.push(
            `New contact detected: ${contact.name} (${contact.email})`
          );
        }
      }
    }

    // Process: parse meeting invites to identify stakeholder meetings
    const meetingInvites = emailThreads.filter((t) => t.hasCalendarInvite);
    for (const invite of meetingInvites) {
      const match = matchStakeholderByEmail(
        invite.fromEmail,
        invite.from,
        stakeholders
      );
      if (match) {
        // Check if we already have an activity for this date+stakeholder
        const existingActivity = existingActivities.find(
          (a) =>
            a.date === invite.date &&
            a.stakeholderIds.includes(match.id) &&
            a.type === "Meeting"
        );
        if (!existingActivity) {
          addActivity("ai-labs", {
            date: invite.date,
            stakeholderIds: [match.id],
            type: "Meeting",
            summary: `[Auto-logged from Gmail] Meeting invite: ${invite.subject}`,
          });
          result.newActivities++;
          result.details.push(
            `Logged meeting from invite: "${invite.subject}" with ${match.name}`
          );
        }
      }
    }

    // Process: auto-log email interactions
    for (const thread of emailThreads) {
      const match = matchStakeholderByEmail(
        thread.fromEmail,
        thread.from,
        stakeholders
      );
      if (match && !thread.hasCalendarInvite) {
        const existingActivity = existingActivities.find(
          (a) =>
            a.date === thread.date &&
            a.stakeholderIds.includes(match.id) &&
            a.type === "Email"
        );
        if (!existingActivity) {
          addActivity("ai-labs", {
            date: thread.date,
            stakeholderIds: [match.id],
            type: "Email",
            summary: `[Auto-logged from Gmail] Subject: ${thread.subject}. ${thread.snippet.substring(0, 150)}`,
          });
          result.newActivities++;
          result.details.push(
            `Logged email: "${thread.subject}" with ${match.name}`
          );
        }
      }
    }

    saveSyncState({
      lastGmailSync: new Date().toISOString(),
      gmailResults: result,
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    if (errorMsg.includes("invalid_grant") || errorMsg.includes("Token has been")) {
      throw new Error("Google authentication expired. Please reconnect.");
    }
    throw new Error(`Gmail sync failed: ${errorMsg}`);
  }
}
