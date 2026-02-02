import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { creatives } from "@/lib/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const STUCK_THRESHOLD_MINUTES = 15;

export async function POST(_req: Request) {
  console.log("=".repeat(80));
  console.log("RESET STUCK JOB ENDPOINT HIT");
  console.log("=".repeat(80));

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      console.log("❌ UNAUTHORIZED - Admin check failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Admin authenticated:", {
      userId: session.user.id,
      role: session.user.role,
    });

    console.log("📊 Query Parameters:", {
      thresholdMinutes: STUCK_THRESHOLD_MINUTES,
      statusFilter: "SCANNING",
      timeCondition: `status_updated_at < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
      note: "Using database-native time logic with parameterized interval multiplication",
    });

    console.log("🔍 EXECUTING STUCK JOB RESET QUERY (SELECT)");
    console.log("Query Details:", {
      table: "creatives",
      whereConditions: [
        "status = 'SCANNING'",
        `status_updated_at < now() - (${STUCK_THRESHOLD_MINUTES} * interval '1 minute')`,
      ],
      selectFields: ["id", "status", "status_updated_at", "scan_attempts"],
      sqlLogic: "Database-native time comparison with parameterized interval (PostgreSQL-safe)",
    });

    let stuckCreatives;
    try {
      stuckCreatives = await db
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
    } catch (selectError) {
      console.error("❌ SELECT QUERY ERROR:", selectError);
      console.error("Error details:", {
        message: selectError instanceof Error ? selectError.message : String(selectError),
        stack: selectError instanceof Error ? selectError.stack : undefined,
      });
      throw selectError;
    }

    console.log("📋 SELECT Query Result:", {
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
      console.log("ℹ️  No stuck creatives found - returning early");
      logger.info({
        action: "creatives.reset_stuck_scanning",
        actorId: session.user.id,
        message: "No stuck SCANNING creatives found",
      });

      return NextResponse.json({
        reset: 0,
        ids: [],
      });
    }

    const creativeIds = stuckCreatives.map((c) => c.id);

    console.log("🔧 EXECUTING STUCK JOB RESET QUERY (UPDATE)");
    console.log("Update Query Details:", {
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
      expectedAffectedRows: creativeIds.length,
      creativeIds,
      sqlLogic: "Database-native time comparison (not JS Date math)",
    });

    let updateResult;
    try {
      updateResult = await db
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
    } catch (updateError) {
      console.error("❌ UPDATE QUERY ERROR:", updateError);
      console.error("Error details:", {
        message: updateError instanceof Error ? updateError.message : String(updateError),
        stack: updateError instanceof Error ? updateError.stack : undefined,
        name: updateError instanceof Error ? updateError.name : undefined,
      });
      throw updateError;
    }

    const actualRowsUpdated = updateResult.length;

    console.log("✅ ROWS UPDATED:", actualRowsUpdated);
    console.log("Update Result:", {
      rowsAffected: actualRowsUpdated,
      expectedRows: creativeIds.length,
      match: actualRowsUpdated === creativeIds.length ? "✅ MATCH" : "⚠️ MISMATCH",
      updatedCreativeIds: updateResult.map((r) => r.id),
      newStatus: "pending",
      timestampSource: "Database now() function",
    });
    console.log("=".repeat(80));

    logger.info({
      action: "creatives.reset_stuck_scanning",
      actorId: session.user.id,
      resetCount: actualRowsUpdated,
      expectedCount: creativeIds.length,
      creativeIds: updateResult.map((r) => r.id),
    });

    return NextResponse.json({
      reset: actualRowsUpdated,
      ids: updateResult.map((r) => r.id),
    });
  } catch (error) {
    console.error("❌ ERROR in reset stuck job endpoint:", error);
    console.error("Full error object:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });
    console.log("=".repeat(80));

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
