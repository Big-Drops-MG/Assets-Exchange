import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { resolveAdvertiserId } from "@/features/advertiser/services/resolveAdvertiser";
import { rejectResponse } from "@/features/advertiser/services/response.service";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "advertiser") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const advertiserId = await resolveAdvertiserId(session.user.email);

  if (!advertiserId) {
    return NextResponse.json(
      { error: "Advertiser profile not found" },
      { status: 404 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : "";

    await rejectResponse(id, advertiserId, reason);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Reject response error:", error);
    if (message === "Request not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Invalid state transition") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
