import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { creativeMetadata } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creativeIdParam = searchParams.get("creativeId");

    if (!creativeIdParam) {
      return NextResponse.json(
        { success: false, error: "creativeId is required" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(creativeMetadata)
      .where(eq(creativeMetadata.creativeId, creativeIdParam))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        metadata: undefined,
      });
    }

    const record = result[0];

    return NextResponse.json({
      success: true,
      metadata: {
        fromLines: record.fromLines ?? undefined,
        subjectLines: record.subjectLines ?? undefined,
        proofreadingData: record.proofreadingData ?? undefined,
        htmlContent: record.htmlContent ?? undefined,
        additionalNotes: record.additionalNotes ?? undefined,
        metadata: record.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("Error getting creative metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get creative metadata" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creativeId,
      fromLines,
      subjectLines,
      proofreadingData,
      htmlContent,
      additionalNotes,
      metadata,
    } = body;

    if (!creativeId) {
      return NextResponse.json(
        { success: false, error: "creativeId is required" },
        { status: 400 }
      );
    }

    await db
      .insert(creativeMetadata)
      .values({
        creativeId,
        fromLines: fromLines || null,
        subjectLines: subjectLines || null,
        proofreadingData: proofreadingData || null,
        htmlContent: htmlContent || null,
        additionalNotes: additionalNotes || null,
        metadata: metadata || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: creativeMetadata.creativeId,
        set: {
          fromLines: fromLines ?? null,
          subjectLines: subjectLines ?? null,
          proofreadingData: proofreadingData ?? null,
          htmlContent: htmlContent ?? null,
          additionalNotes: additionalNotes ?? null,
          metadata: metadata ?? null,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error saving creative metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save creative metadata" },
      { status: 500 }
    );
  }
}
