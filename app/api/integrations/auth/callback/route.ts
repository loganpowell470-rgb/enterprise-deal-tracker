import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/integrations/google-auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/integrations?error=auth_denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/integrations?error=no_code", request.url)
    );
  }

  try {
    await handleCallback(code);
    return NextResponse.redirect(
      new URL("/integrations?success=connected", request.url)
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", request.url)
    );
  }
}
