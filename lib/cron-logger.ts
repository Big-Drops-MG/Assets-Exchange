import { sendAlert } from "@/lib/alerts";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { backgroundJobs } from "@/lib/schema";

export async function logCronFailure(cronName: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  try {
    await db.insert(backgroundJobs).values({
      type: `cron_${cronName}`,
      status: "failed",
      payload: { source: "cron_api_failure", cronName },
      error: errorMessage,
      errorType: "system",
      startedAt: new Date(),
      finishedAt: new Date(),
      lastErrorAt: new Date(),
      deadLetteredAt: new Date(),
      result: { stack: errorStack },
    });

    await sendAlert(
      `🚨 **CRON FAILURE**: \`${cronName}\` API endpoint crashed.\n**Error**: ${errorMessage}`
    );

    logger.error({
      action: "cron_api_failure",
      cronName,
      error: errorMessage,
      stack: errorStack,
    });
  } catch (insertError) {
    logger.error({
      action: "cron_failure_logging_error",
      message: "Failed to log cron failure to database",
      error:
        insertError instanceof Error
          ? insertError.message
          : String(insertError),
      originalError: errorMessage,
    });
  }
}
