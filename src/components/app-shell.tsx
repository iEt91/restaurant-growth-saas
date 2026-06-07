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
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSupportMode } from "@/components/support-mode-provider";
import { SupportBanner } from "@/components/support-banner";
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
};

export function AppShell({
  brand,
  title,
  subtitle,
  nav,
  children,
  headerAction,
  roleLabel,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supportMode = useSupportMode();

  const sidebar = (
    <div className="flex h-full flex-col bg-white/90">
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
              {brand.slice(0, 1)}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                Restaurant Growth
              </p>
              <h1 className="mt-1 text-lg font-semibold text-slate-950">
                {brand}
              </h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <Badge variant={roleLabel === "Super Admin" ? "info" : "secondary"}>
            {roleLabel}
          </Badge>
        </div>

        {supportMode.active && supportMode.restaurant ? (
          <Card className="border-amber-200 bg-amber-50/80 p-4 shadow-none">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <Shield className="h-4 w-4" />
              {supportMode.restaurant.name}
            </div>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              El modo soporte ya está activo y listo para navegar entre paneles.
            </p>
          </Card>
        ) : null}
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = navIcons[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-2xl border-l-4 px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                    )}
                  />
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge
                    variant={active ? "secondary" : "outline"}
                    className={cn(
                      "border-0 px-2 py-0.5 text-[11px]",
                      active && "bg-white/10 text-white"
                    )}
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="space-y-4 p-5">
        <Card className="bg-slate-950 p-4 text-white shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-2">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Sprint 1 listo</p>
              <p className="text-xs text-slate-300">
                Base visual preparada para Supabase y roles.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f3f6fb_100%)]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[312px] shrink-0 border-r border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:block">
          {sidebar}
        </aside>

        <Sheet>
          <div className="fixed left-4 top-4 z-40 lg:hidden">
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-2xl bg-white">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="left" className="w-[86vw] p-0 sm:max-w-sm">
            {sidebar}
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <SupportBanner />

          <header className="mb-5 flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/85 px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.04)] backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
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
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => router.push("/")}
              >
                Volver al login
              </Button>
            </div>
          </header>

          <div className="min-w-0 flex-1 pb-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
