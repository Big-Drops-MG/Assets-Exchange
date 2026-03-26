import { eq } from "drizzle-orm";

import { sendAlert } from "@/lib/alerts";
import { db } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email/ses";
import { creativeRequests, publishers } from "@/lib/schema";

import type { WorkflowEvent } from "./types";

const PUBLISHER_EVENTS: WorkflowEvent["event"][] = [
  "request.approved_by_admin",
  "request.rejected_by_admin",
  "request.sent_back_by_admin",
  "response.approved_by_advertiser",
  "response.sent_back_by_advertiser",
  "response.rejected_by_advertiser",
];

async function getPublisherInfo(requestId: string): Promise<{
  email: string | null;
  trackingCode: string | null;
  telegramChatId: string | null;
  telegramId: string | null;
}> {
  const row = await db.query.creativeRequests.findFirst({
    where: eq(creativeRequests.id, requestId),
    columns: {
      email: true,
      trackingCode: true,
      telegramId: true,
    },
  });
  if (!row)
    return {
      email: null,
      trackingCode: null,
      telegramChatId: null,
      telegramId: null,
    };

  const pub = row.email?.trim()
    ? await db.query.publishers.findFirst({
        where: eq(publishers.contactEmail, row.email.trim()),
        columns: { telegramId: true, telegramChatId: true },
      })
    : null;

  return {
    email: row.email?.trim() || null,
    trackingCode: row.trackingCode ?? null,
    telegramChatId: pub?.telegramChatId ?? null,
    telegramId: pub?.telegramId ?? row.telegramId ?? null,
  };
}

function buildWorkflowEmailSubject(evt: WorkflowEvent): string {
  switch (evt.event) {
    case "request.approved_by_admin":
      return `Creative approved – ${evt.offerName}`;
    case "request.rejected_by_admin":
      return `Creative rejected – ${evt.offerName}`;
    case "request.sent_back_by_admin":
      return `Creative sent back for revisions – ${evt.offerName}`;
    case "response.approved_by_advertiser":
      return `Your creative was approved – ${evt.offerName}`;
    case "response.sent_back_by_advertiser":
      return `Creative sent back for revisions – ${evt.offerName}`;
    case "response.rejected_by_advertiser":
      return `Creative update – ${evt.offerName}`;
    default:
      return `Assets Exchange – ${evt.offerName}`;
  }
}

