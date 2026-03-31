import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getNextManualAdvertiserId } from "@/features/admin/services/advertiser.service";
import { handleApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nextId = await getNextManualAdvertiserId();
    return NextResponse.json({ nextId });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
