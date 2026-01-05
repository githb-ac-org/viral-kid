/**
 * Instagram webhook utilities for signature verification and payload parsing
 */

import crypto from "crypto";
import type { WebhookPayload, WebhookChange } from "./types";

/**
 * Verify the X-Hub-Signature-256 header from Meta webhooks
 *
 * @param payload - Raw request body as string
 * @param signature - Value of X-Hub-Signature-256 header
 * @param appSecret - Instagram app secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  const expectedHeader = `sha256=${expectedSignature}`;

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHeader)
    );
  } catch {
    // Buffers have different lengths
    return false;
  }
}

/**
 * Parse and validate webhook payload from Meta
 *
 * @param body - Parsed JSON body from webhook request
 * @returns Validated WebhookPayload or null if invalid
 */
export function parseWebhookPayload(body: unknown): WebhookPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Record<string, unknown>;

  // Validate required fields
  if (payload.object !== "instagram") {
    return null;
  }

  if (!Array.isArray(payload.entry)) {
    return null;
  }

  return payload as unknown as WebhookPayload;
}

/**
 * Extract comment events from webhook payload
 *
 * @param payload - Validated webhook payload
 * @returns Array of comment changes with their account IDs
 */
export function extractCommentEvents(
  payload: WebhookPayload
): Array<{ accountId: string; change: WebhookChange }> {
  const events: Array<{ accountId: string; change: WebhookChange }> = [];

  for (const entry of payload.entry) {
    const accountId = entry.id;

    for (const change of entry.changes) {
      // Only process comment field changes
      if (change.field === "comments") {
        // Validate the change has required fields
        if (
          change.value &&
          change.value.id &&
          change.value.text &&
          change.value.from?.id &&
          change.value.from?.username &&
          change.value.media?.id
        ) {
          events.push({ accountId, change });
        }
      }
    }
  }

  return events;
}
