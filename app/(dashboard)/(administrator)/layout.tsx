import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/get-user";

export default async function AdministratorLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  // Allow both admin and administrator roles for Ops area
  if (user.role !== "admin" && user.role !== "administrator") {
    redirect("/unauthorized");
  }

  return <div className="flex-1 min-h-0 flex flex-col">{children}</div>;
}
