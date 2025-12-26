import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function GET() {
  try {
    const credentials = await db.twitterCredentials.findFirst();

    if (!credentials?.clientId || !credentials?.clientSecret) {
      return NextResponse.json(
        { error: "Twitter credentials not configured" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const callbackUrl = `${protocol}://${host}/api/twitter/callback`;

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
          "offline.access",
        ],
      }
    );

    // Store the code verifier and state in the credentials record
    await db.twitterCredentials.update({
      where: { id: credentials.id },
      data: {
        // Store temporarily in unused fields or create a separate table
        // For simplicity, we'll use a cookie approach in the callback
      },
    });

    // Return the auth URL and store verifier in a cookie
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

    return response;
  } catch (error) {
    console.error("Failed to initiate Twitter OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
