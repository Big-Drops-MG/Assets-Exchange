"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { getVariables } from "@/components/_variables/variables";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/lib/better-auth-client";

interface SignOutButtonProps {
  isCollapsed?: boolean;
}

export function SignOutButton({ isCollapsed = false }: SignOutButtonProps) {
  const router = useRouter();
  const variables = getVariables();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  const button = (
    <Button
      variant="outline"
      onClick={handleSignOut}
      size={isCollapsed ? "icon" : "default"}
      className={
        isCollapsed
          ? "size-8 lg:size-8.5 xl:size-9 rounded-md shadow-sm"
          : "w-full font-medium rounded-md shadow-sm flex items-center justify-start gap-2"
      }
      style={{
        backgroundColor:
          variables.colors.sidebarFooterSignOutButtonBackgroundColor,
        color: variables.colors.sidebarFooterSignOutButtonTextColor,
        borderColor: "transparent",
      }}
    >
      {!isCollapsed && (
        <>
          <LogOut
            className="size-3.5 lg:size-4"
            style={{
              color: variables.colors.sidebarFooterSignOutButtonIconColor,
            }}
          />
          <span
            className="font-medium text-xs lg:text-[0.83rem] font-inter"
            style={{
              color: variables.colors.sidebarFooterSignOutButtonTextColor,
            }}
          >
            Logout
          </span>
        </>
      )}
      {isCollapsed && (
        <LogOut
          className="size-4 lg:size-4.5 xl:size-5"
          style={{
            color: variables.colors.sidebarFooterSignOutButtonIconColor,
          }}
        />
      )}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          Logout
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
