"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import type { RestaurantTable } from "@/types/domain";
import { cn } from "@/lib/utils";

const tableStateClasses: Record<RestaurantTable["status"], string> = {
  Libre: "bg-emerald-500 text-white shadow-[0_12px_24px_rgba(22,163,74,0.22)]",
  Reservada: "bg-amber-400 text-slate-950 shadow-[0_12px_24px_rgba(202,138,4,0.22)]",
  Ocupada: "bg-rose-500 text-white shadow-[0_12px_24px_rgba(220,38,38,0.22)]",
  "Fuera de servicio": "bg-slate-400 text-white shadow-[0_12px_24px_rgba(100,116,139,0.22)]",
  "Próxima reserva": "bg-violet-500 text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)]",
};

const legend = [
  ["Libre", "bg-emerald-500"],
  ["Reservada", "bg-amber-400"],
  ["Ocupada", "bg-rose-500"],
  ["Fuera de servicio", "bg-slate-400"],
  ["Próxima reserva", "bg-violet-500"],
] as const;

const manualStatuses: RestaurantTable["status"][] = [
  "Libre",
  "Reservada",
  "Ocupada",
  "Fuera de servicio",
];

export default function FloorPlanPage() {
  const router = useRouter();
  const {
    tables,
    getActiveReservationForTable,
    updateTableStatus,
    openReservationDetail,
    standardReservationDurationMinutes,
  } = useRestaurantFlow();
  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(null);

  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? null;
  const activeReservation = selectedTable
    ? getActiveReservationForTable(selectedTable.name)
    : null;
  const getOccupiedMinutesRemaining = React.useCallback(
    (reservation: { occupiedMinutesElapsed?: number } | null) =>
      Math.max(
        standardReservationDurationMinutes - (reservation?.occupiedMinutesElapsed ?? 0),
        0
      ),
    [standardReservationDurationMinutes]
  );
  const selectedTableOccupiedMinutesRemaining = React.useMemo(() => {
    if (selectedTable?.status !== "Ocupada") {
      return null;
    }

    return getOccupiedMinutesRemaining(activeReservation);
  }, [activeReservation, getOccupiedMinutesRemaining, selectedTable?.status]);

  function handleOpenReservation() {
    if (!activeReservation) {
      return;
    }

    openReservationDetail(activeReservation.id);
    router.push("/restaurant/reservas");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.55fr]">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Plano de mesas</CardTitle>
            <p className="text-sm text-slate-500">
              Plano operativo dentro de una card, con estado por color.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-2xl">
              Editar Mapa
            </Button>
            <Button variant="outline" className="rounded-2xl">
              Unir Mesas
            </Button>
            <Button className="rounded-2xl">+ Nueva Mesa</Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid gap-5 xl:grid-cols-[180px_1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Estados</p>
                <div className="mt-4 space-y-3">
                  {legend.map(([label, color]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-sm text-slate-600"
                    >
                      <span className={cn("h-3 w-3 rounded-full", color)} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">Información</p>

                {selectedTable ? (
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-950">{selectedTable.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-fit whitespace-nowrap",
                          tableStateClasses[selectedTable.status]
                        )}
                      >
                        {selectedTable.status}
                      </Badge>
                    </div>
                    <p>
                      Capacidad:{" "}
                      <span className="text-slate-950">{selectedTable.capacity}</span>
                    </p>
                    <p>
                      Reserva activa:{" "}
                      <span className="text-slate-950">
                        {activeReservation ? `${activeReservation.firstName} ${activeReservation.lastName}` : "Sin reserva activa"}
                      </span>
                    </p>
                    {selectedTable.status === "Ocupada" ? (
                      <p>
                        Tiempo restante:{" "}
                        <span className="text-slate-950">
                          {selectedTableOccupiedMinutesRemaining} min restantes
                        </span>
                      </p>
                    ) : null}
                    {activeReservation ? (
                      <>
                        <p>
                          Hora:{" "}
                          <span className="text-slate-950">{activeReservation.time}</span>
                        </p>
                        <p>
                          Personas:{" "}
                          <span className="text-slate-950">{activeReservation.partySize}</span>
                        </p>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Seleccioná una mesa.</p>
                )}

                <Button variant="outline" className="mt-4 w-full rounded-2xl">
                  Ver detalle
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#d9c3a2,#b68b63)] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
              <div className="relative min-h-[620px] overflow-hidden rounded-[24px] border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#d2b28a,#b68556)] p-4">
                <div className="absolute left-3 top-3 grid h-[calc(100%-1.5rem)] w-14 grid-rows-4 gap-3 rounded-3xl bg-black/20 p-2">
                  {["Bar", "Caja", "WC", "Acceso"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[10px] font-semibold text-white/90"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="ml-20 grid h-full grid-cols-4 grid-rows-2 gap-4">
                  {tables.map((table) => (
                    (() => {
                      const tableReservation = getActiveReservationForTable(table.name);
                      const tableOccupiedMinutesRemaining =
                        table.status === "Ocupada"
                          ? getOccupiedMinutesRemaining(tableReservation)
                          : null;

                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => setSelectedTableId(table.id)}
                          className={cn(
                            "flex min-h-[120px] flex-col justify-between rounded-[22px] border border-white/20 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:scale-[1.01]",
                            tableStateClasses[table.status]
                          )}
                          style={{
                            gridColumn: `span ${table.w}`,
                            gridRow: `span ${table.h}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{table.name}</span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
                              {table.capacity}p
                            </span>
                          </div>
                          <div className="text-xs opacity-90">{table.status}</div>
                          {table.status === "Ocupada" ? (
                            <div className="mt-1 text-[11px] font-medium opacity-90">
                              {tableOccupiedMinutesRemaining} min restantes
                            </div>
                          ) : null}
                        </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-6 xl:h-fit">
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start rounded-2xl"
            onClick={handleOpenReservation}
            disabled={!activeReservation}
          >
            Ver reserva
          </Button>

          <Button variant="outline" className="w-full justify-start rounded-2xl">
            Agregar consumo
          </Button>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Cambiar estado manual
            </p>
            <div className="grid grid-cols-2 gap-2">
              {manualStatuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={selectedTable?.status === status ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => {
                    if (!selectedTable) return;
                    updateTableStatus(selectedTable.id, status);
                  }}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTable)} onOpenChange={(open) => !open && setSelectedTableId(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTable ? (
            <div className="space-y-5">
              <DialogHeader>
                <Badge variant="secondary" className="w-fit">
                  {selectedTable.status}
                </Badge>
                <DialogTitle className="text-2xl font-semibold text-slate-950">
                  {selectedTable.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Vista operativa de la mesa con detalles del cliente y acciones disponibles.
                </DialogDescription>
              </DialogHeader>

              {activeReservation ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Mesa", selectedTable.name],
                      ["Estado de mesa", selectedTable.status],
                      [
                        "Cliente asociado",
                        `${activeReservation.firstName} ${activeReservation.lastName}`,
                      ],
                      ["Reserva asociada", activeReservation.date],
                      ["Hora", activeReservation.time],
                      ["Personas", String(activeReservation.partySize)],
                      ["Estado de reserva", activeReservation.status],
                      [
                        "Ticket promedio",
                        selectedTable.averageTicket
                          ? `$${selectedTable.averageTicket.toLocaleString("es-AR")}`
                          : "—",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-950">Preferencias</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {activeReservation.preferences || "Sin preferencias registradas"}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-950">Alergias</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {activeReservation.allergies || "Sin alergias registradas"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Mesa
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{selectedTable.name}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Estado
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {selectedTable.status}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Capacidad
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {selectedTable.capacity} personas
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Reserva
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      Sin reserva activa
                    </p>
                  </div>
                </div>
              )}

              {selectedTable.status === "Ocupada" ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-rose-500">
                    Tiempo restante
                  </p>
                  <p className="mt-2 text-lg font-semibold text-rose-600">
                    {selectedTableOccupiedMinutesRemaining} min restantes
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleOpenReservation}
                  disabled={!activeReservation}
                >
                  Ver reserva
                </Button>
                <Button variant="outline" className="rounded-2xl">
                  Agregar consumo
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!selectedTable) return;
                    updateTableStatus(selectedTable.id, "Libre");
                  }}
                >
                  Cambiar a libre
                </Button>
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    if (!selectedTable) return;
                    updateTableStatus(selectedTable.id, "Ocupada");
                  }}
                >
                  Cerrar mesa
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
