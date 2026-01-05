/**
 * Instagram Graph API client utilities
 */

import type {
  InstagramCredentialsForApi,
  InstagramTokenResult,
  InstagramMedia,
  ReplyCommentResult,
  SendDmResult,
} from "./types";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Refresh Instagram/Facebook access token if expired or about to expire
 * Note: Long-lived tokens from Facebook last ~60 days
 */
export async function refreshTokenIfNeeded(
  credentials: InstagramCredentialsForApi
): Promise<InstagramTokenResult | null> {
  if (!credentials.accessToken) {
    return null;
  }

  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (
    credentials.tokenExpiresAt &&
    credentials.tokenExpiresAt > fiveMinutesFromNow
  ) {
    // Token is still valid
    return {
      accessToken: credentials.accessToken,
      expiresAt: credentials.tokenExpiresAt,
    };
  }

  // Refresh the long-lived token
  // Facebook's token refresh endpoint
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: credentials.appId,
    client_secret: credentials.appSecret,
    fb_exchange_token: credentials.accessToken,
  });

  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Instagram token: ${error}`);
  }

  const data = await response.json();
  // Facebook returns expires_in in seconds
  const expiresAt = new Date(Date.now() + (data.expires_in || 5184000) * 1000);

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Get recent posts/media from Instagram account
 * Used to populate dropdown for automation setup
 */
export async function getRecentPosts(
  accessToken: string,
  instagramAccountId: string,
  limit: number = 25
): Promise<InstagramMedia[]> {
  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Instagram posts: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Reply to an Instagram comment
 *
 * @param accessToken - Page access token
 * @param commentId - The comment ID to reply to
 * @param message - The reply message
 * @returns Result with the new comment ID
 */
export async function replyToComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<ReplyCommentResult> {
  const response = await fetch(`${GRAPH_API_BASE}/${commentId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reply to comment: ${error}`);
  }

  const data = await response.json();
  return {
    commentId: data.id,
    success: true,
  };
}

/**
 * Send a direct message to an Instagram user
 * Note: This uses the Instagram Messaging API, which requires:
 * - The user to have interacted with your content (commented, DM'd) within 7 days
 * - instagram_manage_messages permission
 *
 * @param accessToken - Page access token
 * @param instagramAccountId - Your Instagram Business account ID (sender)
 * @param recipientId - Instagram user ID to send DM to (IGSID)
 * @param message - The message content
 */
export async function sendDirectMessage(
  accessToken: string,
  instagramAccountId: string,
  recipientId: string,
  message: string
): Promise<SendDmResult> {
  // Instagram Messaging API endpoint
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId,
        },
        message: {
          text: message,
        },
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;

    // Try to parse error for better messaging
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorText;

      // Check for common DM errors
      if (errorData.error?.code === 10) {
        return {
          success: false,
          error: "User has not interacted within the 7-day messaging window",
        };
      }
      if (errorData.error?.code === 551) {
        return {
          success: false,
          error: "This user cannot receive messages from this account",
        };
      }
    } catch {
      // Keep original error text
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  const data = await response.json();
  return {
    messageId: data.message_id,
    success: true,
  };
}

/**
 * Subscribe Instagram account to webhooks
 * This should be called once during setup
 *
 * @param accessToken - Page access token
 * @param instagramAccountId - Your Instagram Business account ID
 */
export async function subscribeToWebhook(
  accessToken: string,
  instagramAccountId: string
): Promise<boolean> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramAccountId}/subscribed_apps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscribed_fields: ["comments"],
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to subscribe to webhook: ${error}`);
  }

  const data = await response.json();
  return data.success === true;
}

/**
 * Get comment details by ID
 */
export async function getComment(
  accessToken: string,
  commentId: string
): Promise<{
  id: string;
  text: string;
  from: { id: string; username: string };
} | null> {
  const fields = "id,text,from";

  const response = await fetch(
    `${GRAPH_API_BASE}/${commentId}?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}
