import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileType, creativeType } = body;

    if (!fileType || !creativeType) {
      return NextResponse.json(
        { success: false, error: "fileType and creativeType are required" },
        { status: 400 }
      );
    }

    // TODO: Implement actual proofreading logic
    // For now, return a mock response
    const mockResponse = {
      success: true,
      issues: [],
      suggestions: [],
      qualityScore: {
        grammar: 85,
        readability: 90,
        conversion: 80,
        brandAlignment: 88,
      },
    };

    logger.info({
      action: "proofread.creative",
      userId: session.user.id,
      fileType,
      creativeType,
    });

    return NextResponse.json(mockResponse);
  } catch (error) {
    logger.error({
      action: "proofread.creative.error",
      error: (error as Error).message,
      details: error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to proofread creative" },
      { status: 500 }
    );
  }
}
