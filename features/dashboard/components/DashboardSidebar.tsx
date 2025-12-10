"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  UsersRound,
  Target,
  ChartColumnIncreasing,
  Settings,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getVariables } from "@/components/_variables/variables";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

import type { IconName, SidebarMenuConfig } from "../types/sidebar.types";

const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  Megaphone,
  UsersRound,
  Target,
  ChartColumnIncreasing,
  Settings,
  Settings2,
};

interface DashboardSidebarProps {
  menuConfig: SidebarMenuConfig;
  userName?: string;
  userEmail?: string;
}

export function DashboardSidebar({
  menuConfig,
  userName,
  userEmail,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const variables = getVariables();
  const isCollapsed = state === "collapsed";
  const isExpanded = state === "expanded";
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setShowUserDetails(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowUserDetails(false);
    }
  }, [isExpanded]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 py-4">
        <div className="relative flex items-center justify-center min-h-[45px]">
          <div className="relative w-full flex items-center justify-center">
            {isExpanded && (
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                <Image
                  src={variables.logo.path}
                  alt={variables.logo.alt}
                  width={200}
                  height={60}
                  className="h-auto w-full max-w-[200px] object-contain"
                />
              </div>
            )}
            {isCollapsed && (
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                <Image
                  src={variables.secondaryLogo.path}
                  alt={variables.secondaryLogo.alt}
                  width={56}
                  height={56}
                  className="h-auto w-14 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuConfig.map((group) => (
          <SidebarGroup key={group.id}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = iconMap[item.icon];

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "p-2" : "p-4"}>
        <div className="space-y-2">
          {userName && showUserDetails && (
            <div className="px-2 py-1.5 text-sm transition-opacity duration-300">
              <p className="font-medium">{userName}</p>
              {userEmail && (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              )}
            </div>
          )}
          <div className={`flex ${isCollapsed ? "justify-center" : "w-full"}`}>
            <SignOutButton isCollapsed={isCollapsed} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
