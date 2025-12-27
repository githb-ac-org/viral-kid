import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface OpenRouterModelResponse {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface OpenRouterAPIResponse {
  data: OpenRouterModelResponse[];
}

// GET - Fetch models from database
export async function GET() {
  try {
    const models = await db.openRouterModel.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Failed to fetch OpenRouter models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

// POST - Sync models from OpenRouter API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    // Fetch models from OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch models from OpenRouter" },
        { status: response.status }
      );
    }

    const data: OpenRouterAPIResponse = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return NextResponse.json(
        { error: "Invalid response from OpenRouter" },
        { status: 500 }
      );
    }

    // Upsert all models
    let syncedCount = 0;
    for (const model of data.data) {
      try {
        await db.openRouterModel.upsert({
          where: { id: model.id },
          update: {
            name: model.name || model.id,
            description: model.description || null,
            contextLength: model.context_length || 0,
            pricing: model.pricing ? JSON.stringify(model.pricing) : null,
          },
          create: {
            id: model.id,
            name: model.name || model.id,
            description: model.description || null,
            contextLength: model.context_length || 0,
            pricing: model.pricing ? JSON.stringify(model.pricing) : null,
          },
        });
        syncedCount++;
      } catch (dbError) {
        console.error(`Failed to sync model ${model.id}:`, dbError);
      }
    }

    // Fetch updated models from database
    const models = await db.openRouterModel.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      total: data.data.length,
      models,
    });
  } catch (error) {
    console.error("Failed to sync OpenRouter models:", error);
    return NextResponse.json(
      { error: "Failed to sync models" },
      { status: 500 }
    );
  }
}
