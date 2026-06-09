"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";

export function RestaurantAppShell({
  children,
  nav,
}: Readonly<{
  children: ReactNode;
  nav: NavItem[];
}>) {
  const { restaurantProfile } = useRestaurantFlow();

  return (
    <AppShell
      brand={restaurantProfile.name}
      title="Panel Restaurante"
      subtitle={`${restaurantProfile.cuisine} · ${restaurantProfile.city}`}
      nav={nav}
      roleLabel="Dueño / Gerente"
      userLabel="Sofía Martínez"
      showHeader={false}
    >
      {children}
    </AppShell>
  );
}
