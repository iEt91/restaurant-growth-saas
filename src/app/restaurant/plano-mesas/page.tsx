"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { tables } from "@/data/mock";
import type { RestaurantTable } from "@/types/domain";
import { cn } from "@/lib/utils";

const tableStateClasses: Record<RestaurantTable["status"], string> = {
  Libre: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Reservada: "border-sky-200 bg-sky-50 text-sky-800",
  Ocupada: "border-violet-200 bg-violet-50 text-violet-800",
  "Fuera de servicio": "border-slate-200 bg-slate-100 text-slate-500",
  "Próxima reserva": "border-amber-200 bg-amber-50 text-amber-800",
};

export default function FloorPlanPage() {
  const [selectedTable, setSelectedTable] = React.useState<RestaurantTable | null>(
    tables[1]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Plano operativo de mesas</CardTitle>
            <p className="text-sm text-slate-500">
              Vista de sala mockeada. No es un editor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Object.keys(tableStateClasses).map((state) => (
              <Badge key={state} variant="outline">
                {state}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid min-h-[540px] grid-cols-1 gap-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-4 sm:grid-cols-4 sm:grid-rows-2">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTable(table)}
                style={{
                  gridColumn: `${table.x + 1} / span ${table.w}`,
                  gridRow: `${table.y + 1} / span ${table.h}`,
                }}
                className={cn(
                  "group flex min-h-[140px] flex-col justify-between rounded-[28px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                  tableStateClasses[table.status]
                )}
              >
                <div>
                  <p className="text-sm font-medium">{table.name}</p>
                  <p className="mt-1 text-xs opacity-70">{table.area}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="border-white/50 bg-white/60">
                    {table.capacity} pax
                  </Badge>
                  <span className="text-xs font-medium opacity-80">
                    {table.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {["Ver reserva", "Agregar consumo", "Cambiar estado", "Cerrar mesa"].map(
            (action) => (
              <Button key={action} variant="outline" className="rounded-2xl">
                {action}
              </Button>
            )
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTable)} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-3xl">
          {selectedTable ? (
            <div className="space-y-6">
              <DialogHeader className="text-left">
                <Badge variant="secondary" className="w-fit">
                  {selectedTable.status}
                </Badge>
                <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  {selectedTable.name}
                </DialogTitle>
                <p className="text-sm text-slate-500">{selectedTable.area}</p>
              </DialogHeader>

              <div className="flex justify-end">
                <Button variant="outline" className="rounded-2xl">
                  Ver reserva
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["Cliente asociado", selectedTable.currentGuest ?? "Sin asignar"],
                  ["Cantidad de personas", String(selectedTable.capacity)],
                  ["Hora", selectedTable.reservationTime ?? "Sin horario"],
                  ["Visitas del cliente", selectedTable.customerVisits ? `${selectedTable.customerVisits}` : "0"],
                  ["Ticket promedio", selectedTable.averageTicket ? `$${selectedTable.averageTicket.toLocaleString("es-AR")}` : "—"],
                  ["Última visita", selectedTable.lastVisit ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <h4 className="text-sm font-semibold text-slate-950">Preferencias y alertas</h4>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preferencias</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedTable.preferences?.join(" · ") ?? "Sin preferencias registradas"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alergias</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedTable.allergies?.join(" · ") ?? "Sin alergias registradas"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" className="rounded-2xl">
                  Agregar consumo
                </Button>
                <Button variant="secondary" className="rounded-2xl">
                  Cambiar estado
                </Button>
                <Button className="rounded-2xl">Cerrar mesa</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
