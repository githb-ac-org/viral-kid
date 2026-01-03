import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOAuthState } from "@/lib/oauth";

// Facebook OAuth 2.0 endpoint (Instagram uses Facebook Login)
const FACEBOOK_AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth";

// Required scopes for Instagram API (comments and messaging)
const INSTAGRAM_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "business_management",
].join(",");

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

    const credentials = await db.instagramCredentials.findUnique({
      where: { accountId },
    });

    if (!credentials?.appId) {
      return NextResponse.json(
        { error: "Meta App credentials not configured" },
        { status: 400 }
      );
    }

    const callbackUrl = `${reqUrl.origin}/api/instagram/callback`;

    // Generate state for CSRF protection
    const state = generateOAuthState();

    // Build the authorization URL
    const authParams = new URLSearchParams({
      client_id: credentials.appId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: INSTAGRAM_SCOPES,
      state: state,
    });

    const authUrl = `${FACEBOOK_AUTH_URL}?${authParams.toString()}`;

    // Return the auth URL and store state in cookies
    const response = NextResponse.json({ authUrl });

    response.cookies.set("instagram_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Store accountId in cookie so callback knows which account to update
    response.cookies.set("instagram_account_id", accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Instagram OAuth init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize OAuth" },
      { status: 500 }
    );
  }
}
