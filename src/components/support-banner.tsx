"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupportMode } from "@/components/support-mode-provider";
import { ShieldCheck } from "lucide-react";

export function SupportBanner() {
  const router = useRouter();
  const { active, restaurant, exitSupportMode } = useSupportMode();

  if (!active || !restaurant) return null;

  function handleExitSupportMode() {
    exitSupportMode();
    router.push("/super-admin/restaurants");
  }

  return (
    <div className="mb-4 bg-transparent">
      <div className="flex flex-col gap-3 rounded-3xl border border-amber-300/30 bg-[linear-gradient(90deg,rgba(17,24,39,0.96),rgba(31,41,55,0.96))] px-4 py-3 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="warning"
            className="gap-1.5 border-amber-300/30 bg-amber-400/15 text-amber-100"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Modo soporte activo
          </Badge>
          <p className="text-sm font-medium text-slate-100">
            Estás viendo <span className="font-semibold">{restaurant.name}</span>{" "}
            como Super Admin
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="border-0 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={handleExitSupportMode}
        >
          Salir del modo soporte
        </Button>
      </div>
    </div>
  );
}
