#!/bin/sh
set -e

echo "MODE is: $MODE"

if [ "$MODE" = "worker" ]; then
  echo "Starting BullMQ worker..."
  exec npx tsx src/lib/jobs/worker.ts
else
  echo "Starting Next.js app..."
  exec npm run start
fi
