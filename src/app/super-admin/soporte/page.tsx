"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupportMode } from "@/components/support-mode-provider";
import { restaurants } from "@/data/mock";

export default function SupportModePage() {
  const router = useRouter();
  const { active, restaurant, enterSupportMode, exitSupportMode } = useSupportMode();

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>Modo soporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-slate-500">
            El modo soporte conserva la estetica premium y te deja entrar a cualquier tenant.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {restaurants.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                onClick={() => {
                  enterSupportMode(item);
                  router.push("/restaurant/dashboard");
                }}
              >
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.city} - {item.monthlyPlan}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {active && restaurant ? `Activo sobre ${restaurant.name}` : "No hay modo soporte activo."}
          </div>
          {active ? (
            <Button variant="destructive" className="w-full rounded-2xl" onClick={exitSupportMode}>
              Salir del modo soporte
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
