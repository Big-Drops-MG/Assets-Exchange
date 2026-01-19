import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOffer } from "@/features/admin/services/offer.service";
import { db } from "@/lib/db";
import { creativeRequests } from "@/lib/schema";

const submitSchema = z.object({
  affiliateId: z.string().min(1),
  companyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  telegramId: z.string().optional(),
  offerId: z.string().min(1),
  creativeType: z.string().min(1),
  fromLines: z.string().optional(),
  subjectLines: z.string().optional(),
  priority: z.string().optional(),
});

function countLines(text: string | undefined): number {
  if (!text || text.trim() === "") return 0;
  return text.split("\n").filter((line) => line.trim() !== "").length;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const offer = await getOffer(data.offerId);

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const publisherName = `${data.firstName} ${data.lastName}`;
    const publisherId = data.affiliateId;
    const fromLinesCount = countLines(data.fromLines);
    const subjectLinesCount = countLines(data.subjectLines);
    const priority =
      data.priority === "high" ? "High Priority" : "Medium Priority";

    const [request] = await db
      .insert(creativeRequests)
      .values({
        offerId: data.offerId,
        offerName: offer.offerName,
        creativeType: data.creativeType,
        creativeCount: 1,
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
        status: "new",
        approvalStage: "admin",
        adminStatus: "pending",
      })
      .returning({ id: creativeRequests.id });

    return NextResponse.json(
      { success: true, requestId: request.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
