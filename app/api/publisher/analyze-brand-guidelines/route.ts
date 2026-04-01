import { eq, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { db } from "@/lib/db";
import { offers, advertisers, systemSettings } from "@/lib/schema";

interface GuidelineReview {
  guideline: string;
  follows: string;
  issue: string | null;
  recommended_changes: string | null;
  old_violating_line: string | null;
  new_recommended_line: string | null;
}

interface ApiReviewResponse {
  provider?: string;
  model?: string;
  result?: {
    guidelines?: GuidelineReview[];
  };
  [key: string]: unknown;
}

interface Violation {
  rule_type?: string;
  evidence_text?: string;
  confidence?: number;
  source?: string;
  recommended_changes?: string | null;
  old_violating_line?: string | null;
  new_recommended_line?: string | null;
  [key: string]: unknown;
}

function extractViolations(data: ApiReviewResponse | null): Violation[] {
  if (!data) return [];
  const guidelines = data?.result?.guidelines ?? [];
  return guidelines
    .filter((g) => g.follows?.toLowerCase() !== "yes" || g.issue)
    .map((g) => ({
      rule_type: g.guideline,
      evidence_text: g.issue ?? g.old_violating_line ?? "",
      source: g.follows,
      recommended_changes: g.recommended_changes,
      old_violating_line: g.old_violating_line,
      new_recommended_line: g.new_recommended_line,
    }));
}

async function resolveGuidelinesPdfUrl(
  offerId?: string | null
): Promise<string | null> {
  if (offerId) {
    const [offer] = await db
      .select()
      .from(offers)
      .where(eq(offers.id, offerId));
    if (offer) {
      const bg = offer.brandGuidelines as {
        type?: string;
        url?: string;
        fileUrl?: string;
      } | null;
      if (bg?.type === "url" && bg.url) {
        console.warn(
          "[BG] Using offer brand guidelines URL for offer:",
          offerId
        );
        return bg.url;
      }
      if (bg?.type === "file" && bg.fileUrl) {
        console.warn(
          "[BG] Using offer brand guidelines file for offer:",
          offerId
        );
        return bg.fileUrl;
      }

      const efAdId = offer.everflowAdvertiserId;
      const advId = offer.advertiserId;
      if (efAdId || advId) {
        const conditions = [];
        if (efAdId)
          conditions.push(eq(advertisers.everflowAdvertiserId, efAdId));
        if (advId) {
          conditions.push(eq(advertisers.id, advId));
          conditions.push(eq(advertisers.everflowAdvertiserId, advId));
        }
        const [advertiser] = await db
          .select()
          .from(advertisers)
          .where(or(...conditions));
        if (advertiser) {
          const abg = advertiser.brandGuidelines as {
            type?: string;
            url?: string;
            fileUrl?: string;
          } | null;
          if (abg?.type === "url" && abg.url) {
            console.warn(
              "[BG] Using advertiser brand guidelines URL for offer:",
              offerId
            );
            return abg.url;
          }
          if (abg?.type === "file" && abg.fileUrl) {
            console.warn(
              "[BG] Using advertiser brand guidelines file for offer:",
              offerId
            );
            return abg.fileUrl;
          }
        }
      }
    }
  }

  const defaultFromEnv = env.BRAND_GUIDELINES_DEFAULT_URL;
  if (defaultFromEnv) {
    console.warn("[BG] Using default brand guidelines from env");
    return defaultFromEnv;
  }

  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "default_brand_guidelines_url"));
  if (setting?.value) {
    console.warn("[BG] Using default brand guidelines from system_settings");
    return setting.value;
  }

  console.warn("[BG] No brand guidelines found — proceeding without PDF");
  return null;
}

async function fetchPdfAsBlob(pdfUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(pdfUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.error("[BG] Failed to fetch guideline PDF:", res.status, pdfUrl);
      return null;
    }
    const buffer = await res.arrayBuffer();
    return new Blob([buffer], { type: "application/pdf" });
  } catch (err) {
    console.error("[BG] Error fetching guideline PDF:", err);
    return null;
  }
}

async function callReviewApi(
  serviceUrl: string,
  headers: Record<string, string>,
  guidelinePdfBlob: Blob | null,
  creativeFileOrBlob: File | Blob,
  creativeFileName: string
): Promise<Response> {
  const fd = new FormData();
  if (guidelinePdfBlob) {
    fd.append("guideline_pdf", guidelinePdfBlob, "guidelines.pdf");
  }
  fd.append("creative_file", creativeFileOrBlob, creativeFileName);
  return fetch(`${serviceUrl}/review`, {
    method: "POST",
    headers,
    body: fd,
    signal: AbortSignal.timeout(60_000),
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const creativeFile = formData.get("creative");
    const offerId = formData.get("offerId") as string | null;

    if (
      !creativeFile ||
      typeof creativeFile === "string" ||
      !("size" in creativeFile)
    ) {
      return NextResponse.json(
        { error: "Creative file is required" },
        { status: 400 }
      );
    }

    const pythonServiceUrl = env.BRAND_GUIDELINES_URL?.replace(/\/$/, "");
    if (!pythonServiceUrl) {
      return NextResponse.json(
        { error: "Brand Guidelines service URL is not configured" },
        { status: 500 }
      );
    }

    const guidelinesPdfUrl = await resolveGuidelinesPdfUrl(offerId);
    const guidelinePdfBlob = guidelinesPdfUrl
      ? await fetchPdfAsBlob(guidelinesPdfUrl)
      : null;

    const requestHeaders: Record<string, string> = {};
    if (env.BRAND_GUIDELINES_API_KEY) {
      requestHeaders["X-API-Key"] = env.BRAND_GUIDELINES_API_KEY;
    }

    const requests: Promise<Response>[] = [];

    requests.push(
      callReviewApi(
        pythonServiceUrl,
        requestHeaders,
        guidelinePdfBlob,
        creativeFile,
        (creativeFile as File).name ?? "creative"
      )
    );

    const responses = await Promise.all(requests);
    const allViolations: Violation[] = [];

    for (const res of responses) {
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "[BG] Brand Guidelines API returned non-OK status:",
          res.status,
          errorText
        );
        return NextResponse.json(
          { error: "Brand Guidelines analysis failed" },
          { status: res.status }
        );
      }
      const data = (await res.json()) as ApiReviewResponse;
      allViolations.push(...extractViolations(data));
    }

    const status = allViolations.length === 0 ? "pass" : "fail";

    return NextResponse.json({
      success: true,
      data: { status, violations: allViolations },
    });
  } catch (error: unknown) {
    console.error("[BG] Brand Guidelines Pipeline Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to run Brand Guidelines analysis pipeline";
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
