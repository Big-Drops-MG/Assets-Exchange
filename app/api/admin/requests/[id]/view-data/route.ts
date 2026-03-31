import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getRequestWithCreatives,
  type RequestCreativeRow,
} from "@/features/admin/services/request.service";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function getUploadedZipFileName(
  rows: RequestCreativeRow[]
): string | undefined {
  for (const row of rows) {
    const metadata = row.metadata as Record<string, unknown> | null | undefined;
    const candidates = [
      metadata?.uploadedZipFileName,
      metadata?.zipFileName,
      metadata?.archiveName,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }
  return undefined;
}

function rowToViewCreative(
  row: RequestCreativeRow,
  requestMetadata: {
    fromLines?: string;
    subjectLines?: string;
    additionalNotes?: string;
  }
) {
  const isImage =
    row.format === "image" ||
    /^image\//i.test(row.type) ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(row.name);
  const isHtml =
    row.format === "html" ||
    /html/i.test(row.type) ||
    /\.html?$/i.test(row.name);

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    size: row.size,
    type: row.type,
    previewUrl: isImage ? row.url : undefined,
    html: isHtml,
    metadata: {
      fromLines:
        (row.metadata?.fromLines as string) || requestMetadata.fromLines,
      subjectLines:
        (row.metadata?.subjectLines as string) || requestMetadata.subjectLines,
      additionalNotes:
        (row.metadata?.additionalNotes as string) ||
        requestMetadata.additionalNotes,
    },
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getRequestWithCreatives(id);

    if (!result || result.creatives.length === 0) {
      return NextResponse.json(null);
    }

    const creativeType = result.request.creativeType ?? "email";
    const requestMetadata = {
      fromLines: result.request.fromLines ?? undefined,
      subjectLines: result.request.subjectLines ?? undefined,
      additionalNotes: result.request.additionalNotes ?? undefined,
    };

    const viewCreatives = result.creatives.map((row) =>
      rowToViewCreative(row, requestMetadata)
    );

    const hasHtml = viewCreatives.some((c) => c.html);
    const processed = viewCreatives
      .map((c) => ({
        ...c,
        isHidden: hasHtml && !c.html,
      }))
      // HTML files first, then images — same order as upload flow
      .sort((a, b) => {
        if (a.html && !b.html) return -1;
        if (!a.html && b.html) return 1;
        return 0;
      });

    const visible = processed.filter((c) => !c.isHidden);

    const isZipSubmission = result.creatives.some((row) => {
      const m = row.metadata as Record<string, unknown> | null | undefined;
      return m?.source === "zip";
    });

    if (visible.length === 1 && !isZipSubmission) {
      return NextResponse.json({
        type: "single",
        creative: visible[0],
        creativeType,
      });
    }

    return NextResponse.json({
      type: "multiple",
      creatives: processed,
      creativeType,
      uploadedZipFileName: getUploadedZipFileName(result.creatives),
    });
  } catch (error) {
    console.error("view-data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
