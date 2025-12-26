import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let credentials = await db.youTubeCredentials.findFirst();

    if (!credentials) {
      credentials = await db.youTubeCredentials.create({
        data: {},
      });
    }

    return NextResponse.json({
      id: credentials.id,
      apiKey: credentials.apiKey ? "••••••••" : "",
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret ? "••••••••" : "",
      channelTitle: credentials.channelTitle,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to fetch YouTube credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, clientId, clientSecret } = body;

    let credentials = await db.youTubeCredentials.findFirst();

    const updateData: Record<string, string> = {};

    if (apiKey !== undefined && apiKey !== "••••••••")
      updateData.apiKey = apiKey;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (clientSecret && clientSecret !== "••••••••")
      updateData.clientSecret = clientSecret;

    if (credentials) {
      credentials = await db.youTubeCredentials.update({
        where: { id: credentials.id },
        data: updateData,
      });
    } else {
      credentials = await db.youTubeCredentials.create({
        data: updateData,
      });
    }

    return NextResponse.json({
      id: credentials.id,
      clientId: credentials.clientId,
      channelTitle: credentials.channelTitle,
      isConnected: !!credentials.accessToken,
    });
  } catch (error) {
    console.error("Failed to save YouTube credentials:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}
