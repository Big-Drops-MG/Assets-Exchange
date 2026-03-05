import { NextResponse } from "next/server";

import { listOffers } from "@/features/admin/services/offer.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/offers
 * Public endpoint for publishers to fetch available offers.
 * STRICT SECURITY: Only Active + Public offers are returned.
 *
 * Manual Test:
 * 1. Create an offer with status='Active' and visibility='Public'. Verify it appears here.
 * 2. Create an offer with status='Active' and visibility='Internal'. Verify it is NOT returned here.
 * 3. Create an offer with status='Inactive' and visibility='Public'. Verify it is NOT returned here.
 *
 * Note: Admin users should use /api/admin/offers for management, which bypasses these filters.
 */
export async function GET() {
  try {
    const offersList = await listOffers({
      status: "Active",
      visibility: "Public",
    });
    const offerData = offersList.map((offer) => ({
      id: offer.id,
      offerId: offer.offerId,
    }));

    return NextResponse.json(offerData);
  } catch (error: unknown) {
    console.error("Error fetching offers:", error);

    const err = error as {
      status?: number;
      code?: string;
      message?: string;
    } | null;

    const isQuota =
      err?.status === 503 ||
      err?.code === "COMPUTE_QUOTA_EXCEEDED" ||
      (typeof err?.message === "string" &&
        (err.message.includes("compute time quota") ||
          err.message.includes("compute time")));

    if (isQuota) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Service temporarily unavailable",
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 }
    );
  }
}
