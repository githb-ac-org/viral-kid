import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface AccountWithCredentials {
  id: string;
  platform: string;
  name: string;
  order: number;
  twitterCredentials: {
    username: string | null;
    accessToken: string | null;
  } | null;
  youtubeCredentials: {
    channelTitle: string | null;
    accessToken: string | null;
  } | null;
  instagramCredentials: {
    instagramUsername: string | null;
    accessToken: string | null;
  } | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db.account.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
      include: {
        twitterCredentials: {
          select: {
            username: true,
            accessToken: true,
          },
        },
        youtubeCredentials: {
          select: {
            channelTitle: true,
            accessToken: true,
          },
        },
        instagramCredentials: {
          select: {
            instagramUsername: true,
            accessToken: true,
          },
        },
      },
    });

    // Transform to a simpler format for the frontend
    const formattedAccounts = accounts.map(
      (account: AccountWithCredentials) => {
        let isConnected = false;
        let displayName: string | null = null;

        if (account.platform === "twitter") {
          isConnected = !!account.twitterCredentials?.accessToken;
          displayName = account.twitterCredentials?.username
            ? `@${account.twitterCredentials.username}`
            : null;
        } else if (account.platform === "youtube") {
          isConnected = !!account.youtubeCredentials?.accessToken;
          displayName = account.youtubeCredentials?.channelTitle || null;
        } else if (account.platform === "instagram") {
          isConnected = !!account.instagramCredentials?.accessToken;
          displayName = account.instagramCredentials?.instagramUsername
            ? `@${account.instagramCredentials.instagramUsername}`
            : null;
        }

        return {
          id: account.id,
          platform: account.platform,
          name: account.name,
          order: account.order,
          isConnected,
          displayName,
        };
      }
    );

    return NextResponse.json(formattedAccounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
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

    const body = await request.json();
    const { platform } = body;

    if (!platform || !["twitter", "youtube", "instagram"].includes(platform)) {
      return NextResponse.json(
        {
          error:
            "Invalid platform. Must be 'twitter', 'youtube', or 'instagram'",
        },
        { status: 400 }
      );
    }

    // Get the highest order value for this user
    const lastAccount = await db.account.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: "desc" },
    });
    const newOrder = (lastAccount?.order ?? -1) + 1;

    // Create the account with its related credentials and config
    const platformData =
      platform === "twitter"
        ? {
            twitterCredentials: { create: {} },
            twitterConfig: { create: {} },
          }
        : platform === "youtube"
          ? {
              youtubeCredentials: { create: {} },
              youtubeConfig: { create: {} },
            }
          : {
              instagramCredentials: { create: {} },
              instagramConfig: { create: {} },
            };

    const account = await db.account.create({
      data: {
        platform,
        order: newOrder,
        userId: session.user.id,
        ...platformData,
      },
      include: {
        twitterCredentials: true,
        twitterConfig: true,
        youtubeCredentials: true,
        youtubeConfig: true,
        instagramCredentials: true,
        instagramConfig: true,
      },
    });

    return NextResponse.json({
      id: account.id,
      platform: account.platform,
      name: account.name,
      order: account.order,
      isConnected: false,
      displayName: null,
    });
  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
