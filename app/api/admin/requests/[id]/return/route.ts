import { headers as getHeaders } from "next/headers";
import { NextResponse } from "next/server";

import { sendBackRequest } from "@/features/admin/services/request.service";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = await getHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session || !["admin", "administrator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const feedbackMessage = body.reason || body.feedback;

    if (!feedbackMessage) {
      return NextResponse.json(
        { error: "Feedback is required" },
        { status: 400 }
      );
    }

    await sendBackRequest(id, session.user.id, feedbackMessage);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to return request";
    if (message === "Request not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Invalid state transition") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
