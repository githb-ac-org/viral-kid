import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Google OAuth 2.0 endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// YouTube API scope for posting comments
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export async function GET(request: Request) {
  try {
    const credentials = await db.youTubeCredentials.findFirst();

    if (!credentials?.clientId) {
      return NextResponse.json(
        { error: "YouTube OAuth credentials not configured" },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const callbackUrl = `${url.origin}/api/youtube/callback`;

    // Generate state for CSRF protection
    const state = generateState();

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

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set("youtube_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("YouTube OAuth init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize OAuth" },
      { status: 500 }
    );
  }
}
