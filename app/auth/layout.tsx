import type { Metadata } from "next";

import { getVariables } from "@/components/_variables/variables";

const variables = getVariables();

export const metadata: Metadata = {
  title: `Authentication - ${variables.branding.appName}`,
  description: `Authentication - ${variables.branding.companyName}`,
  icons: {
    icon: variables.favicon.path,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden">{children}</div>
  );
}
