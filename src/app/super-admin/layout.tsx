import { AppShell, type NavItem } from "@/components/app-shell";
import type { ReactNode } from "react";

const nav: NavItem[] = [
  { href: "/super-admin/restaurants", label: "Restaurantes", icon: "building" },
  { href: "/super-admin/sucursales", label: "Sucursales", icon: "branches" },
  { href: "/super-admin/usuarios", label: "Usuarios", icon: "users" },
  { href: "/super-admin/suscripciones", label: "Suscripciones", icon: "subscriptions" },
  { href: "/super-admin/auditoria", label: "Auditoría", icon: "audit" },
  { href: "/super-admin/soporte", label: "Modo soporte", icon: "support" },
];

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AppShell
      brand="Control Center"
      title="Panel Super Admin"
      subtitle="Gestión global de restaurantes, usuarios y soporte."
      nav={nav}
      roleLabel="Super Admin"
      userLabel="Lucía Gómez"
      showHeader
    >
      {children}
    </AppShell>
  );
}
