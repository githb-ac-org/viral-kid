/**
 * Instagram library - public exports
 */

// Types
export type {
  InstagramComment,
  InstagramMedia,
  WebhookEntry,
  WebhookChange,
  WebhookPayload,
  InstagramCredentialsForApi,
  InstagramTokenResult,
  ReplyCommentResult,
  SendDmResult,
  TemplateVariables,
  ProcessCommentOptions,
  SendDmOptions,
} from "./types";

// Client functions
export {
  refreshTokenIfNeeded,
  getRecentPosts,
  replyToComment,
  sendDirectMessage,
  subscribeToWebhook,
  getComment,
} from "./client";

// Webhook utilities
export {
  verifyWebhookSignature,
  parseWebhookPayload,
  extractCommentEvents,
} from "./webhook";

// Template utilities
export {
  parseTemplates,
  serializeTemplates,
  selectTemplate,
  interpolateTemplate,
  matchKeyword,
  validateTemplates,
} from "./templates";
