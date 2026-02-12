import { redirect } from "next/navigation";

import { AdminDashboard } from "@/features/admin";
import { getCurrentUser } from "@/lib/get-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  // Role-based redirect logic (moved from app/(dashboard)/page.tsx)
  // This ensures users are directed to their appropriate dashboard
  switch (user.role) {
    case "admin":
      // Admin users see the AdminDashboard when explicitly visiting /dashboard
      return <AdminDashboard />;
    case "administrator":
      // Administrators are redirected to ops dashboard
      redirect("/ops");
    case "advertiser":
      // Advertisers are redirected to creatives page
      redirect("/creatives");
    default:
      // Fallback to creatives page
      redirect("/creatives");
  }
}
