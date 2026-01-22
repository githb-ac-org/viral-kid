import { Queue, type JobsOptions } from "bullmq";
import { createRedisClient } from "../redis";
import {
  JobNames,
  type JobName,
  type FetchTwitterTrendsData,
  type FetchYouTubeTrendsData,
  type RunRedditAutomationData,
  type AnalyzeViralContentData,
  type CleanupOldDataData,
  type InstagramProcessCommentData,
  type InstagramSendDmData,
} from "./types";

const QUEUE_NAME = "viral-kid-jobs";

// Singleton queue instance
let queue: Queue | null = null;

export function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      },
    });
  }
  return queue;
}

// Helper to add jobs with proper typing
export async function addJob<T>(
  name: JobName,
  data: T,
  options?: JobsOptions
): Promise<string> {
  const q = getQueue();
  const job = await q.add(name, data, options);
  return job.id ?? "";
}

// Convenience methods for each job type
export async function scheduleFetchTwitterTrends(
  data: FetchTwitterTrendsData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.FETCH_TWITTER_TRENDS, data, options);
}

export async function scheduleFetchYouTubeTrends(
  data: FetchYouTubeTrendsData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.FETCH_YOUTUBE_TRENDS, data, options);
}

export async function scheduleAnalyzeViralContent(
  data: AnalyzeViralContentData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.ANALYZE_VIRAL_CONTENT, data, options);
}

export async function scheduleCleanupOldData(
  data: CleanupOldDataData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.CLEANUP_OLD_DATA, data, options);
}

export async function scheduleRunRedditAutomation(
  data: RunRedditAutomationData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.RUN_REDDIT_AUTOMATION, data, options);
}

export async function scheduleInstagramProcessComment(
  data: InstagramProcessCommentData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.INSTAGRAM_PROCESS_COMMENT, data, options);
}

export async function scheduleInstagramSendDm(
  data: InstagramSendDmData,
  options?: JobsOptions
): Promise<string> {
  return addJob(JobNames.INSTAGRAM_SEND_DM, data, options);
}

// Schedule repeatable/cron jobs
export async function setupRecurringJobs(): Promise<void> {
  const q = getQueue();

  // Twitter automation - every hour
  await q.upsertJobScheduler(
    "twitter-automation-hourly",
    { pattern: "0 * * * *" }, // Every hour at minute 0
    {
      name: JobNames.FETCH_TWITTER_TRENDS,
      data: {},
    }
  );

  // YouTube comments automation - every 5 minutes
  await q.upsertJobScheduler(
    "youtube-comments-every-5min",
    { pattern: "*/5 * * * *" }, // Every 5 minutes
    {
      name: JobNames.FETCH_YOUTUBE_TRENDS,
      data: {},
    }
  );

  // Reddit automation - every hour
  await q.upsertJobScheduler(
    "reddit-automation-hourly",
    { pattern: "0 * * * *" }, // Every hour at minute 0
    {
      name: JobNames.RUN_REDDIT_AUTOMATION,
      data: {},
    }
  );

  // Cleanup old data daily at 3 AM UTC
  await q.upsertJobScheduler(
    "cleanup-daily",
    { pattern: "0 3 * * *" }, // Every day at 3 AM
    {
      name: JobNames.CLEANUP_OLD_DATA,
      data: { olderThanDays: 30 },
    }
  );

  console.log("Recurring jobs scheduled:");
  console.log("  - Twitter automation: hourly");
  console.log("  - YouTube comments: every 5 minutes");
  console.log("  - Reddit automation: hourly");
  console.log("  - Cleanup: daily at 3 AM UTC");
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
