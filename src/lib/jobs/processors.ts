import type { Job } from "bullmq";
import {
  JobNames,
  type FetchTwitterTrendsData,
  type FetchYouTubeTrendsData,
  type AnalyzeViralContentData,
  type CleanupOldDataData,
  type InstagramProcessCommentData,
  type InstagramSendDmData,
  type JobResult,
} from "./types";
import { db } from "@/lib/db";
import {
  replyToComment,
  sendDirectMessage,
  parseTemplates,
  selectTemplate,
  interpolateTemplate,
} from "@/lib/instagram";
import { scheduleInstagramSendDm } from "./queues";

// Job processor functions - implement your actual logic here

async function processFetchTwitterTrends(
  data: FetchTwitterTrendsData
): Promise<JobResult> {
  // TODO: Implement actual Twitter trends fetching logic
  // Example: const twitter = getTwitterClient();
  // const trends = await twitter.getTrends(data.region);
  // await db.twitterTrend.createMany({ data: trends });

  return {
    success: true,
    message: `Twitter trends fetched for ${data.region || "global"}`,
  };
}

async function processFetchYouTubeTrends(
  data: FetchYouTubeTrendsData
): Promise<JobResult> {
  // TODO: Implement actual YouTube trends fetching logic
  // Example: const youtube = getYouTubeClient();
  // const trends = await youtube.getTrendingVideos(data);
  // await db.youtubeTrend.createMany({ data: trends });

  return {
    success: true,
    message: `YouTube trends fetched for ${data.region || "global"}`,
  };
}

async function processAnalyzeViralContent(
  data: AnalyzeViralContentData
): Promise<JobResult> {
  // TODO: Implement content analysis logic
  // This could include sentiment analysis, engagement metrics, etc.

  return {
    success: true,
    message: `Content ${data.contentId} analyzed`,
  };
}

async function processCleanupOldData(
  data: CleanupOldDataData
): Promise<JobResult> {
  // TODO: Implement cleanup logic
  // Example:
  // const cutoffDate = new Date();
  // cutoffDate.setDate(cutoffDate.getDate() - data.olderThanDays);
  // await db.twitterTrend.deleteMany({ where: { createdAt: { lt: cutoffDate } } });

  return {
    success: true,
    message: `Cleaned up data older than ${data.olderThanDays} days`,
  };
}

/**
 * Process an Instagram comment - reply and schedule DM
 */
async function processInstagramComment(
  data: InstagramProcessCommentData
): Promise<JobResult> {
  const {
    accountId,
    automationId,
    commentId,
    commentText,
    commenterId,
    commenterUsername,
  } = data;

  // Fetch automation and credentials
  const automation = await db.instagramAutomation.findUnique({
    where: { id: automationId },
    include: {
      account: {
        include: {
          instagramCredentials: true,
        },
      },
    },
  });

  if (!automation || !automation.enabled) {
    return { success: false, message: "Automation not found or disabled" };
  }

  const credentials = automation.account.instagramCredentials;
  if (!credentials?.accessToken || !credentials?.instagramAccountId) {
    return { success: false, message: "Instagram credentials not configured" };
  }

  // Get interaction count for template rotation
  const interactionCount = await db.instagramInteraction.count({
    where: { automationId },
  });

  // Select and interpolate comment template
  const commentTemplates = parseTemplates(automation.commentTemplates);
  if (commentTemplates.length === 0) {
    return { success: false, message: "No comment templates configured" };
  }

  const selectedTemplate = selectTemplate(commentTemplates, interactionCount);
  const replyText = interpolateTemplate(selectedTemplate, {
    username: commenterUsername,
    comment: commentText,
  });

  // Reply to comment
  let replyResult;
  try {
    replyResult = await replyToComment(
      credentials.accessToken,
      commentId,
      replyText
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to reply: ${message}` };
  }

  // Create interaction record
  const interaction = await db.instagramInteraction.create({
    data: {
      accountId,
      automationId,
      commentId,
      commentText,
      commenterId,
      commenterUsername,
      keywordMatched: "", // Could be passed from webhook
      ourReply: replyText,
      ourReplyId: replyResult.commentId,
      repliedAt: new Date(),
    },
  });

  // Schedule DM with delay
  const dmTemplates = parseTemplates(automation.dmTemplates);
  if (dmTemplates.length > 0) {
    const dmTemplate = selectTemplate(dmTemplates, interactionCount);
    const dmMessage = interpolateTemplate(dmTemplate, {
      username: commenterUsername,
      comment: commentText,
    });

    // Schedule DM job with delay (in milliseconds)
    await scheduleInstagramSendDm(
      {
        accountId,
        interactionId: interaction.id,
        recipientId: commenterId,
        message: dmMessage,
      },
      {
        delay: automation.dmDelay * 1000, // Convert seconds to milliseconds
      }
    );
  }

  return {
    success: true,
    message: `Replied to comment from @${commenterUsername}`,
  };
}

/**
 * Send Instagram DM to a user
 */
async function processInstagramSendDm(
  data: InstagramSendDmData
): Promise<JobResult> {
  const { accountId, interactionId, recipientId, message } = data;

  // Fetch credentials
  const credentials = await db.instagramCredentials.findUnique({
    where: { accountId },
  });

  if (!credentials?.accessToken || !credentials?.instagramAccountId) {
    // Update interaction with error
    await db.instagramInteraction.update({
      where: { id: interactionId },
      data: { dmError: "Instagram credentials not configured" },
    });
    return { success: false, message: "Instagram credentials not configured" };
  }

  // Send DM
  const result = await sendDirectMessage(
    credentials.accessToken,
    credentials.instagramAccountId,
    recipientId,
    message
  );

  // Update interaction record
  if (result.success) {
    await db.instagramInteraction.update({
      where: { id: interactionId },
      data: {
        dmSent: true,
        dmContent: message,
        dmSentAt: new Date(),
      },
    });
    return { success: true, message: "DM sent successfully" };
  } else {
    await db.instagramInteraction.update({
      where: { id: interactionId },
      data: {
        dmError: result.error || "Failed to send DM",
      },
    });
    return { success: false, message: result.error || "Failed to send DM" };
  }
}

// Main job processor - routes jobs to appropriate handler
export async function processJob(job: Job): Promise<JobResult> {
  switch (job.name) {
    case JobNames.FETCH_TWITTER_TRENDS:
      return processFetchTwitterTrends(job.data as FetchTwitterTrendsData);

    case JobNames.FETCH_YOUTUBE_TRENDS:
      return processFetchYouTubeTrends(job.data as FetchYouTubeTrendsData);

    case JobNames.ANALYZE_VIRAL_CONTENT:
      return processAnalyzeViralContent(job.data as AnalyzeViralContentData);

    case JobNames.CLEANUP_OLD_DATA:
      return processCleanupOldData(job.data as CleanupOldDataData);

    case JobNames.INSTAGRAM_PROCESS_COMMENT:
      return processInstagramComment(job.data as InstagramProcessCommentData);

    case JobNames.INSTAGRAM_SEND_DM:
      return processInstagramSendDm(job.data as InstagramSendDmData);

    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}
