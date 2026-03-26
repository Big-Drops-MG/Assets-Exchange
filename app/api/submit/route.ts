import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { getOffer } from "@/features/admin/services/offer.service";
import {
  sendSubmissionEmailAlert,
  sendSubmissionTelegramAlert,
} from "@/features/notifications/notification.service";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/ses";
import { logger } from "@/lib/logger";
import { validateRequest } from "@/lib/middleware/validateRequest";
import {
  assetsTable,
  creativeRequests,
  creatives,
  publishers,
} from "@/lib/schema";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { generateTrackingCode } from "@/lib/utils/tracking";
import { submitSchema } from "@/lib/validations/publisher";

function countLines(text: string | undefined): number {
  if (!text || text.trim() === "") return 0;
  return text.split("\n").filter((line) => line.trim() !== "").length;
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateRequest(req, submitSchema);
    if ("response" in validation) return validation.response;

    const data = validation.data;

    const offer = await getOffer(data.offerId);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const publisherName = `${data.firstName} ${data.lastName}`;
    const publisherId = data.affiliateId;

    let fromLinesCount = countLines(data.fromLines);
    let subjectLinesCount = countLines(data.subjectLines);
    let finalFromLines = data.fromLines || "";
    let finalSubjectLines = data.subjectLines || "";

    if (data.files?.length) {
      data.files.forEach((file) => {
        if (file.metadata) {
          const metadata = file.metadata as Record<string, unknown>;
          if (typeof metadata.fromLines === "string") {
            fromLinesCount += countLines(metadata.fromLines);
            if (!finalFromLines) finalFromLines = metadata.fromLines;
          }
          if (typeof metadata.subjectLines === "string") {
            subjectLinesCount += countLines(metadata.subjectLines);
            if (!finalSubjectLines) finalSubjectLines = metadata.subjectLines;
          }
        }
      });
    }

    const priority =
      data.priority === "high" ? "High Priority" : "Medium Priority";

    const trackingCode = generateTrackingCode();

    const nonDependencyFiles =
      data.files?.filter((f) => {
        const metadata = (f.metadata || {}) as Record<string, unknown>;
        const isHtml = f.type.includes("html");
        return isHtml || !metadata.isDependency;
      }) || [];

    const [request] = await db
      .insert(creativeRequests)
      .values({
        offerId: data.offerId,
        offerName: offer.offerName,
        creativeType: data.creativeType,
        creativeCount: nonDependencyFiles.length || 1,
        fromLinesCount,
        subjectLinesCount,
        publisherId,
        publisherName,
        email: data.email,
        telegramId: data.telegramId || null,
        advertiserId: offer.advertiserId || "",
        advertiserName: offer.advName || "",
        affiliateId: data.affiliateId,
        clientId: data.affiliateId,
        clientName: data.companyName,
        priority,
        trackingCode,
        status: "new",
        approvalStage: "admin",
        adminStatus: "pending",
        fromLines: sanitizePlainText(finalFromLines),
        subjectLines: sanitizePlainText(finalSubjectLines),
        additionalNotes: sanitizePlainText(data.additionalNotes),
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: creativeRequests.id });

    try {
      await db.insert(assetsTable).values({
        id: request.id,
        publisherId,
        status: "new",
        createdAt: new Date(),
        approvedAt: null,
      });

      logger.app.info(
        { requestId: request.id, publisherId },
        "Inserted asset into assets_table"
      );
    } catch (error) {
      logger.app.error(
        { requestId: request.id, publisherId, error },
        "Failed to insert asset into assets_table"
      );
    }

    if (data.files?.length) {
      const now = new Date();
      const nameToId = new Map<string, string>();

      // Pre-generate IDs for all files to allow parentId linkage
      data.files.forEach((file) => {
        nameToId.set(file.name, createId());
      });

      const creativeRecords = data.files.map((file) => {
        const id = nameToId.get(file.name)!;
        const metadata = (file.metadata || {}) as Record<string, unknown>;
        const isHtml = file.type.includes("html");

        // Linkage logic:
        // - if file is dependency: set isDependency = true, parentId = linked HTML id, dependencyType
        // - HTML creatives: isDependency = false
        const isDependency = !isHtml && !!metadata.isDependency;
        const parentPath = metadata.parentPath as string | undefined;
        const parentId =
          isDependency && parentPath ? nameToId.get(parentPath) || null : null;

        return {
          id,
          requestId: request.id,
          parentId,
          name: file.name,
          url: file.url,
          type: file.type,
          size: file.size,
          format: file.type.includes("image")
            ? "image"
            : isHtml
              ? "html"
              : "other",
          status: "pending", // Inherits same initial status as parent (all start as pending)
          isDependency,
          dependencyType: isDependency
            ? (metadata.dependencyType as string) || "asset"
            : null,
          metadata: file.metadata || {},
          createdAt: now,
          updatedAt: now,
          statusUpdatedAt: now,
          scanAttempts: 0,
        };
      });

      await db.insert(creatives).values(creativeRecords);
    }

    try {
      let telegramChatId: string | null = null;
      const byAffiliate = await db
        .select({ telegramChatId: publishers.telegramChatId })
        .from(publishers)
        .where(eq(publishers.id, data.affiliateId))
        .limit(1);
      if (byAffiliate[0]?.telegramChatId) {
        telegramChatId = String(byAffiliate[0].telegramChatId);
      }
      if (!telegramChatId) {
        const byEmail = await db
          .select({ telegramChatId: publishers.telegramChatId })
          .from(publishers)
          .where(eq(publishers.contactEmail, data.email))
          .limit(1);
        if (byEmail[0]?.telegramChatId) {
          telegramChatId = String(byEmail[0].telegramChatId);
        }
      }
      if (!telegramChatId && data.telegramId?.trim()) {
        const normalized = data.telegramId.trim().toLowerCase();
        const byTelegramId = await db
          .select({ telegramChatId: publishers.telegramChatId })
          .from(publishers)
          .where(eq(publishers.telegramId, normalized))
          .limit(1);
        if (byTelegramId[0]?.telegramChatId) {
          telegramChatId = String(byTelegramId[0].telegramChatId);
        }
      }

      if (telegramChatId && env.TELEGRAM_BOT_TOKEN) {
        const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
        const h = await headers();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        const proto = h.get("x-forwarded-proto") ?? "https";
        const reqBaseUrl = host ? `${proto}://${host}` : "";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
        const baseUrl = appUrl ?? reqBaseUrl;
        const trackingUrl = `${baseUrl}/track?code=${encodeURIComponent(trackingCode)}`;
        const isLocalhost =
          baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

        const text =
          `Submission Received\n\n` +
          `Offer Name: ${offer.offerName ?? ""}\n` +
          `Offer ID: ${offer.offerId}\n` +
          `Tracking Code: ${trackingCode}\n\n` +
          (isLocalhost
            ? `Track your submission: ${trackingUrl}`
            : `Track your submission:`);

        const tgRes = await fetch(
          `${TELEGRAM_API_BASE}${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text,
              ...(!isLocalhost && {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "Track your submission", url: trackingUrl }],
                  ],
                },
              }),
            }),
          }
        );
        if (!tgRes.ok) {
          const errBody = (await tgRes.json().catch(() => ({}))) as {
            description?: string;
          };
          console.error(
            "[TELEGRAM_SUBMIT_FAILED]",
            tgRes.status,
            errBody.description ?? tgRes.statusText
          );
        } else {
          console.warn("[TELEGRAM_SENT] TrackingCode:", trackingCode);
        }
      } else if (!env.TELEGRAM_BOT_TOKEN) {
        console.warn("[TELEGRAM_SKIP] TELEGRAM_BOT_TOKEN not set");
      } else {
        console.warn(
          "[TELEGRAM_SKIP] No telegramChatId for affiliateId/email/telegramId"
        );
      }
    } catch (telegramError) {
      logger.app.error({ error: telegramError }, "Telegram send failed");
    }

    if (data.telegramId) {
      try {
        await sendSubmissionTelegramAlert(
          data.telegramId,
          trackingCode,
          offer.offerName ?? ""
        );
      } catch (telegramAlertError) {
        logger.app.error(
          { error: telegramAlertError },
          "[TELEGRAM_NOTIFY_ERROR]"
        );
      }
    }

    if (isEmailConfigured() && data.email?.trim()) {
      try {
        const h = await headers();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        const proto = h.get("x-forwarded-proto") ?? "https";

        await sendSubmissionEmailAlert({
          to: data.email.trim(),
          trackingCode,
          offerName: offer.offerName ?? "",
          offerId: offer.offerId ?? null,
          host,
          proto,
        });
      } catch (emailError) {
        logger.app.error({ error: emailError }, "[SUBMISSION_EMAIL_FAILED]");
      }
    }

    return NextResponse.json(
      { success: true, requestId: request.id, trackingCode },
      { status: 201 }
    );
  } catch (error) {
    logger.app.error({ error }, "Submit error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
