import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { GrammarService } from "@/lib/services/grammar.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined;
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      userId = session?.user?.id;
    } catch (authError) {
      console.warn("Auth check skipped:", authError);
    }

    const body = await req.json();
    const { creativeId, fileUrl } = body;

    if (!creativeId || !fileUrl) {
      return NextResponse.json(
        { success: false, error: "Missing creativeId or fileUrl" },
        { status: 400 }
      );
    }

    const result = await GrammarService.submitForAnalysis(
      creativeId,
      fileUrl,
      userId
    );

    logger.info({
      action: "proofread.creative.submitted",
      userId: userId || "anonymous",
      creativeId,
      taskId: result.taskId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = (error as Error).message || "Failed to start analysis";
    logger.error({
      action: "proofread.creative.error",
      error: errorMessage,
      details: error,
    });
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Missing taskId" },
        { status: 400 }
      );
    }

    const result = await GrammarService.checkTaskStatus(taskId);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error({
      action: "proofread.creative.status.error",
      error: (error as Error).message,
    });
    return NextResponse.json(
      { success: false, error: "Failed to check status" },
      { status: 500 }
    );
  }
}
