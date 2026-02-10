import { eq, inArray, sql, and, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { batches, impressions, clicks } from "@/lib/schema";

// Source of truth for batch analytics:
// - impressions table: Tracks when assets are displayed/viewed (impression events)
// - clicks table: Tracks when assets are clicked
// Both tables link to batches via batch_id for batch-level performance analysis

export interface BatchPerformanceMetrics {
  batchId: string;
  batchLabel: string;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
}

export interface BatchAnalyticsResponse {
  batches: BatchPerformanceMetrics[];
  summary: {
    totalBatches: number;
    totalImpressions: number;
    totalClicks: number;
    averageCtr: number;
  };
}

/**
 * Calculate CTR (Click-Through Rate) safely
 * CTR = (clicks / impressions) * 100
 * Returns 0 if impressions is 0 to avoid division by zero
 */
function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) {
    return 0;
  }
  return (clicks / impressions) * 100;
}

/**
 * Get performance metrics for a single batch
 * Returns metrics with zero values if batch has no impressions/clicks
 */
export async function getBatchPerformance(
  batchId: string
): Promise<BatchPerformanceMetrics | null> {
  const batch = await db
    .select()
    .from(batches)
    .where(eq(batches.id, batchId))
    .limit(1);

  if (batch.length === 0) {
    return null;
  }

  let impressionsResult: { count: number }[];
  let clicksResult: { count: number }[];

  try {
    impressionsResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(impressions)
      .where(
        and(eq(impressions.batchId, batchId), isNotNull(impressions.batchId))
      );
  } catch (error) {
    console.error("Batch analytics source table missing or empty:", error);
    impressionsResult = [{ count: 0 }];
  }

  try {
    clicksResult = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(clicks)
      .where(and(eq(clicks.batchId, batchId), isNotNull(clicks.batchId)));
  } catch (error) {
    console.error("Batch analytics source table missing or empty:", error);
    clicksResult = [{ count: 0 }];
  }

  const totalImpressions = impressionsResult[0]?.count ?? 0;
  const totalClicks = clicksResult[0]?.count ?? 0;
  const ctr = calculateCTR(totalImpressions, totalClicks);

  return {
    batchId: batch[0].id,
    batchLabel: batch[0].batchLabel,
    totalImpressions,
    totalClicks,
    ctr,
  };
}

/**
 * Get performance metrics for multiple batches
 * Uses GROUP BY for efficient querying
 * Returns metrics for all requested batches, even if they have zero impressions/clicks
 */
export async function getBatchesPerformance(
  batchIds: string[]
): Promise<BatchAnalyticsResponse> {
  if (batchIds.length === 0) {
    return {
      batches: [],
      summary: {
        totalBatches: 0,
        totalImpressions: 0,
        totalClicks: 0,
        averageCtr: 0,
      },
    };
  }

  const validBatches = await db
    .select({
      id: batches.id,
      batchLabel: batches.batchLabel,
    })
    .from(batches)
    .where(inArray(batches.id, batchIds));

  if (validBatches.length === 0) {
    throw new Error("No valid batches found");
  }

  const validBatchIds = validBatches.map((b) => b.id);

  let impressionsByBatch: { batchId: string | null; count: number }[];
  let clicksByBatch: { batchId: string | null; count: number }[];

  try {
    impressionsByBatch = await db
      .select({
        batchId: impressions.batchId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(impressions)
      .where(
        and(
          inArray(impressions.batchId, validBatchIds),
          isNotNull(impressions.batchId)
        )
      )
      .groupBy(impressions.batchId);
  } catch (error) {
    console.error("Batch analytics source table missing or empty:", error);
    impressionsByBatch = [];
  }

  try {
    clicksByBatch = await db
      .select({
        batchId: clicks.batchId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(clicks)
      .where(
        and(inArray(clicks.batchId, validBatchIds), isNotNull(clicks.batchId))
      )
      .groupBy(clicks.batchId);
  } catch (error) {
    console.error("Batch analytics source table missing or empty:", error);
    clicksByBatch = [];
  }

  const impressionsMap = new Map<string, number>();
  impressionsByBatch.forEach((row) => {
    if (row.batchId) {
      impressionsMap.set(row.batchId, row.count);
    }
  });

  const clicksMap = new Map<string, number>();
  clicksByBatch.forEach((row) => {
    if (row.batchId) {
      clicksMap.set(row.batchId, row.count);
    }
  });

  const batchMetrics: BatchPerformanceMetrics[] = validBatches.map((batch) => {
    const totalImpressions = impressionsMap.get(batch.id) ?? 0;
    const totalClicks = clicksMap.get(batch.id) ?? 0;
    const ctr = calculateCTR(totalImpressions, totalClicks);

    return {
      batchId: batch.id,
      batchLabel: batch.batchLabel,
      totalImpressions,
      totalClicks,
      ctr,
    };
  });

  const summary = {
    totalBatches: batchMetrics.length,
    totalImpressions: batchMetrics.reduce(
      (sum, b) => sum + b.totalImpressions,
      0
    ),
    totalClicks: batchMetrics.reduce((sum, b) => sum + b.totalClicks, 0),
    averageCtr: 0,
  };

  if (summary.totalImpressions > 0) {
    summary.averageCtr = calculateCTR(
      summary.totalImpressions,
      summary.totalClicks
    );
  }

  return {
    batches: batchMetrics,
    summary,
  };
}

/**
 * Get performance metrics for all active batches
 * Useful for dashboard overview
 */
export async function getAllActiveBatchesPerformance(): Promise<BatchAnalyticsResponse> {
  const activeBatches = await db
    .select({
      id: batches.id,
      batchLabel: batches.batchLabel,
    })
    .from(batches)
    .where(eq(batches.status, "active"));

  if (activeBatches.length === 0) {
    return {
      batches: [],
      summary: {
        totalBatches: 0,
        totalImpressions: 0,
        totalClicks: 0,
        averageCtr: 0,
      },
    };
  }

  const batchIds = activeBatches.map((b) => b.id);
  return getBatchesPerformance(batchIds);
}
