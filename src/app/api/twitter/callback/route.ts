import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Twitter OAuth error:", error);
      return NextResponse.redirect(new URL("/?error=oauth_denied", url.origin));
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/?error=missing_params", url.origin)
      );
    }

    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;
    const storedState = cookieStore.get("twitter_oauth_state")?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL("/?error=missing_verifier", url.origin)
      );
    }

    if (state !== storedState) {
      return NextResponse.redirect(
        new URL("/?error=state_mismatch", url.origin)
      );
    }

    const credentials = await db.twitterCredentials.findFirst();

    if (!credentials?.clientId || !credentials?.clientSecret) {
      return NextResponse.redirect(
        new URL("/?error=no_credentials", url.origin)
      );
    }

    const client = new TwitterApi({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });

    const callbackUrl = `${url.origin}/api/twitter/callback`;

    const {
      accessToken,
      refreshToken,
      expiresIn,
      client: loggedClient,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl,
    });

    // Get the user info
    const { data: user } = await loggedClient.v2.me();

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Save tokens and user info
    await db.twitterCredentials.update({
      where: { id: credentials.id },
      data: {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        userId: user.id,
        username: user.username,
      },
    });

    // Clear the OAuth cookies
    const response = NextResponse.redirect(
      new URL("/?success=twitter_connected", url.origin)
    );

    response.cookies.delete("twitter_code_verifier");
    response.cookies.delete("twitter_oauth_state");

    return response;
  } catch (error) {
    console.error("Twitter OAuth callback error:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/?error=oauth_failed", url.origin));
  }
}
