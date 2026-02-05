import { eq, ne } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { creativeRequests, creatives } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code || code.length !== 8) {
      return NextResponse.json(
        { error: "Invalid tracking code" },
        { status: 400 }
      );
    }

    const request = await db.query.creativeRequests.findFirst({
      where: eq(creativeRequests.trackingCode, code.toUpperCase()),
      with: {
        creatives: {
          where: ne(creatives.status, "superseded"),
        },
      },
      columns: {
        id: true,
        offerId: true,
        offerName: true,
        status: true,
        approvalStage: true,
        adminStatus: true,
        adminComments: true,
        submittedAt: true,
        trackingCode: true,
        creativeType: true,
        fromLinesCount: true,
        subjectLinesCount: true,
        priority: true,
        fromLines: true,
        subjectLines: true,
        additionalNotes: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
