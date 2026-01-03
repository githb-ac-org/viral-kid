import { db } from "@/lib/db";

export type LogLevel = "info" | "warning" | "error" | "success";

/**
 * Create a log entry for an account.
 */
export async function createAccountLog(
  accountId: string,
  level: LogLevel,
  message: string
): Promise<void> {
  await db.log.create({
    data: { accountId, level, message },
  });
}
