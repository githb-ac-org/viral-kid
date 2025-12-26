import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get the first (and should be only) configuration, or create default
    let config = await db.twitterConfiguration.findFirst();

    if (!config) {
      config = await db.twitterConfiguration.create({
        data: {
          searchTerm: "",
          schedule: "every_hour",
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      searchTerm: config.searchTerm,
      schedule: config.schedule,
    });
  } catch (error) {
    console.error("Failed to fetch Twitter configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchTerm, schedule } = body;

    // Validate schedule value
    const validSchedules = [
      "every_5_min",
      "every_10_min",
      "every_30_min",
      "every_hour",
      "every_3_hours",
      "every_6_hours",
    ];

    if (schedule && !validSchedules.includes(schedule)) {
      return NextResponse.json(
        { error: "Invalid schedule value" },
        { status: 400 }
      );
    }

    // Get existing config or create new one
    let config = await db.twitterConfiguration.findFirst();

    if (config) {
      config = await db.twitterConfiguration.update({
        where: { id: config.id },
        data: {
          ...(searchTerm !== undefined && { searchTerm }),
          ...(schedule && { schedule }),
        },
      });
    } else {
      config = await db.twitterConfiguration.create({
        data: {
          searchTerm: searchTerm ?? "",
          schedule: schedule ?? "every_hour",
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      searchTerm: config.searchTerm,
      schedule: config.schedule,
    });
  } catch (error) {
    console.error("Failed to save Twitter configuration:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
