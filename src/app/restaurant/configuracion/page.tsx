"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_VERSION, VERSION_HISTORY } from "@/config/version";

const sections = [
  "Restaurante",
  "Sucursales",
  "Horarios",
  "Reservas",
  "Plano",
  "Menú",
  "Usuarios",
  "Página inicial",
] as const;

export default function SettingsPage() {
  const [autoConfirm, setAutoConfirm] = React.useState(true);
  const [waitlist, setWaitlist] = React.useState(true);
  const [defaultView, setDefaultView] = React.useState("Dashboard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <p className="text-sm text-slate-500">
          Estructura lista para administrar reglas, vistas y módulos.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Reservas">
          <TabsList className="mb-6 flex w-full flex-wrap gap-2 rounded-[22px] bg-slate-100 p-2">
            {sections.map((section) => (
              <TabsTrigger key={section} value={section}>
                {section}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Restaurante">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del restaurante</Label>
                <Input defaultValue="Avenida 312" />
              </div>
              <div className="space-y-2">
                <Label>Giro</Label>
                <Input defaultValue="Contemporánea" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="Sucursales">
            <div className="space-y-3">
              {["Palermo", "Belgrano", "Recoleta"].map((branch) => (
                <div key={branch} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="font-medium text-slate-700">{branch}</p>
                  <Badge variant="secondary">Activa</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Horarios">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Lunes a jueves", "12:00 - 00:00"],
                ["Viernes y sábado", "12:00 - 01:00"],
                ["Domingo", "12:00 - 23:00"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="Reservas">
            <div className="space-y-4">
              {[
                ["Confirmar automáticamente reservas si hay disponibilidad", autoConfirm, setAutoConfirm],
                ["Permitir lista de espera", waitlist, setWaitlist],
              ].map(([label, checked, setChecked]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-700">{label as string}</p>
                    <p className="text-sm text-slate-500">Mock de switch listo para la lógica real.</p>
                  </div>
                  <Switch checked={checked as boolean} onCheckedChange={setChecked as (checked: boolean) => void} />
                </div>
              ))}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Duración estándar de reserva</Label>
                  <Input defaultValue="90 minutos" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre reservas</Label>
                  <Input defaultValue="15 minutos" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="Plano">
            <p className="text-sm leading-7 text-slate-500">
              La vista operativa del plano ya está en su propia pantalla.
            </p>
          </TabsContent>

          <TabsContent value="Menú">
            <p className="text-sm leading-7 text-slate-500">
              La estructura del menú está lista para conectar categorías y productos.
            </p>
          </TabsContent>

          <TabsContent value="Usuarios">
            <p className="text-sm leading-7 text-slate-500">
              Aquí irán permisos, invitaciones y asignación de roles por sucursal.
            </p>
          </TabsContent>

          <TabsContent value="Página inicial">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Elegí qué pantalla abrir primero al ingresar al panel.
              </p>
              <div className="grid gap-3 md:grid-cols-5">
                {["Dashboard", "Reservas", "Plano de Mesas", "Clientes", "Reportes"].map((view) => (
                  <Button
                    key={view}
                    variant={defaultView === view ? "default" : "outline"}
                    className="rounded-2xl"
                    onClick={() => setDefaultView(view)}
                  >
                    {view}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                Versión
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {APP_VERSION}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Estructura preparada para evoluciones futuras del producto.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              <p className="font-medium text-slate-700">Última actualización</p>
              <p className="mt-1">{VERSION_HISTORY[0].date}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
