import { env } from "../env";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

async function setupWebhook() {
  const botToken = env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error(
      "Error: TELEGRAM_BOT_TOKEN is not set in environment variables"
    );
    process.exit(1);
  }

  const webhookUrl =
    process.env.WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;

  if (!webhookUrl) {
    console.error(
      "Error: WEBHOOK_URL, NEXT_PUBLIC_APP_URL, or VERCEL_URL must be set"
    );
    process.exit(1);
  }

  const fullWebhookUrl = webhookUrl.startsWith("http")
    ? `${webhookUrl}/api/telegram/webhook`
    : `https://${webhookUrl}/api/telegram/webhook`;

  console.error(`Setting webhook to: ${fullWebhookUrl}`);

  try {
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

    if (data.ok) {
      console.error("✓ Webhook set successfully!");
      console.error(`  URL: ${fullWebhookUrl}`);
    } else {
      console.error("✗ Failed to set webhook:", data.description);
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Error setting webhook:", error);
    process.exit(1);
  }
}

setupWebhook();
