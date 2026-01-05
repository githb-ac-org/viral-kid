import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  extractCommentEvents,
  matchKeyword,
} from "@/lib/instagram";
import { addJob, JobNames } from "@/lib/jobs";
import type { InstagramProcessCommentData } from "@/lib/jobs/types";

/**
 * GET /api/instagram/webhook
 * Webhook verification endpoint for Meta
 * Meta sends a challenge that we must echo back
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Find any account with this verify token
  // Each account has its own unique token for their Meta App
  const credentials = await db.instagramCredentials.findFirst({
    where: { webhookVerifyToken: token },
  });

  if (credentials) {
    // Token matches - return the challenge to verify the webhook
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/instagram/webhook
 * Receive webhook events from Meta (Instagram comments)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || "";

    // Parse the body as JSON
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Parse and validate the webhook payload
    const payload = parseWebhookPayload(body);
    if (!payload) {
      // Not an Instagram webhook or invalid format
      // Return 200 to avoid Meta retrying
      return NextResponse.json({ received: true });
    }

    // Extract comment events
    const commentEvents = extractCommentEvents(payload);

    if (commentEvents.length === 0) {
      return NextResponse.json({ received: true });
    }

    // Process each comment event
    for (const event of commentEvents) {
      const { accountId: instagramAccountId, change } = event;
      const { id: commentId, text, from, media } = change.value;

      // Find the account by Instagram account ID
      const credentials = await db.instagramCredentials.findFirst({
        where: { instagramAccountId },
        include: { account: true },
      });

      if (!credentials) {
        // No matching account found, skip
        continue;
      }

      // Verify webhook signature using account's app secret
      if (credentials.appSecret) {
        const isValid = verifyWebhookSignature(
          rawBody,
          signature,
          credentials.appSecret
        );
        if (!isValid) {
          console.error(
            `Invalid webhook signature for account ${credentials.accountId}`
          );
          continue;
        }
      }

      // Find automation for this post
      const automation = await db.instagramAutomation.findFirst({
        where: {
          accountId: credentials.accountId,
          postId: media.id,
          enabled: true,
        },
      });

      if (!automation) {
        // No automation for this post, skip
        continue;
      }

      // Check if comment matches any keywords
      const matchedKeyword = matchKeyword(text, automation.keywords);
      if (!matchedKeyword) {
        // No keyword match, skip
        continue;
      }

      // Check if we've already processed this comment
      const existingInteraction = await db.instagramInteraction.findUnique({
        where: {
          accountId_commentId: {
            accountId: credentials.accountId,
            commentId,
          },
        },
      });

      if (existingInteraction) {
        // Already processed, skip
        continue;
      }

      // Queue the comment processing job
      const jobData: InstagramProcessCommentData = {
        accountId: credentials.accountId,
        automationId: automation.id,
        commentId,
        commentText: text,
        commenterId: from.id,
        commenterUsername: from.username,
        mediaId: media.id,
      };

      await addJob(JobNames.INSTAGRAM_PROCESS_COMMENT, jobData);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 even on error to prevent Meta from retrying
    // We log the error for debugging
    return NextResponse.json({ received: true });
  }
}
