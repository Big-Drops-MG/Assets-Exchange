import { createHash } from "crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { auditLogs, creatives, idempotencyKeys } from "@/lib/schema";

export const dynamic = "force-dynamic";

const STUCK_THRESHOLD_MINUTES = 15;
const BATCH_SIZE = 1000; // Process records in batches to avoid timeouts
const SELECT_TIMEOUT_MS = 30000; // 30 seconds for SELECT queries
const UPDATE_TIMEOUT_MS = 60000; // 60 seconds for UPDATE queries
const IDEMPOTENCY_WINDOW_HOURS = 24; // Idempotency key expires after 24 hours
const AUDIT_LOG_RETRY_ATTEMPTS = 3;
const AUDIT_LOG_RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

// Helper function to retry audit log insertion with exponential backoff
async function insertAuditLogWithRetry(
  auditData: typeof auditLogs.$inferInsert,
  maxRetries: number = AUDIT_LOG_RETRY_ATTEMPTS
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.insert(auditLogs).values(auditData);
      logger.info({
        action: "creatives.reset_stuck_scanning",
        message: "Audit log entry created successfully",
        attempt,
      });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const delay = AUDIT_LOG_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff

      if (attempt < maxRetries) {
        logger.warn({
          action: "creatives.reset_stuck_scanning",
          error: lastError.message,
          attempt,
          maxRetries,
          retryingIn: `${delay}ms`,
          message: "Audit log insert failed, retrying...",
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error({
          action: "creatives.reset_stuck_scanning",
          error: lastError.message,
          attempts: maxRetries,
          message: "Audit log insert failed after all retries",
        });
        // Don't throw - audit log failure shouldn't break the operation
      }
    }
  }
}

// Helper function to generate idempotency key from request
function generateIdempotencyKey(userId: string, timestamp: string): string {
  const hash = createHash("sha256");
  hash.update(`reset-stuck-scanning:${userId}:${timestamp}`);
  return hash.digest("hex");
}

