import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await db.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const credentials = await db.instagramCredentials.findUnique({
      where: { accountId },
    });

    if (!credentials) {
      return NextResponse.json(
        { error: "Credentials not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: credentials.id,
      appId: credentials.appId,
      appSecret: credentials.appSecret ? "••••••••" : "",
      instagramUsername: credentials.instagramUsername,
      facebookPageName: credentials.facebookPageName,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to fetch Instagram credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await db.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const body = await request.json();
    const { appId, appSecret } = body;

    const updateData: Record<string, string> = {};

    if (appId !== undefined) updateData.appId = appId;
    if (appSecret && appSecret !== "••••••••") updateData.appSecret = appSecret;

    const credentials = await db.instagramCredentials.update({
      where: { accountId },
      data: updateData,
    });

    return NextResponse.json({
      id: credentials.id,
      appId: credentials.appId,
      instagramUsername: credentials.instagramUsername,
      facebookPageName: credentials.facebookPageName,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to save Instagram credentials:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
