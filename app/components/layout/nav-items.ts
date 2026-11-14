import { Bot, KeyRound, LayoutDashboard, UserCog, BarChart3, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string }[];
};

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admins", label: "Admins", icon: UserCog },
  { href: "/consumers", label: "Consumers", icon: Bot },
  { href: "/providers", label: "Provider Keys", icon: KeyRound },
  {
    href: "/usage",
    label: "Usage",
    icon: BarChart3,
    children: [
      { href: "/usage/general", label: "General" },
      { href: "/usage/consumer", label: "Consumer" },
    ],
  },
];