function buildWorkflowEmailBody(
  evt: WorkflowEvent,
  trackingCode: string | null
): { text: string; html: string } {
  const base = `Offer: ${evt.offerName}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trackUrl = trackingCode
    ? `${baseUrl}/track?code=${encodeURIComponent(trackingCode)}`
    : baseUrl
      ? `${baseUrl}/track`
      : "";

  let summary = "";
  switch (evt.event) {
    case "request.approved_by_admin":
      summary = "Your creative has been reviewed and approved by our team.";
      break;
    case "request.rejected_by_admin":
      summary = "Your creative has been rejected after review.";
      break;
    case "request.sent_back_by_admin":
      summary = "Your creative has been sent back for revisions by our team.";
      break;
    case "response.approved_by_advertiser":
      summary = "Your creative has been approved by the advertiser.";
      break;
    case "response.sent_back_by_advertiser":
      summary = "The advertiser has sent the creative back for revisions.";
      break;
    case "response.rejected_by_advertiser":
      summary = "The advertiser has rejected the creative.";
      break;
    default:
      summary = "There is an update on your creative request.";
  }

  const text =
    `${summary}\n\n${base}\n\n` +
    (trackUrl ? `Track your asset status: ${trackUrl}\n` : "");
  const html =
    `<p>${summary}</p><p>${base.replace(/\n/g, "<br>")}</p>` +
    (trackUrl
      ? `<p><a href="${trackUrl}">Track your asset status</a></p>`
      : "");
  return { text, html };
}

function buildWorkflowTelegramMessage(
  evt: WorkflowEvent,
  trackingCode: string | null
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trackUrl = trackingCode
    ? `${baseUrl}/track?code=${encodeURIComponent(trackingCode)}`
    : baseUrl
      ? `${baseUrl}/track`
      : "";

  let header = "";
  let body = "";

  switch (evt.event) {
    case "request.approved_by_admin":
      header = "✅ <b>Creative Approved</b>";
      body = "Your creative has been reviewed and approved by our team.";
      break;
    case "request.rejected_by_admin":
      header = "❌ <b>Creative Rejected</b>";
      body = "Your creative has been rejected after review.";
      break;
    case "request.sent_back_by_admin":
      header = "↩️ <b>Creative Sent Back</b>";
      body = "Your creative has been sent back for revisions by our team.";
      break;
    case "response.approved_by_advertiser":
      header = "🎉 <b>Creative Approved by Advertiser</b>";
      body = "Your creative has been approved by the advertiser.";
      break;
    case "response.sent_back_by_advertiser":
      header = "↩️ <b>Creative Sent Back by Advertiser</b>";
      body = "The advertiser has sent your creative back for revisions.";
      break;
    case "response.rejected_by_advertiser":
      header = "❌ <b>Creative Rejected by Advertiser</b>";
      body = "The advertiser has rejected your creative.";
      break;
    default:
      return "";
  }

  const offerLine = `<b>Offer:</b> ${evt.offerName}`;
  const trackLine = trackUrl
    ? `\n\n<a href="${trackUrl}">Track your asset status</a>`
    : "";

  return `${header}\n\n${body}\n${offerLine}${trackLine}`;
}

async function sendWorkflowTelegramAlert(
  chatId: string,
  message: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("[TELEGRAM_SKIP] TELEGRAM_BOT_TOKEN not set");
    return;
  }
  if (!message) return;

  const isLocalhost =
    !process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL.includes("localhost");

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: false,
  };

  if (isLocalhost) {
    payload.disable_web_page_preview = true;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      description?: string;
    };
    console.error(
      `[TELEGRAM_WORKFLOW_FAILED] ${err.description ?? res.statusText}`
    );
  } else {
    console.warn(`[TELEGRAM_WORKFLOW_SENT] chat_id: ${chatId}`);
  }
}

export async function notifyWorkflowEvent(evt: WorkflowEvent) {
  try {
    const base = `Request: ${evt.requestId}\nOffer: ${evt.offerName}`;

    let msg = "";

    switch (evt.event) {
      case "request.approved_by_admin":
        msg = `📤 *Request approved by Admin*\n${base}`;
        break;

      case "request.rejected_by_admin":
        msg = `❌ *Request rejected by Admin*\n${base}`;
        break;

      case "request.sent_back_by_admin":
        msg = `↩️ *Request sent back by Admin*\n${base}`;
        break;

      case "response.approved_by_advertiser":
        msg = `✅ *Response approved by Advertiser*\n${base}`;
        break;

      case "response.sent_back_by_advertiser":
        msg = `↩️ *Response sent back by Advertiser*\n${base}`;
        break;

      case "response.rejected_by_advertiser":
        msg = `❌ *Response rejected by Advertiser*\n${base}`;
        break;

      case "request.sent_back_by_admin":
        msg = `↩️ *Request sent back by Admin*\n${base}`;
        break;

      case "request.forwarded_to_advertiser":
        msg = `📨 *Request forwarded to Advertiser*\n${base}`;
        break;

      default:
        return;
    }

    await sendAlert(msg);

    if (PUBLISHER_EVENTS.includes(evt.event)) {
      const { email, trackingCode, telegramChatId, telegramId } =
        await getPublisherInfo(evt.requestId);

      // Email
      if (isEmailConfigured() && email) {
        const subject = buildWorkflowEmailSubject(evt);
        const { html } = buildWorkflowEmailBody(evt, trackingCode);
        await sendEmail({ to: email, subject, html }).catch((err) => {
          console.error("[EMAIL_WORKFLOW_FAILED]", err);
        });
      }

      // Telegram
      const tgChatId = telegramChatId || telegramId;
      if (tgChatId && isValidTelegramId(tgChatId)) {
        const tgMessage = buildWorkflowTelegramMessage(evt, trackingCode);
        await sendWorkflowTelegramAlert(tgChatId, tgMessage).catch((err) => {
          console.error("[TELEGRAM_WORKFLOW_ERROR]", err);
        });
      }
    }
  } catch (err) {
    console.error("Failed to send workflow notification", err);
  }
}

export function isValidTelegramId(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  const t = id.trim();
  if (/^-?\d+$/.test(t)) return true;
  return /^@[a-zA-Z0-9_]{5,32}$/.test(t);
}

export async function getPublisherTelegramId(
  publisherId: string
): Promise<string | null> {
  const result = await db.query.publishers.findFirst({
    where: eq(publishers.id, publisherId),
    columns: {
      telegramId: true,
    },
  });

  return result?.telegramId ?? null;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendSubmissionTelegramAlert(
  telegramId: string,
  trackingCode: string,
  campaignName: string
) {
  if (!isValidTelegramId(telegramId)) {
    console.warn(`Invalid Telegram ID for alert: ${telegramId}`);
    return;
  }

  const escapedCampaignName = escapeHtml(campaignName);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trackUrl = baseUrl
    ? `${baseUrl}/track?code=${encodeURIComponent(trackingCode)}`
    : "";
  const message =
    `🎉 <b>Submission Received!</b>\n\n` +
    `<b>Campaign:</b> ${escapedCampaignName}\n` +
    `<b>Tracking Code:</b> <code>${trackingCode}</code>\n\n` +
    (trackUrl ? `<a href="${trackUrl}">Assets Exchange tracking page</a>` : "");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("[TELEGRAM_FAILED] TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      description?: string;
    };
    const errorMessage = errorData.description || response.statusText;
    console.error(`[TELEGRAM_FAILED] ${errorMessage}`);
    throw new Error(`Telegram API Error: ${errorMessage}`);
  }

  console.warn(`[TELEGRAM_SENT] TrackingCode: ${trackingCode}`);
}

function getBaseUrlFromHeadersLike(
  host?: string | null,
  proto?: string | null
) {
  const safeProto = proto ?? "https";
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${safeProto}://${host}`;
}

