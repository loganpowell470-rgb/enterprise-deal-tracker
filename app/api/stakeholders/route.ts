import { NextRequest, NextResponse } from "next/server";
import { getStakeholders, addStakeholder } from "@/lib/data";

export async function GET() {
  const stakeholders = getStakeholders();
  return NextResponse.json(stakeholders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const stakeholder = addStakeholder(body);
  return NextResponse.json(stakeholder, { status: 201 });
}
