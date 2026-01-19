import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { redis } from "@/lib/redis";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

async function sendMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot token not configured" },
        { status: 500 }
      );
    }

    const update = await req.json();

    if (update.message && update.message.text) {
      const message = update.message;
      const text = message.text.trim();
      const chat = message.chat;
      const chatId = chat.id.toString();
      const telegramId = chat.username ? `@${chat.username}` : undefined;
      const firstName = chat.first_name || "";

      if (text === "/start" || text.toLowerCase() === "/start") {
        if (telegramId) {
          const verificationKey = `telegram_verify:${telegramId.toLowerCase()}`;
          await redis.set(
            verificationKey,
            JSON.stringify({
              verified: true,
              chatId,
              verifiedAt: new Date().toISOString(),
            }),
            { ex: 3600 }
          );

          const responseText = `✔ Thanks, ${firstName || "there"}! Your Telegram is now linked. You can return to the form and click Verify.`;
          await sendMessage(botToken, chatId, responseText);
        } else {
          await sendMessage(
            botToken,
            chatId,
            "Please set a username in your Telegram account to verify your identity."
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Telegram webhook endpoint" });
}
