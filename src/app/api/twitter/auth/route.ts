import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/utils";

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

    const credentials = await db.twitterCredentials.findUnique({
      where: { accountId },
    });

    if (!credentials?.clientId || !credentials?.clientSecret) {
      return NextResponse.json(
        { error: "Twitter credentials not configured" },
        { status: 400 }
      );
    }

    const callbackUrl = `${getBaseUrl(request)}/api/twitter/callback`;

    const client = new TwitterApi({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackUrl,
      {
        scope: [
          "tweet.read",
          "tweet.write",
          "users.read",
          "follows.read",
          "follows.write",
          "media.write",
          "offline.access",
        ],
      }
    );

    // Return the auth URL and store verifier in cookies
    const response = NextResponse.json({ authUrl: url });

    // Set the code verifier in a secure cookie
    response.cookies.set("twitter_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set("twitter_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Store accountId in cookie so callback knows which account to update
    response.cookies.set("twitter_account_id", accountId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to initiate Twitter OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
