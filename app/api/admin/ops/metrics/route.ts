import { desc, count, sql, and, gte, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { withRequestContext } from "@/lib/requestContext";
import { backgroundJobs, creatives } from "@/lib/schema";

export async function GET(_req: Request) {
  return withRequestContext(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Allow both admin and administrator roles for ops dashboard
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "administrator")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [activeJobsCount] = await db
        .select({ value: count() })
        .from(backgroundJobs)
        .where(sql`${backgroundJobs.status} IN ('pending', 'running')`);

      const [failedJobsCount] = await db
        .select({ value: count() })
        .from(backgroundJobs)
        .where(
          and(
            sql`${backgroundJobs.status} IN ('failed', 'dead')`,
            gte(backgroundJobs.createdAt, last24h)
          )
        );

      const [deadJobsCount] = await db
        .select({ value: count() })
        .from(backgroundJobs)
        .where(eq(backgroundJobs.status, "dead"));

      // Count stuck creatives: status = 'SCANNING' AND status_updated_at < now() - 15 minutes
      const [stuckJobsCount] = await db
        .select({ value: count() })
        .from(creatives)
        .where(
          and(
            eq(creatives.status, "SCANNING"),
            sql`${creatives.statusUpdatedAt} < now() - (15 * interval '1 minute')`
          )
        );

      const [totalJobsCount] = await db
        .select({ value: count() })
        .from(backgroundJobs)
        .where(gte(backgroundJobs.createdAt, last24h));

      const [avgLatency] = await db
        .select({
          value: sql<number>`AVG(duration_ms)`,
        })
        .from(backgroundJobs)
        .where(
          and(
            eq(backgroundJobs.status, "completed"),
            gte(backgroundJobs.createdAt, last24h)
          )
        );

      const trends = await db.execute(sql`
                WITH RECURSIVE hours AS (
                    SELECT date_trunc('hour', ${last24h}::timestamp) as hr
                    UNION ALL
                    SELECT hr + interval '1 hour'
                    FROM hours
                    WHERE hr < date_trunc('hour', ${now}::timestamp)
                )
                SELECT 
                    h.hr as "hour",
                    COUNT(j.id) FILTER (WHERE j.status = 'completed') as "success",
                    COUNT(j.id) FILTER (WHERE j.status = 'failed' OR j.status = 'dead') as "failed",
                    COALESCE(AVG(j.duration_ms) FILTER (WHERE j.status = 'completed'), 0) as "avg_duration"
                FROM hours h
                LEFT JOIN ${backgroundJobs} j ON date_trunc('hour', j.created_at) = h.hr
                GROUP BY h.hr
                ORDER BY h.hr ASC
            `);

      const activeJobs = await db
        .select()
        .from(backgroundJobs)
        .where(sql`${backgroundJobs.status} IN ('pending', 'running')`)
        .orderBy(desc(backgroundJobs.createdAt))
        .limit(50);

      const failedJobs = await db
        .select()
        .from(backgroundJobs)
        .where(
          and(
            sql`${backgroundJobs.status} IN ('failed', 'dead')`,
            gte(backgroundJobs.createdAt, last24h)
          )
        )
        .orderBy(desc(backgroundJobs.createdAt))
        .limit(50);

      const recentJobs = await db
        .select()
        .from(backgroundJobs)
        .orderBy(desc(backgroundJobs.createdAt))
        .limit(10);

      const errorRate =
        totalJobsCount.value > 0
          ? ((failedJobsCount.value / totalJobsCount.value) * 100).toFixed(1)
          : "0";

      // Fetch stuck creatives for detail view
      const stuckJobs = await db
        .select({
          id: creatives.id,
          name: creatives.name,
          status: creatives.status,
          statusUpdatedAt: creatives.statusUpdatedAt,
          scanAttempts: creatives.scanAttempts,
          lastScanError: creatives.lastScanError,
          createdAt: creatives.createdAt,
        })
        .from(creatives)
        .where(
          and(
            eq(creatives.status, "SCANNING"),
            sql`${creatives.statusUpdatedAt} < now() - (15 * interval '1 minute')`
          )
        )
        .orderBy(desc(creatives.statusUpdatedAt))
        .limit(50);

      return NextResponse.json({
        stats: {
          activeJobs: activeJobsCount.value,
          failedJobs24h: failedJobsCount.value,
          deadJobs: deadJobsCount.value,
          stuckJobs: stuckJobsCount.value,
          errorRate,
          avgLatency: avgLatency.value ? Math.round(avgLatency.value) : null,
        },
        trends: trends.rows,
        activeJobs,
        failedJobs,
        stuckJobs: stuckJobs.map((job) => ({
          id: job.id,
          type: "creative_scan",
          status: job.status.toLowerCase(),
          progress: 0,
          total: 0,
          createdAt: job.createdAt?.toISOString() || new Date().toISOString(),
          payload: {
            creativeId: job.id,
            creativeName: job.name,
            scanAttempts: job.scanAttempts,
            lastScanError: job.lastScanError,
          },
          error: job.lastScanError || undefined,
        })),
        recentJobs,
      });
    } catch (error) {
      logger.error({
        action: "ops.metrics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }
  });
}
