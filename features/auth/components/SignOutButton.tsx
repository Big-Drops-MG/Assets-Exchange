"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

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
      className={isCollapsed ? "size-8" : "w-full"}
    >
      <LogOut className="size-4" />
      {!isCollapsed && <span>Sign Out</span>}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          Sign Out
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
