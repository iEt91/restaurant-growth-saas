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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modo soporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-slate-500">
            Aquí se centraliza la navegación de soporte. Desde la pantalla de
            restaurantes podés entrar como si fueras parte del tenant.
          </p>
          <div className="flex flex-wrap gap-3">
            {restaurants.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  enterSupportMode(item);
                  router.push("/restaurant/dashboard");
                }}
              >
                Entrar a {item.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            {active && restaurant
              ? `Activo sobre ${restaurant.name}`
              : "No hay modo soporte activo."}
          </p>
          {active ? (
            <Button variant="destructive" className="rounded-2xl" onClick={exitSupportMode}>
              Salir del modo soporte
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
