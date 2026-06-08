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
import { RestaurantConsumptionModal } from "@/components/restaurant-consumption-modal";
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

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export default function FloorPlanPage() {
  const router = useRouter();
  const {
    tables,
    getActiveReservationForTable,
    getConsumptionItemsForReservation,
    updateTableStatus,
    saveConsumptionItems,
    openReservationDetail,
    standardReservationDurationMinutes,
  } = useRestaurantFlow();
  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(null);
  const [detailTableId, setDetailTableId] = React.useState<string | null>(null);
  const [isTableDetailOpen, setIsTableDetailOpen] = React.useState(false);
  const [isConsumptionOpen, setIsConsumptionOpen] = React.useState(false);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedTableReservation = selectedTable
    ? getActiveReservationForTable(selectedTable.name)
    : null;
  const selectedTableReservationId = selectedTableReservation?.id ?? null;
  const activeConsumptionItems = React.useMemo(
    () => getConsumptionItemsForReservation(selectedTableReservationId),
    [getConsumptionItemsForReservation, selectedTableReservationId]
  );
  const activeConsumptionTotal = React.useMemo(
    () => activeConsumptionItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [activeConsumptionItems]
  );
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

    return getOccupiedMinutesRemaining(selectedTableReservation);
  }, [getOccupiedMinutesRemaining, selectedTable?.status, selectedTableReservation]);

  const detailTable = tables.find((table) => table.id === detailTableId) ?? null;
  const detailReservation = detailTable ? getActiveReservationForTable(detailTable.name) : null;
  const detailReservationId = detailReservation?.id ?? null;
  const detailConsumptionItems = React.useMemo(
    () => getConsumptionItemsForReservation(detailReservationId),
    [detailReservationId, getConsumptionItemsForReservation]
  );
  const detailConsumptionTotal = React.useMemo(
    () => detailConsumptionItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [detailConsumptionItems]
  );
  const detailOccupiedMinutesRemaining = React.useMemo(() => {
    if (detailTable?.status !== "Ocupada") {
      return null;
    }

    return getOccupiedMinutesRemaining(detailReservation);
  }, [detailReservation, detailTable?.status, getOccupiedMinutesRemaining]);

  function handleOpenReservation() {
    if (!selectedTableReservation) {
      return;
    }

    openReservationDetail(selectedTableReservation.id);
    router.push("/restaurant/reservas");
  }

  function handleOpenConsumption() {
    if (
      !selectedTable ||
      selectedTable.status !== "Ocupada" ||
      !selectedTableReservation
    ) {
      return;
    }

    setIsConsumptionOpen(true);
  }

  function handleSelectTable(tableId: string) {
    setSelectedTableId(tableId);
  }

  function handleOpenTableDetail(tableId: string) {
    setSelectedTableId(tableId);
    setDetailTableId(tableId);
    setIsTableDetailOpen(true);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:items-start">
      <Card className="xl:sticky xl:top-6 xl:h-fit">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Acciones rápidas</CardTitle>
          <p className="text-sm text-slate-500">
            Operación directa sobre la mesa seleccionada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start rounded-2xl"
            onClick={handleOpenReservation}
            disabled={!selectedTableReservation}
            title={
              !selectedTableReservation ? "No hay una reserva activa para ver." : undefined
            }
          >
            Ver reserva
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start rounded-2xl"
            onClick={handleOpenConsumption}
            disabled={selectedTable?.status !== "Ocupada" || !selectedTableReservation}
            title={
              selectedTable?.status !== "Ocupada"
                ? "Solo se puede cargar consumo en mesas ocupadas."
                : undefined
            }
          >
            Agregar consumo
          </Button>
          {selectedTable?.status !== "Ocupada" ? (
            <p className="text-xs text-slate-400">
              Solo se puede cargar consumo en mesas ocupadas.
            </p>
          ) : null}

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

        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {legend.map(([label, color]) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
                {label}
              </div>
            ))}
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
                {tables.map((table) => {
                  const tableReservation = getActiveReservationForTable(table.name);
                  const tableOccupiedMinutesRemaining =
                    table.status === "Ocupada"
                      ? getOccupiedMinutesRemaining(tableReservation)
                      : null;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleSelectTable(table.id)}
                      onDoubleClick={() => handleOpenTableDetail(table.id)}
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
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-6 xl:h-fit">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Información</CardTitle>
          <p className="text-sm text-slate-500">
            Detalle completo de la mesa seleccionada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {!selectedTable ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-base font-semibold text-slate-950">Seleccioná una mesa</p>
              <p className="mt-2 text-sm text-slate-500">
                Al elegir una mesa del plano vas a ver aquí el detalle operativo, la reserva
                asociada y los consumos cargados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Mesa</p>
                  <p className="mt-2 text-sm font-medium text-slate-950">{selectedTable.name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Estado actual
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2 w-fit whitespace-nowrap",
                      tableStateClasses[selectedTable.status]
                    )}
                  >
                    {selectedTable.status}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Capacidad
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedTable.capacity} personas
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Tiempo restante
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedTable.status === "Ocupada" &&
                    selectedTableOccupiedMinutesRemaining !== null
                      ? `${selectedTableOccupiedMinutesRemaining} min restantes`
                      : "No disponible"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Reserva asociada
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-950">
                    {selectedTableReservation
                      ? `${selectedTableReservation.firstName} ${selectedTableReservation.lastName}`
                      : "Sin reserva activa"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Cliente asociado
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {selectedTableReservation
                        ? `${selectedTableReservation.firstName} ${selectedTableReservation.lastName}`
                        : "Sin cliente asociado"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Estado de reserva
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {selectedTableReservation?.status ?? "Sin reserva activa"}
                    </p>
                  </div>
                </div>

                {selectedTableReservation ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Hora
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {selectedTableReservation.time}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Personas
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {selectedTableReservation.partySize}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Consumos
                    </p>
                    <span className="text-xs text-slate-400">
                      {activeConsumptionItems.length} items
                    </span>
                  </div>
                  {activeConsumptionItems.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {activeConsumptionItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-950">
                              {item.quantity}x {item.productName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatMoney(item.unitPrice)} c/u
                            </p>
                          </div>
                          <p className="font-medium text-slate-950">
                            {formatMoney(item.lineTotal)}
                          </p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold text-slate-950">
                          {formatMoney(activeConsumptionTotal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Sin consumos cargados.</p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => {
                  if (!selectedTable) return;
                  handleOpenTableDetail(selectedTable.id);
                }}
              >
                Ver detalle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isTableDetailOpen && Boolean(detailTable)}
        onOpenChange={(open) => {
          if (!open) {
            setIsTableDetailOpen(false);
            setDetailTableId(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {detailTable ? (
            <div className="space-y-5">
              <DialogHeader>
                <Badge variant="secondary" className="w-fit">
                  {detailTable.status}
                </Badge>
                <DialogTitle className="text-2xl font-semibold text-slate-950">
                  {detailTable.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Vista operativa de la mesa con detalles del cliente y acciones disponibles.
                </DialogDescription>
              </DialogHeader>

              {detailReservation ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Mesa", detailTable.name],
                      ["Estado de mesa", detailTable.status],
                      [
                        "Cliente asociado",
                        `${detailReservation.firstName} ${detailReservation.lastName}`,
                      ],
                      ["Reserva asociada", detailReservation.date],
                      ["Hora", detailReservation.time],
                      ["Personas", String(detailReservation.partySize)],
                      ["Estado de reserva", detailReservation.status],
                      [
                        "Ticket promedio",
                        detailTable.averageTicket
                          ? `$${detailTable.averageTicket.toLocaleString("es-AR")}`
                          : "—",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-3xl border border-slate-200 p-4">
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
                        {detailReservation.preferences || "Sin preferencias registradas"}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-950">Alergias</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {detailReservation.allergies || "Sin alergias registradas"}
                      </p>
                    </div>
                  </div>

                  {detailConsumptionItems.length > 0 ? (
                    <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-violet-600">
                        Consumo registrado
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {detailConsumptionItems.length} items cargados
                      </p>
                      <p className="text-sm text-slate-600">
                        Total estimado: {formatMoney(detailConsumptionTotal)}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Mesa
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{detailTable.name}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Estado
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {detailTable.status}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Capacidad
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      {detailTable.capacity} personas
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

              {detailTable.status === "Ocupada" ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-rose-500">
                    Tiempo restante
                  </p>
                  <p className="mt-2 text-lg font-semibold text-rose-600">
                    {detailOccupiedMinutesRemaining} min restantes
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleOpenReservation}
                  disabled={!detailReservation}
                >
                  Ver reserva
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleOpenConsumption}
                  disabled={detailTable.status !== "Ocupada" || !detailReservation}
                  title={
                    detailTable.status !== "Ocupada"
                      ? "Solo se puede cargar consumo en mesas ocupadas."
                      : undefined
                  }
                >
                  Agregar consumo
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => {
                    if (!detailTable) return;
                    updateTableStatus(detailTable.id, "Libre");
                  }}
                >
                  Cambiar a libre
                </Button>
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    if (!detailTable) return;
                    updateTableStatus(detailTable.id, "Ocupada");
                  }}
                >
                  Cerrar mesa
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <RestaurantConsumptionModal
        key={`${selectedTableReservation?.id ?? "no-reservation"}-${
          isConsumptionOpen ? "open" : "closed"
        }`}
        open={isConsumptionOpen}
        onOpenChange={setIsConsumptionOpen}
        reservationId={selectedTableReservation?.id ?? null}
        tableName={selectedTable?.name ?? ""}
        clientName={
          selectedTableReservation
            ? `${selectedTableReservation.firstName} ${selectedTableReservation.lastName}`
            : ""
        }
        tableStatus={selectedTable?.status ?? "Libre"}
        timeRemainingMinutes={
          selectedTable?.status === "Ocupada" ? selectedTableOccupiedMinutesRemaining : null
        }
        existingItems={activeConsumptionItems}
        onSave={(items) => {
          if (!selectedTableReservation) {
            return;
          }

          saveConsumptionItems(selectedTableReservation.id, items);
        }}
      />
    </div>
  );
}
