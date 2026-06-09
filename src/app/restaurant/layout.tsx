import type { NavItem } from "@/components/app-shell";
import { RestaurantAppShell } from "@/components/restaurant-app-shell";
import { RestaurantFlowProvider } from "@/components/restaurant-flow-provider";
import type { ReactNode } from "react";

const nav: NavItem[] = [
  { href: "/restaurant/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/restaurant/reservas", label: "Reservas", icon: "calendar", badge: "12" },
  { href: "/restaurant/plano-mesas", label: "Plano de Mesas", icon: "floorplan" },
  { href: "/restaurant/clientes", label: "Clientes", icon: "users" },
  { href: "/restaurant/menu", label: "Menú", icon: "menu" },
  { href: "/restaurant/reportes", label: "Reportes", icon: "report" },
  { href: "/restaurant/configuracion", label: "Configuración", icon: "settings" },
];

export default function RestaurantLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <RestaurantFlowProvider>
      <RestaurantAppShell nav={nav}>{children}</RestaurantAppShell>
    </RestaurantFlowProvider>
  );
}