function buildTrackUrl(baseUrl: string, trackingCode: string) {
  // Your submit route uses /track?code=... in Telegram section
  return `${baseUrl}/track?code=${encodeURIComponent(trackingCode)}`;
}

export async function sendSubmissionEmailAlert(params: {
  to: string;
  trackingCode: string;
  offerName: string;
  offerId?: string | null;
  host?: string | null;
  proto?: string | null;
}) {
  const baseUrl = getBaseUrlFromHeadersLike(params.host, params.proto);
  const trackUrl = buildTrackUrl(baseUrl, params.trackingCode);

  const subject = `Submission received — Tracking Code: ${params.trackingCode}`;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeOfferName = escape(params.offerName ?? "");
  const safeOfferId = params.offerId ? escape(params.offerId) : null;

  const html =
    `<div style="font-family: Arial, sans-serif; line-height: 1.6;">` +
    `<h2>🎉 Submission Received!</h2>` +
    `<p><b>Offer Name:</b> ${safeOfferName}</p>` +
    (safeOfferId ? `<p><b>Offer ID:</b> ${safeOfferId}</p>` : ``) +
    `<p><b>Tracking Code:</b> <code>${params.trackingCode}</code></p>` +
    `<p><a href="${trackUrl}">🔗 Track your submission</a></p>` +
    `</div>`;

  await sendEmail({ to: params.to, subject, html });
}

export async function sendStatusChangeEmailAlert(params: {
  to: string;
  trackingCode: string;
  offerName: string;
  host?: string | null;
  proto?: string | null;
  status:
    | "admin_approved"
    | "admin_rejected"
    | "admin_sent_back"
    | "admin_forwarded"
    | "advertiser_approved"
    | "advertiser_rejected"
    | "advertiser_sent_back";
  reason?: string | null;
}) {
  const baseUrl = getBaseUrlFromHeadersLike(params.host, params.proto);
  const trackUrl = buildTrackUrl(baseUrl, params.trackingCode);

  const statusLabel: Record<typeof params.status, string> = {
    admin_approved: "Approved by Admin ✅",
    admin_rejected: "Rejected by Admin ❌",
    admin_sent_back: "Sent back by Admin (revisions requested) ↩️",
    admin_forwarded: "Forwarded to Advertiser 🔁",
    advertiser_approved: "Approved by Advertiser ✅",
    advertiser_rejected: "Rejected by Advertiser ❌",
    advertiser_sent_back: "Sent back by Advertiser (revisions requested)",
  };

  const subject = `Status update — ${statusLabel[params.status]} — ${params.trackingCode}`;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeOfferName = escape(params.offerName ?? "");
  const safeReason = params.reason ? escape(params.reason) : null;

  const html =
    `<div style="font-family: Arial, sans-serif; line-height: 1.6;">` +
    `<h2>${statusLabel[params.status]}</h2>` +
    `<p><b>Offer Name:</b> ${safeOfferName}</p>` +
    `<p><b>Tracking Code:</b> <code>${params.trackingCode}</code></p>` +
    (safeReason ? `<p><b>Reason:</b> ${safeReason}</p>` : ``) +
    `<p><a href="${trackUrl}">🔗 View status</a></p>` +
    `</div>`;

  await sendEmail({ to: params.to, subject, html });
}
