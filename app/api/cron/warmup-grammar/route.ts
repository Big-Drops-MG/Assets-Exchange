import { NextResponse } from "next/server";

import { GrammarService } from "@/lib/services/grammar.service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const result = await GrammarService.warmupService();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Grammar warmup cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
