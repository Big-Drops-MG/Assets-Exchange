import { NextResponse } from "next/server";

import { listOffers } from "@/features/admin/services/offer.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const offersList = await listOffers({ status: "Active" });
    const offerData = offersList.map((offer) => ({
      id: offer.id,
      offerId: offer.offerId,
    }));

    return NextResponse.json(offerData);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
