import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { creativeMetadata } from "@/lib/schema";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { creativeId, fileUrl, newName } = body;

    if (!creativeId) {
      return NextResponse.json(
        { success: false, error: "creativeId is required" },
        { status: 400 }
      );
    }

    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "newName is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const existingMetadata = await db
      .select()
      .from(creativeMetadata)
      .where(eq(creativeMetadata.creativeId, creativeId))
      .limit(1);

    const currentMetadata = existingMetadata.length > 0 && existingMetadata[0].metadata
      ? (existingMetadata[0].metadata as {
          lastSaved?: string;
          lastGenerated?: string;
          lastProofread?: string;
          creativeType?: string;
          fileName?: string;
        })
      : {};

    const updatedMetadata = {
      ...currentMetadata,
      fileName: newName.trim(),
      lastSaved: new Date().toISOString(),
    };

    await db
      .insert(creativeMetadata)
      .values({
        creativeId,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: creativeMetadata.creativeId,
        set: {
          metadata: updatedMetadata,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      message: "File name updated successfully",
    });
  } catch (error) {
    console.error("Error renaming creative:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to rename creative";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
