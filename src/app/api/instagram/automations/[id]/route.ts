import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateTemplates, serializeTemplates } from "@/lib/instagram";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/instagram/automations/[id]
 * Get a single automation
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const automation = await db.instagramAutomation.findUnique({
    where: { id },
    include: {
      account: { select: { userId: true } },
      _count: { select: { interactions: true } },
    },
  });

  if (!automation) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  // Verify ownership
  if (automation.account.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(automation);
}

/**
 * PUT /api/instagram/automations/[id]
 * Update an automation
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch automation and verify ownership
  const automation = await db.instagramAutomation.findUnique({
    where: { id },
    include: { account: { select: { userId: true } } },
  });

  if (!automation) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  if (automation.account.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    keywords,
    commentTemplates,
    dmTemplates,
    dmDelay,
    enabled,
    postUrl,
    postCaption,
  } = body;

  // Build update data
  const updateData: {
    keywords?: string;
    commentTemplates?: string;
    dmTemplates?: string;
    dmDelay?: number;
    enabled?: boolean;
    postUrl?: string;
    postCaption?: string;
  } = {};

  if (typeof keywords === "string") {
    updateData.keywords = keywords;
  }

  if (commentTemplates !== undefined) {
    if (!validateTemplates(commentTemplates)) {
      return NextResponse.json(
        { error: "Invalid comment templates format" },
        { status: 400 }
      );
    }
    updateData.commentTemplates = serializeTemplates(commentTemplates);
  }

  if (dmTemplates !== undefined) {
    if (!validateTemplates(dmTemplates)) {
      return NextResponse.json(
        { error: "Invalid DM templates format" },
        { status: 400 }
      );
    }
    updateData.dmTemplates = serializeTemplates(dmTemplates);
  }

  if (typeof dmDelay === "number") {
    updateData.dmDelay = Math.max(0, dmDelay);
  }

  if (typeof enabled === "boolean") {
    updateData.enabled = enabled;
  }

  if (typeof postUrl === "string") {
    updateData.postUrl = postUrl;
  }

  if (typeof postCaption === "string") {
    updateData.postCaption = postCaption;
  }

  const updated = await db.instagramAutomation.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/instagram/automations/[id]
 * Delete an automation
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch automation and verify ownership
  const automation = await db.instagramAutomation.findUnique({
    where: { id },
    include: { account: { select: { userId: true } } },
  });

  if (!automation) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  if (automation.account.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete automation (interactions will cascade delete)
  await db.instagramAutomation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
