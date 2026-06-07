"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupportMode } from "@/components/support-mode-provider";
import { ShieldCheck } from "lucide-react";

export function SupportBanner() {
  const { active, restaurant, exitSupportMode } = useSupportMode();

  if (!active || !restaurant) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="warning" className="gap-1.5 border-amber-200 bg-white/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Modo soporte activo
        </Badge>
        <p className="text-sm font-medium">
          Estás viendo <span className="font-semibold">{restaurant.name}</span>{" "}
          como Super Admin
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={exitSupportMode}>
        Salir del modo soporte
      </Button>
    </div>
  );
}
