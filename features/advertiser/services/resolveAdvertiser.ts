import { eq, ilike } from "drizzle-orm";

import { db } from "@/lib/db";
import { advertisers, user } from "@/lib/schema";

export async function resolveAdvertiserId(
  userEmail: string
): Promise<string | null> {
  const [byEmail] = await db
    .select({ id: advertisers.id })
    .from(advertisers)
    .where(ilike(advertisers.contactEmail, userEmail))
    .limit(1);

  if (byEmail) return byEmail.id;

  const [authUser] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, userEmail))
    .limit(1);

  if (authUser?.name) {
    const [byName] = await db
      .select({ id: advertisers.id })
      .from(advertisers)
      .where(ilike(advertisers.name, authUser.name))
      .limit(1);

    if (byName) return byName.id;
  }

  const [byUserId] = await db
    .select({ id: advertisers.id })
    .from(advertisers)
    .where(eq(advertisers.id, authUser?.id ?? ""))
    .limit(1);

  if (byUserId) return byUserId.id;

  const allAdvertisers = await db
    .select({
      id: advertisers.id,
      name: advertisers.name,
      contactEmail: advertisers.contactEmail,
    })
    .from(advertisers)
    .limit(10);
  console.error(
    `[resolveAdvertiserId] Failed for email="${userEmail}", userId="${authUser?.id}", userName="${authUser?.name}". Available advertisers:`,
    allAdvertisers.map(
      (a) => `${a.id} / ${a.name} / ${a.contactEmail ?? "(no email)"}`
    )
  );

  return null;
}
