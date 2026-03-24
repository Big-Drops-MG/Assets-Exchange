import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminRequestById } from "@/features/admin/services/request.service";
import { sendStatusChangeEmailAlert } from "@/features/notifications/notification.service";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type NotifyBody = {
  status?: string;
  approvalStage?: string;
  publisher?: { affiliateId?: string; clientName?: string };
  advertiser?: { name?: string; everflowOfferId?: string | null };
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as NotifyBody;

    const row = await getAdminRequestById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.status && body.status !== row.status) {
      return NextResponse.json(
        { error: "Request status does not match current record" },
        { status: 400 }
      );
    }
    if (body.approvalStage && body.approvalStage !== row.approvalStage) {
      return NextResponse.json(
        { error: "Approval stage does not match current record" },
        { status: 400 }
      );
    }

    if (row.status !== "approved" && row.status !== "rejected") {
      return NextResponse.json(
        { error: "Notify not applicable for this status" },
        { status: 400 }
      );
    }

    const email = row.email;
    const trackingCode = row.trackingCode;
    if (!email || !trackingCode) {
      return NextResponse.json(
        { error: "Missing publisher email or tracking code" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    const proto = headersList.get("x-forwarded-proto");

    let mailStatus: Parameters<typeof sendStatusChangeEmailAlert>[0]["status"];
    if (row.status === "approved") {
      mailStatus =
        row.approvalStage === "completed"
          ? "advertiser_approved"
          : "admin_approved";
    } else {
      mailStatus =
        row.approvalStage === "advertiser"
          ? "advertiser_rejected"
          : "admin_rejected";
    }

    await sendStatusChangeEmailAlert({
      to: email,
      trackingCode,
      offerName: row.offerName,
      host,
      proto,
      status: mailStatus,
      reason: row.adminComments ?? row.advertiserComments ?? null,
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent",
      recipients: [email],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    logger.app.error(
      {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Creative request notify error"
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
