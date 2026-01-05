/**
 * Instagram API type definitions
 */

// Instagram Graph API comment structure
export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  from: {
    id: string;
    username: string;
  };
  media?: {
    id: string;
  };
}

// Instagram media (post) structure
export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

// Webhook event structure from Meta
export interface WebhookEntry {
  id: string; // Instagram account ID
  time: number;
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: string; // "comments"
  value: {
    id: string; // Comment ID
    text: string;
    from: {
      id: string;
      username: string;
    };
    media: {
      id: string;
    };
  };
}

export interface WebhookPayload {
  object: string; // "instagram"
  entry: WebhookEntry[];
}

// Credentials for API calls
export interface InstagramCredentialsForApi {
  appId: string;
  appSecret: string;
  accessToken: string;
  tokenExpiresAt: Date | null;
  instagramAccountId: string;
  facebookPageId: string | null;
}

// Token refresh result
export interface InstagramTokenResult {
  accessToken: string;
  expiresAt: Date;
}

// API response types
export interface ReplyCommentResult {
  commentId: string;
  success: boolean;
}

export interface SendDmResult {
  messageId?: string;
  success: boolean;
  error?: string;
}

// Template variable context
export interface TemplateVariables {
  username?: string;
  keyword?: string;
  comment?: string;
}

// Process comment options (for job queue)
export interface ProcessCommentOptions {
  accountId: string;
  automationId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterUsername: string;
  mediaId: string;
}

// Send DM options (for job queue)
export interface SendDmOptions {
  accountId: string;
  interactionId: string;
  recipientId: string;
  message: string;
}
