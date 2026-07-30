import { BarChart3, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban, end: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, end: false },
] as const;

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
