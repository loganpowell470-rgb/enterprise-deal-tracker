import { NextRequest, NextResponse } from "next/server";
import { getWorkspaces, addWorkspace } from "@/lib/data";
import { Workspace } from "@/lib/types";

export async function GET() {
  const workspaces = getWorkspaces();
  return NextResponse.json(workspaces);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Generate ID from name (slugify)
    const id = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!id) {
      return NextResponse.json(
        { error: "Invalid company name" },
        { status: 400 }
      );
    }

    const workspace: Workspace = {
      id,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      dealContext: body.dealContext?.trim() || "",
      dealSummary: body.dealSummary?.trim() || "",
      renewalInfo: body.renewalInfo?.trim() || "",
      teams: body.teams || [],
      color: body.color || "emerald",
    };

    const created = addWorkspace(workspace);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create workspace";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
