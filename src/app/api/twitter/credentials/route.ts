import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let credentials = await db.twitterCredentials.findFirst();

    if (!credentials) {
      credentials = await db.twitterCredentials.create({
        data: {},
      });
    }

    return NextResponse.json({
      id: credentials.id,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret ? "••••••••" : "",
      rapidApiKey: credentials.rapidApiKey ? "••••••••" : "",
      username: credentials.username,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to fetch Twitter credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, rapidApiKey } = body;

    let credentials = await db.twitterCredentials.findFirst();

    const updateData: Record<string, string> = {};

    if (clientId !== undefined) updateData.clientId = clientId;
    if (clientSecret && clientSecret !== "••••••••")
      updateData.clientSecret = clientSecret;
    if (rapidApiKey && rapidApiKey !== "••••••••")
      updateData.rapidApiKey = rapidApiKey;

    if (credentials) {
      credentials = await db.twitterCredentials.update({
        where: { id: credentials.id },
        data: updateData,
      });
    } else {
      credentials = await db.twitterCredentials.create({
        data: updateData,
      });
    }

    return NextResponse.json({
      id: credentials.id,
      clientId: credentials.clientId,
      username: credentials.username,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to save Twitter credentials:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
