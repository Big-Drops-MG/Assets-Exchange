import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import {
  attachBrandGuidelines,
  attachOfferBrandGuidelines,
  detachBrandGuidelines,
  getOfferBrandGuidelines,
} from "@/features/admin/services/brandGuidelines.service";
import { auth } from "@/lib/auth";
import { saveBuffer } from "@/lib/fileStorage";
import { getRateLimitKey } from "@/lib/getRateLimitKey";
import { ratelimit } from "@/lib/ratelimit";

async function enforceRateLimit() {
  const key = await getRateLimitKey();
  const { success } = await ratelimit.limit(key);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
}

async function requirePermission() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !session ||
    !["admin", "administrator", "advertiser"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission();
    const { id } = await params;

    const brandGuidelines = await getOfferBrandGuidelines(id);

    return NextResponse.json({
      success: true,
      data: brandGuidelines,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await enforceRateLimit();
    if (rl) return rl;

    const { id } = await params;
    const session = await requirePermission();
    const { fileId } = await req.json();

    if (!fileId)
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

    await attachBrandGuidelines(id, fileId, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await enforceRateLimit();
    if (rl) return rl;

    const { id } = await params;
    const session = await requirePermission();

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const notes = formData.get("notes") as string | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploaded = await saveBuffer(buffer, file.name, "brand-guidelines");

      await attachOfferBrandGuidelines(
        id,
        {
          type: "file",
          fileUrl: uploaded.url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          notes: notes ?? undefined,
        },
        session.user.id
      );

      return new NextResponse(null, { status: 204 });
    }

    const body = (await req.json()) as {
      type?: string;
      url?: string;
      text?: string;
      notes?: string;
    };

    if (!body.type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    if (body.type === "url" && !body.url) {
      return NextResponse.json(
        { error: "URL is required for type 'url'" },
        { status: 400 }
      );
    }

    if (body.type === "text" && !body.text) {
      return NextResponse.json(
        { error: "Text is required for type 'text'" },
        { status: 400 }
      );
    }

    const brandGuidelines: {
      type: "url" | "file" | "text";
      url?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      text?: string;
      notes?: string;
    } = { type: body.type as "url" | "file" | "text" };

    if (body.type === "url") {
      brandGuidelines.url = body.url;
      if (body.notes) brandGuidelines.notes = body.notes;
    } else if (body.type === "text") {
      brandGuidelines.text = body.text;
      if (body.notes) brandGuidelines.notes = body.notes;
    }

    await attachOfferBrandGuidelines(id, brandGuidelines, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await enforceRateLimit();
    if (rl) return rl;

    const { id } = await params;
    await requirePermission();
    await detachBrandGuidelines(id);
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    if (message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