export async function POST(_req: Request) {
  logger.info("=".repeat(80));
  logger.info("RESET STUCK JOB ENDPOINT HIT");
  logger.info("=".repeat(80));

  const requestStartTime = Date.now();
  let idempotencyKey: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "administrator")
    ) {
      logger.info("❌ UNAUTHORIZED - Admin check failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate idempotency key for request deduplication
    const requestHeaders = await headers();
    const requestTimestamp = new Date().toISOString();
    idempotencyKey = generateIdempotencyKey(session.user.id, requestTimestamp);

    // Check for existing idempotency key (request deduplication)
    const existingRequest = await db.query.idempotencyKeys.findFirst({
      where: eq(idempotencyKeys.id, idempotencyKey),
    });

    if (existingRequest && existingRequest.expiresAt > new Date()) {
      logger.info({
        action: "creatives.reset_stuck_scanning",
        idempotencyKey,
        message: "Duplicate request detected, returning cached response",
      });

      return NextResponse.json(
        existingRequest.responseBody as { reset: number; ids: string[] },
        { status: existingRequest.responseStatus ?? 200 }
      );
    }

    logger.info({
      message: "✅ Admin authenticated",
      userId: session.user.id,
      role: session.user.role,
    });

    logger.info({
      message: "📊 Query Parameters",
      thresholdMinutes: STUCK_THRESHOLD_MINUTES,
      statusFilter: "SCANNING",
      timeCondition: `status_updated_at < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
      note: "Using database-native time logic with parameterized interval multiplication",
    });

    logger.info("🔍 EXECUTING STUCK JOB RESET QUERY (SELECT)");
    logger.info({
      message: "Query Details",
      table: "creatives",
      whereConditions: [
        "status = 'SCANNING'",
        `status_updated_at < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
      ],
      selectFields: ["id", "status", "status_updated_at", "scan_attempts"],
      sqlLogic:
        "Database-native time comparison with parameterized interval (PostgreSQL-safe)",
      timeout: `${SELECT_TIMEOUT_MS}ms`,
    });

    let stuckCreatives;
    try {
      // Add timeout using Promise.race
      const selectPromise = db
        .select({
          id: creatives.id,
          status: creatives.status,
          statusUpdatedAt: creatives.statusUpdatedAt,
          scanAttempts: creatives.scanAttempts,
        })
        .from(creatives)
        .where(
          and(
            eq(creatives.status, "SCANNING"),
            sql`${creatives.statusUpdatedAt} < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`
          )
        );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(`SELECT query timeout after ${SELECT_TIMEOUT_MS}ms`)
          );
        }, SELECT_TIMEOUT_MS);
      });

      stuckCreatives = await Promise.race([selectPromise, timeoutPromise]);
    } catch (selectError) {
      console.error("❌ SELECT QUERY ERROR:", selectError);
      console.error("Error details:", {
        message:
          selectError instanceof Error
            ? selectError.message
            : String(selectError),
        stack: selectError instanceof Error ? selectError.stack : undefined,
      });
      throw selectError;
    }

    logger.info({
      message: "📋 SELECT Query Result",
      rowsFound: stuckCreatives.length,
      creativeIds: stuckCreatives.map((c) => c.id),
      details: stuckCreatives.map((c) => ({
        id: c.id,
        status: c.status,
        statusUpdatedAt: c.statusUpdatedAt?.toISOString(),
        scanAttempts: c.scanAttempts,
      })),
    });

    if (stuckCreatives.length === 0) {
      logger.info("ℹ️  No stuck creatives found - returning early");
      logger.info({
        action: "creatives.reset_stuck_scanning",
        actorId: session.user.id,
        message: "No stuck SCANNING creatives found",
      });

      const ipAddress =
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders.get("x-real-ip") ??
        null;
      const userAgent = requestHeaders.get("user-agent") ?? null;

      // Prepare response for zero results
      const responseBody = {
        reset: 0,
        ids: [],
      };
      const responseStatus = 200;

      // Store idempotency key with response
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_WINDOW_HOURS);

      try {
        await db.insert(idempotencyKeys).values({
          id: idempotencyKey,
          requestHash: idempotencyKey,
          responseBody: responseBody as unknown as Record<string, unknown>,
          responseStatus,
          expiresAt,
        });
      } catch (idempotencyError) {
        logger.warn({
          action: "creatives.reset_stuck_scanning",
          error:
            idempotencyError instanceof Error
              ? idempotencyError.message
              : String(idempotencyError),
          message: "Failed to store idempotency key (non-critical)",
        });
      }

      // Insert audit log with retry mechanism
      await insertAuditLogWithRetry({
        userId: session.user.id,
        action: "RESET_STUCK_SCANNING_ASSETS",
        entityType: "creatives",
        entityId: null,
        details: {
          triggeringUser: {
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.name,
          },
          timestamp: new Date().toISOString(),
          affectedAssetCount: 0,
          affectedAssetIds: [],
          thresholdMinutes: STUCK_THRESHOLD_MINUTES,
          message: "No stuck assets found",
          idempotencyKey,
        },
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });

      return NextResponse.json(responseBody, { status: responseStatus });
    }

    const creativeIds = stuckCreatives.map((c) => c.id);

    logger.info("🔧 EXECUTING STUCK JOB RESET QUERY (UPDATE)");
    logger.info({
      message: "Update Query Details",
      table: "creatives",
      whereConditions: [
        "status = 'SCANNING'",
        `status_updated_at < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
      ],
      updateFields: {
        status: "pending",
        statusUpdatedAt: "now() (database function)",
        updatedAt: "now() (database function)",
        scanAttempts: "scan_attempts + 1 (increment)",
        lastScanError: `COALESCE(last_scan_error, 'Reset by admin: stuck in SCANNING status for >${STUCK_THRESHOLD_MINUTES} minutes')`,
      },
      totalRecords: creativeIds.length,
      batchSize: BATCH_SIZE,
      willUseBatching: creativeIds.length > BATCH_SIZE,
      timeout: `${UPDATE_TIMEOUT_MS}ms`,
      sqlLogic: "Database-native time comparison (not JS Date math)",
    });

    // Process in batches for large datasets
    const allUpdatedIds: string[] = [];
    let totalUpdated = 0;

    if (creativeIds.length <= BATCH_SIZE) {
      // Small batch - process all at once
      let updateResult;
      try {
        const updatePromise = db
          .update(creatives)
          .set({
            status: "pending",
            statusUpdatedAt: sql`now()`,
            updatedAt: sql`now()`,
            scanAttempts: sql`${creatives.scanAttempts} + 1`,
            lastScanError: sql`COALESCE(${creatives.lastScanError}, 'Reset by admin: stuck in SCANNING status for >${STUCK_THRESHOLD_MINUTES} minutes')`,
          })
          .where(
            and(
              eq(creatives.status, "SCANNING"),
              sql`${creatives.statusUpdatedAt} < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`
            )
          )
          .returning({ id: creatives.id });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(`UPDATE query timeout after ${UPDATE_TIMEOUT_MS}ms`)
            );
          }, UPDATE_TIMEOUT_MS);
        });

        updateResult = await Promise.race([updatePromise, timeoutPromise]);
        totalUpdated = updateResult.length;
        allUpdatedIds.push(...updateResult.map((r) => r.id));
      } catch (updateError) {
        console.error("❌ UPDATE QUERY ERROR:", updateError);
        console.error("Error details:", {
          message:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          name: updateError instanceof Error ? updateError.name : undefined,
        });
        throw updateError;
      }
    } else {
      // Large batch - process in chunks
      logger.info({
        message: "Processing large batch",
        totalRecords: creativeIds.length,
        batchSize: BATCH_SIZE,
        estimatedBatches: Math.ceil(creativeIds.length / BATCH_SIZE),
      });

      for (let i = 0; i < creativeIds.length; i += BATCH_SIZE) {
        const batch = creativeIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(creativeIds.length / BATCH_SIZE);

        logger.info({
          message: `Processing batch ${batchNumber}/${totalBatches}`,
          batchStart: i + 1,
          batchEnd: Math.min(i + BATCH_SIZE, creativeIds.length),
          batchSize: batch.length,
        });

        try {
          const updatePromise = db
            .update(creatives)
            .set({
              status: "pending",
              statusUpdatedAt: sql`now()`,
              updatedAt: sql`now()`,
              scanAttempts: sql`${creatives.scanAttempts} + 1`,
              lastScanError: sql`COALESCE(${creatives.lastScanError}, 'Reset by admin: stuck in SCANNING status for >${STUCK_THRESHOLD_MINUTES} minutes')`,
            })
            .where(
              and(
                eq(creatives.status, "SCANNING"),
                sql`${creatives.statusUpdatedAt} < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
                inArray(creatives.id, batch)
              )
            )
            .returning({ id: creatives.id });

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(`UPDATE query timeout after ${UPDATE_TIMEOUT_MS}ms`)
              );
            }, UPDATE_TIMEOUT_MS);
          });

          const batchResult = await Promise.race([
            updatePromise,
            timeoutPromise,
          ]);
          totalUpdated += batchResult.length;
          allUpdatedIds.push(...batchResult.map((r) => r.id));

          logger.info({
            message: `Batch ${batchNumber}/${totalBatches} completed`,
            batchUpdated: batchResult.length,
            totalUpdatedSoFar: totalUpdated,
          });
        } catch (batchError) {
          logger.error({
            message: `Batch ${batchNumber}/${totalBatches} failed`,
            error:
              batchError instanceof Error
                ? batchError.message
                : String(batchError),
            batchStart: i + 1,
            batchEnd: Math.min(i + BATCH_SIZE, creativeIds.length),
          });
          // Continue with next batch instead of failing completely
          // This allows partial success for large batches
        }
      }
    }

    const actualRowsUpdated = totalUpdated;

    logger.info({ message: "✅ ROWS UPDATED", count: actualRowsUpdated });
    logger.info({
      message: "Update Result",
      rowsAffected: actualRowsUpdated,
      expectedRows: creativeIds.length,
      match:
        actualRowsUpdated === creativeIds.length ? "✅ MATCH" : "⚠️ MISMATCH",
      updatedCreativeIds: allUpdatedIds,
      newStatus: "pending",
      timestampSource: "Database now() function",
      executionTimeMs: Date.now() - requestStartTime,
    });
    logger.info("=".repeat(80));

    logger.info({
      action: "creatives.reset_stuck_scanning",
      actorId: session.user.id,
      resetCount: actualRowsUpdated,
      expectedCount: creativeIds.length,
      creativeIds: allUpdatedIds,
      executionTimeMs: Date.now() - requestStartTime,
    });

    const ipAddress =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      null;
    const userAgent = requestHeaders.get("user-agent") ?? null;
    const executionTimestamp = new Date();

    // Prepare response
    const responseBody = {
      reset: actualRowsUpdated,
      ids: allUpdatedIds,
    };
    const responseStatus = 200;

    // Store idempotency key with response
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_WINDOW_HOURS);

    try {
      await db.insert(idempotencyKeys).values({
        id: idempotencyKey,
        requestHash: idempotencyKey,
        responseBody: responseBody as unknown as Record<string, unknown>,
        responseStatus,
        expiresAt,
      });
    } catch (idempotencyError) {
      // Non-critical - log but don't fail
      logger.warn({
        action: "creatives.reset_stuck_scanning",
        error:
          idempotencyError instanceof Error
            ? idempotencyError.message
            : String(idempotencyError),
        message: "Failed to store idempotency key (non-critical)",
      });
    }

    // Insert audit log with retry mechanism
    await insertAuditLogWithRetry({
      userId: session.user.id,
      action: "RESET_STUCK_SCANNING_ASSETS",
      entityType: "creatives",
      entityId: null,
      details: {
        triggeringUser: {
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
        },
        timestamp: executionTimestamp.toISOString(),
        affectedAssetCount: actualRowsUpdated,
        affectedAssetIds: allUpdatedIds,
        thresholdMinutes: STUCK_THRESHOLD_MINUTES,
        previousStatus: "SCANNING",
        newStatus: "PENDING",
        idempotencyKey,
        executionTimeMs: Date.now() - requestStartTime,
      },
      ipAddress,
      userAgent,
      createdAt: executionTimestamp,
    });

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    console.error("ERROR in reset stuck job endpoint:", error);
    console.error("Full error object:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });
    logger.info("=".repeat(80));

    logger.error({
      action: "creatives.reset_stuck_scanning",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to reset stuck SCANNING creatives",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
