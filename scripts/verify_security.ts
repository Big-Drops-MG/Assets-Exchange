/* eslint-disable no-console */
import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

import { GET as getPublicOffers } from "../app/api/offers/route";
import { offers, advertisers } from "../lib/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function verify() {
  console.log("=== SECURITY VERIFICATION TEST: PUBLIC OFFER FILTER ===\n");

  const testAdvertiserId = "adv_" + createId();
  const testOfferPrefix = "[SECURITY_TEST]";

  try {
    // 1. Setup
    await db.insert(advertisers).values({
      id: testAdvertiserId,
      name: "Security Test Advertiser",
      contactEmail: "security-test@example.com",
    });

    const offerValues = [
      {
        id: "off_pub_act_" + createId(),
        offerName: testOfferPrefix + " Public Active",
        advertiserId: testAdvertiserId,
        advertiserName: "Test",
        visibility: "Public" as const,
        status: "Active" as const,
      },
      {
        id: "off_int_act_" + createId(),
        offerName: testOfferPrefix + " Internal Active",
        advertiserId: testAdvertiserId,
        advertiserName: "Test",
        visibility: "Internal" as const,
        status: "Active" as const,
      },
      {
        id: "off_pub_inact_" + createId(),
        offerName: testOfferPrefix + " Public Inactive",
        advertiserId: testAdvertiserId,
        advertiserName: "Test",
        visibility: "Public" as const,
        status: "Inactive" as const,
      },
      {
        id: "off_int_inact_" + createId(),
        offerName: testOfferPrefix + " Internal Inactive",
        advertiserId: testAdvertiserId,
        advertiserName: "Test",
        visibility: "Internal" as const,
        status: "Inactive" as const,
      },
    ];

    await db.insert(offers).values(offerValues);
    const testIds = offerValues.map((o) => o.id);

    // TEST A: Normal Request
    console.log("Test A: GET /api/offers");
    const resA = await getPublicOffers();
    const dataA = await resA.json();
    const securityA = dataA.filter((o: { id: string }) =>
      testIds.includes(o.id)
    );
    console.log(
      "Response (IDs found from test set):",
      JSON.stringify(securityA, null, 2)
    );

    // TEST B/C/D would result the same because getPublicOffers() ignores all inputs.

    // ADMIN CHECK
    const { listOffers } =
      await import("../features/admin/services/offer.service");
    await listOffers({ search: testOfferPrefix, status: "Active" }); // Should only find one more (Internal Active)
    await listOffers({ search: testOfferPrefix, status: "Inactive" }); // Should find 2 more

    console.log("\n--- SECURITY CHECK ---");
    const leakedVisibility = securityA.some((o: { id: string }) => {
      const orig = offerValues.find((v) => v.id === o.id);
      return orig?.visibility !== "Public";
    });
    const leakedStatus = securityA.some((o: { id: string }) => {
      const orig = offerValues.find((v) => v.id === o.id);
      return orig?.status !== "Active";
    });

    console.log(
      "Internal/Hidden offers leaked:",
      leakedVisibility ? "❌ YES" : "✅ NO"
    );
    console.log("Inactive offers leaked:", leakedStatus ? "❌ YES" : "✅ NO");

    if (!leakedVisibility && !leakedStatus && securityA.length === 1) {
      console.log("\nRESULT: ✅ PASS");
    } else {
      console.log("\nRESULT: ❌ FAIL");
      console.log(
        "Expected exactly 1 offer (Public Active), but found:",
        securityA.length
      );
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db
      .delete(offers)
      .where(sql`offer_name LIKE ${testOfferPrefix + "%"}`);
    await db.delete(advertisers).where(eq(advertisers.id, testAdvertiserId));
    await pool.end();
  }
}

verify();
