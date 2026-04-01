import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getDashboardStats } from "@/features/advertiser/services/dashboard.service";
import { resolveAdvertiserId } from "@/features/advertiser/services/resolveAdvertiser";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "advertiser") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const advertiserId = await resolveAdvertiserId(session.user.email);

    if (!advertiserId) {
      console.error(
        `[Stats] No advertiser found for email: ${session.user.email}`
      );
      return NextResponse.json(
        { error: "Advertiser record not found" },
        { status: 404 }
      );
    }

    const stats = await getDashboardStats(advertiserId);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Advertiser dashboard stats error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
