import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Auth
    AUTH_SECRET: z.string().min(1),

    // Redis (for job queues)
    REDIS_URL: z.string().url().optional(),

    // Cron authentication (required in production)
    CRON_SECRET:
      process.env.NODE_ENV === "production"
        ? z
            .string()
            .min(32, "CRON_SECRET must be at least 32 characters in production")
        : z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    AUTH_SECRET: process.env.AUTH_SECRET,

    REDIS_URL: process.env.REDIS_URL,

    CRON_SECRET: process.env.CRON_SECRET,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
