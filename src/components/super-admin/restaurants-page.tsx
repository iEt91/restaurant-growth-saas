"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { restaurants } from "@/data/mock";
import { useSupportMode } from "@/components/support-mode-provider";
import { ArrowRight, Plus, Search, ShieldCheck } from "lucide-react";

export function RestaurantsPage() {
  const router = useRouter();
  const { enterSupportMode } = useSupportMode();

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Restaurantes</CardTitle>
            <p className="text-sm text-slate-500">
              Tabla administrativa con acciones y acceso al modo soporte.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar restaurante..."
                className="h-11 w-72 rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-slate-950"
              />
            </div>
            <Button className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Restaurante
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Restaurante</th>
                  <th className="px-4 py-3">Sucursal(es)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="text-sm">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">{restaurant.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {restaurant.city} - {restaurant.ownerName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{restaurant.branchesCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={restaurant.status === "activo" ? "success" : "danger"}>
                        {restaurant.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{restaurant.monthlyPlan}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            enterSupportMode(restaurant);
                            router.push("/restaurant/dashboard");
                          }}
                        >
                          Entrar como soporte
                          <ShieldCheck className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Detalle
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Total restaurantes", "24"],
              ["Restaurantes activos", "18"],
              ["Sucursales totales", "41"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Restaurante
            </Button>
            <Button variant="outline" className="w-full rounded-2xl">
              Ver todas las suscripciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
