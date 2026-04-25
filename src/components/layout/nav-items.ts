import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Calculator,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Settings2,
  Receipt,
  TriangleAlert,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AppRole = "manager" | "admin";

export const mainNav: NavItem[] = [
  { href: "/", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/schedule", label: "Dars jadvali", icon: CalendarDays },
  { href: "/konsultatsiya", label: "Konsultatsiya", icon: MessageCircle },
  { href: "/teachers", label: "O‘qituvchilar", icon: Users },
  { href: "/students", label: "O‘quvchilar", icon: UsersRound },
  { href: "/payments", label: "To‘lovlar", icon: Banknote },
  { href: "/hisob-kitob", label: "Xisob kitob", icon: Calculator },
  { href: "/qarzdorlar", label: "Qarzdorlar", icon: TriangleAlert },
  { href: "/profiles", label: "Profillar", icon: Settings2 },
  { href: "/expenses", label: "Xarajat", icon: Receipt },
];

export function navForRole(role: AppRole): NavItem[] {
  if (role === "admin") {
    return mainNav.filter((x) => x.href !== "/" && x.href !== "/hisob-kitob");
  }
  return mainNav;
}
