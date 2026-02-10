import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/get-user";

/**
 * Dashboard root page - redirects to appropriate default route based on user role
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  // Redirect based on user role to their default dashboard
  switch (user.role) {
    case "admin":
    case "administrator":
      // Operations Dashboard is the default for admin/administrator
      redirect("/ops");
    case "advertiser":
      // TODO: Add advertiser default dashboard when ready
      redirect("/creatives");
    default:
      // Fallback to creatives page
      redirect("/creatives");
  }
}
