import JSZip from "jszip";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getRequestWithCreatives } from "@/features/admin/services/request.service";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 200) || "creative";
}

export async function GET(
  _: Request,
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
    const result = await getRequestWithCreatives(id);

    if (!result || result.creatives.length === 0) {
      return NextResponse.json(
        { error: "No creatives found for this request" },
        { status: 404 }
      );
    }

    const { creatives } = result;

    if (creatives.length === 1) {
      const c = creatives[0];
      const upstream = await fetch(c.url);
      if (!upstream.ok) {
        logger.app.error(
          { requestId: id, url: c.url, status: upstream.status },
          "Creative download upstream failed"
        );
        return NextResponse.json(
          { error: "Failed to fetch creative file" },
          { status: 502 }
        );
      }
      const buf = await upstream.arrayBuffer();
      const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
      const safeName = sanitizeFilename(c.name);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const zip = new JSZip();
    for (const c of creatives) {
      const upstream = await fetch(c.url);
      if (!upstream.ok) {
        logger.app.error(
          { requestId: id, url: c.url, status: upstream.status },
          "Creative zip member fetch failed"
        );
        return NextResponse.json(
          { error: `Failed to fetch file: ${c.name}` },
          { status: 502 }
        );
      }
      const buf = await upstream.arrayBuffer();
      zip.file(sanitizeFilename(c.name), buf);
    }

    const zipped = await zip.generateAsync({ type: "uint8array" });
    const ab = new ArrayBuffer(zipped.byteLength);
    new Uint8Array(ab).set(zipped);
    const zipName = `creatives-${id}.zip`;

    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    logger.app.error(
      {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Creative download error"
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
