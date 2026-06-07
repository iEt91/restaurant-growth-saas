"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { restaurants } from "@/data/mock";
import { useSupportMode } from "@/components/support-mode-provider";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function RestaurantsPage() {
  const router = useRouter();
  const { enterSupportMode } = useSupportMode();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{restaurant.name}</CardTitle>
                <Badge variant={restaurant.status === "activo" ? "success" : "danger"}>
                  {restaurant.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">
                {restaurant.city} · {restaurant.cuisine}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-400">Sucursales</p>
                  <p className="mt-1 font-medium text-slate-950">{restaurant.branchesCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-400">Plan</p>
                  <p className="mt-1 font-medium text-slate-950">{restaurant.monthlyPlan}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-500">Dueño: {restaurant.ownerName}</p>
                <p className="text-sm text-slate-500">Activa desde {restaurant.activeSince}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    enterSupportMode(restaurant);
                    router.push("/restaurant/dashboard");
                  }}
                >
                  Entrar como soporte
                  <ShieldCheck className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="rounded-2xl">
                  Ver detalle
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Resumen operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            ["Restaurantes activos", "2"],
            ["Suscripciones vencidas", "1"],
            ["Soportes abiertos", "3"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
