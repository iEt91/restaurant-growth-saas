"use client";

import * as React from "react";
import { APP_VERSION, VERSION_HISTORY } from "@/config/version";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sections = [
  "Restaurante",
  "Sucursales",
  "Horarios",
  "Reservas",
  "Plano",
  "Menu",
  "Usuarios",
  "Pagina inicial",
] as const;

const hours = [
  ["Lunes", "12:00 - 00:00", true],
  ["Martes", "12:00 - 00:00", true],
  ["Miercoles", "12:00 - 00:00", true],
  ["Jueves", "12:00 - 00:00", true],
  ["Viernes", "12:00 - 01:00", true],
  ["Sabado", "12:00 - 01:00", true],
  ["Domingo", "12:00 - 23:00", true],
] as const;

export default function SettingsPage() {
  const [autoConfirm, setAutoConfirm] = React.useState(true);
  const [waitlist, setWaitlist] = React.useState(true);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Configuracion</CardTitle>
          <p className="text-sm text-slate-500">
            Tabs horizontales y layout dividido entre horas y reservas.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="Reservas">
            <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-2 rounded-[24px] bg-slate-100 p-2">
              {sections.map((section) => (
                <TabsTrigger key={section} value={section} className="rounded-2xl px-4 py-2">
                  {section}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Horarios">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Horarios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {hours.map(([day, range]) => (
                      <div key={day} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="font-medium text-slate-950">{day}</p>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                          {range}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuracion de reservas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">Confirmar automaticamente</p>
                        <p className="text-sm text-slate-500">Si hay disponibilidad</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">Permitir lista de espera</p>
                        <p className="text-sm text-slate-500">Para horarios completos</p>
                      </div>
                      <Switch checked={waitlist} onCheckedChange={setWaitlist} />
                    </div>

                    <div className="space-y-2">
                      <Label>Duracion estandar de reserva</Label>
                      <Input defaultValue="90 minutos" />
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalo entre reservas</Label>
                      <Input defaultValue="15 minutos" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="Reservas">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuracion general</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Vista base lista para seguir creciendo con reglas reales.
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">Confirmar automaticamente</p>
                        <p className="text-sm text-slate-500">Si hay disponibilidad</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">Permitir lista de espera</p>
                        <p className="text-sm text-slate-500">Para horarios completos</p>
                      </div>
                      <Switch checked={waitlist} onCheckedChange={setWaitlist} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {sections
              .filter((section) => section !== "Horarios" && section !== "Reservas")
              .map((section) => (
                <TabsContent key={section} value={section}>
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-500">
                      Seccion {section} lista para seguir creciendo en Sprint 2.
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
          </Tabs>

          <Separator className="my-5" />

          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                Version
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {APP_VERSION}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {VERSION_HISTORY[0].notes[0]}
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Ultima actualizacion: {VERSION_HISTORY[0].date}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
