import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export async function POST(req: NextRequest) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot token not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const webhookUrl =
      body.webhookUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required" },
        { status: 400 }
      );
    }

    const fullWebhookUrl = webhookUrl.startsWith("http")
      ? `${webhookUrl}/api/telegram/webhook`
      : `https://${webhookUrl}/api/telegram/webhook`;

    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: fullWebhookUrl,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description || "Failed to set webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      webhookUrl: fullWebhookUrl,
      message: "Webhook set successfully",
    });
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${TELEGRAM_API_BASE}${botToken}/getWebhookInfo`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting webhook info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
