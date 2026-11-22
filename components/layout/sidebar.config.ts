import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  User as UserIcon,
  LucideIcon,
} from "lucide-react";

export type UserRole = "admin" | "moderator" | "user" | string;

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  /** Permitted roles. Admin can always access all items. */
  roles?: string[];
}

export interface NavSection {
  title: string;
  /** Section-level role restrictions. Admin can always access all sections. */
  roles?: string[];
  items: NavItem[];
}

/**
 * Master navigation definition organized by sections and permitted roles.
 */
export const MASTER_NAVIGATION: NavSection[] = [
  {
    title: "Main Workspace",
    items: [
      {
        title: "Overview",
        href: "/",
        icon: LayoutDashboard,
        roles: ["admin", "moderator", "user"],
      },
      {
        title: "Lead Directory",
        href: "/leads",
        icon: Users,
        roles: ["admin", "moderator", "user"],
      },
    ],
  },
  {
    title: "Administration",
    roles: ["admin"],
    items: [
      {
        title: "User Directory",
        href: "/users",
        icon: UserCog,
        roles: ["admin"],
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "My Profile",
        href: "/profile",
        icon: UserIcon,
        roles: ["admin", "moderator", "user"],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

/**
 * Filters navigation items according to the user's role.
 * - Admin sees all sections and items unconditionally.
 * - Non-admin roles (moderator, user) see only sections and items explicitly matching their role.
 */
export function getNavSectionsForRole(role: string = "user"): NavSection[] {
  const norm = role.toLowerCase();

  // Admin super-role: full visibility across all navigation items
  if (norm === "admin") {
    return MASTER_NAVIGATION;
  }

  return MASTER_NAVIGATION.map((section) => {
    // If section specifies roles and current role is not included, hide entire section
    if (
      section.roles &&
      !section.roles.map((r) => r.toLowerCase()).includes(norm)
    ) {
      return null;
    }

    // Filter items within the section
    const permittedItems = section.items.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.map((r) => r.toLowerCase()).includes(norm);
    });

    if (permittedItems.length === 0) return null;

    return {
      ...section,
      items: permittedItems,
    };
  }).filter((section): section is NavSection => section !== null);
}
