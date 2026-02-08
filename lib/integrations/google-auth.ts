import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "data", "google-tokens.json");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getEnvVar(name: string): string {
  const val = process.env[name];
  if (val && val.length > 0) return val;
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${name}=(.+)$`, "m"));
    if (match) return match[1].trim();
  } catch {
    // ignore
  }
  return "";
}

export function getOAuth2Client() {
  const clientId = getEnvVar("GOOGLE_CLIENT_ID");
  const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
  const redirectUri = getEnvVar("GOOGLE_REDIRECT_URI") || "http://localhost:3000/api/integrations/auth/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function handleCallback(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  saveTokens(tokens as Record<string, unknown>);
  return tokens;
}

export function saveTokens(tokens: Record<string, unknown>) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export function loadTokens(): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(TOKEN_PATH)) return null;
    const data = fs.readFileSync(TOKEN_PATH, "utf-8");
    const tokens = JSON.parse(data);
    if (!tokens.access_token) return null;
    return tokens;
  } catch {
    return null;
  }
}

export function clearTokens() {
  try {
    if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
  } catch {
    // ignore
  }
}

export function getAuthenticatedClient() {
  const tokens = loadTokens();
  if (!tokens) return null;
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export function isConnected(): boolean {
  return loadTokens() !== null;
}

export interface IntegrationStatus {
  google: {
    connected: boolean;
    email: string | null;
    lastGmailSync: string | null;
    lastCalendarSync: string | null;
  };
}

const SYNC_STATE_PATH = path.join(process.cwd(), "data", "sync-state.json");

export function getSyncState(): {
  lastGmailSync: string | null;
  lastCalendarSync: string | null;
  gmailResults: SyncResult | null;
  calendarResults: SyncResult | null;
} {
  try {
    if (!fs.existsSync(SYNC_STATE_PATH)) {
      return { lastGmailSync: null, lastCalendarSync: null, gmailResults: null, calendarResults: null };
    }
    return JSON.parse(fs.readFileSync(SYNC_STATE_PATH, "utf-8"));
  } catch {
    return { lastGmailSync: null, lastCalendarSync: null, gmailResults: null, calendarResults: null };
  }
}

export interface SyncResult {
  newContacts: number;
  newActivities: number;
  updatedStakeholders: number;
  details: string[];
}

export function saveSyncState(updates: Record<string, unknown>) {
  const current = getSyncState();
  const merged = { ...current, ...updates };
  fs.writeFileSync(SYNC_STATE_PATH, JSON.stringify(merged, null, 2));
}

export async function getConnectedEmail(): Promise<string | null> {
  const client = getAuthenticatedClient();
  if (!client) return null;
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const res = await oauth2.userinfo.get();
    return res.data.email || null;
  } catch {
    return null;
  }
}
