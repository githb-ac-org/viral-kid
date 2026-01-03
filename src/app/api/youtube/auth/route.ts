import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOAuthState } from "@/lib/oauth";

// Google OAuth 2.0 endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// YouTube API scope for posting comments
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

export async function GET(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const accountId = reqUrl.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const credentials = await db.youTubeCredentials.findUnique({
      where: { accountId },
    });

    if (!credentials?.clientId) {
      return NextResponse.json(
        { error: "YouTube OAuth credentials not configured" },
        { status: 400 }
      );
    }

    const callbackUrl = `${reqUrl.origin}/api/youtube/callback`;

    // Generate state for CSRF protection
    const state = generateOAuthState();

    // Build the authorization URL
    const authParams = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: YOUTUBE_SCOPE,
      access_type: "offline", // Request refresh token
      prompt: "consent", // Force consent to get refresh token
      state: state,
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${authParams.toString()}`;

    // Return the auth URL and store state in cookies
    const response = NextResponse.json({ authUrl });

    response.cookies.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Store accountId in cookie so callback knows which account to update
    response.cookies.set("youtube_account_id", accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("YouTube OAuth init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize OAuth" },
      { status: 500 }
    );
  }
}
