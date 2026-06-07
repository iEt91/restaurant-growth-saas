"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Shield,
  Settings2,
  LayoutDashboard,
  CalendarDays,
  MonitorDot,
  Users,
  MenuSquare,
  ChefHat,
  Building2,
  Workflow,
  CreditCard,
  FileClock,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSupportMode } from "@/components/support-mode-provider";
import { SupportBanner } from "@/components/support-banner";
import { APP_VERSION } from "@/config/version";

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "calendar"
    | "floorplan"
    | "users"
    | "menu"
    | "report"
    | "settings"
    | "building"
    | "branches"
    | "subscriptions"
    | "audit"
    | "support";
  badge?: string;
};

const navIcons = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  floorplan: MonitorDot,
  users: Users,
  menu: MenuSquare,
  report: ChefHat,
  settings: Settings2,
  building: Building2,
  branches: Workflow,
  subscriptions: CreditCard,
  audit: FileClock,
  support: ShieldCheck,
} as const;

type AppShellProps = {
  brand: string;
  title: string;
  subtitle: string;
  nav: NavItem[];
  children: ReactNode;
  headerAction?: ReactNode;
  roleLabel?: string;
  userLabel?: string;
  showHeader?: boolean;
};

export function AppShell({
  brand,
  title,
  subtitle,
  nav,
  children,
  headerAction,
  roleLabel,
  userLabel,
  showHeader = true,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supportMode = useSupportMode();

  const sidebar = (
    <div className="flex h-full flex-col bg-[color:var(--sidebar-background)] text-[color:var(--sidebar-foreground)]">
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
              {brand.slice(0, 1)}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[color:var(--sidebar-muted)]">
                Restaurant Growth SaaS
              </p>
              <h1 className="mt-2 text-lg font-semibold tracking-tight text-white">
                {brand}
              </h1>
              <p className="mt-1 text-sm text-[color:var(--sidebar-muted)]">
                {subtitle}
              </p>
            </div>
          </div>
          <Badge className="border-transparent bg-[#0f172a] text-white">
            {roleLabel}
          </Badge>
        </div>

        {supportMode.active && supportMode.restaurant ? (
          <Card className="border-0 bg-[#0b1220] p-4 shadow-none">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Shield className="h-4 w-4 text-amber-400" />
              Modo soporte
            </div>
            <p className="mt-2 text-xs leading-5 text-[color:var(--sidebar-muted)]">
              Navegando como {supportMode.restaurant.name}
            </p>
          </Card>
        ) : null}
      </div>

      <Separator className="bg-white/10" />

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = navIcons[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-[color:var(--active-item)] text-white"
                    : "text-[color:var(--sidebar-muted)] hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-white" : "text-[color:var(--sidebar-muted)] group-hover:text-white"
                    )}
                  />
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "border-0 bg-white/10 px-2 py-0.5 text-[11px]",
                      active
                        ? "bg-white/10 text-white"
                        : "text-[color:var(--sidebar-muted)]"
                    )}
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 p-5">
        <Card className="border-0 bg-[#0b1220] p-4 text-white shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 p-2">
              <Settings2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Sprint 1.2</p>
              <p className="text-xs text-[color:var(--sidebar-muted)]">
                Visual premium lista para crecer.
              </p>
            </div>
          </div>
        </Card>

        <div className="rounded-3xl bg-[#0b1220] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--sidebar-muted)]">
            {APP_VERSION}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {userLabel ?? "Usuario activo"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--sidebar-muted)]">
                Acceso al panel interno
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 border-0 bg-white/5 text-white hover:bg-white/10"
              onClick={() => router.push("/")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--app-background)] text-[color:var(--app-foreground)]">
      <div className="flex h-screen w-full">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:h-screen lg:w-[296px]">
          {sidebar}
        </aside>

        <Sheet>
          <div className="fixed left-4 top-4 z-40 lg:hidden">
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-2xl bg-slate-950 text-white hover:bg-slate-900">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="left" className="w-[88vw] border-0 p-0 sm:max-w-sm">
            {sidebar}
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:ml-[296px] lg:px-6 lg:py-6">
          <SupportBanner />

          {showHeader ? (
            <header className="mb-4 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_28px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                  {roleLabel}
                </p>
                <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {headerAction}
                <Button variant="outline" className="rounded-2xl" onClick={() => router.push("/")}>
                  Volver al login
                </Button>
              </div>
            </header>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto pb-2 pr-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
