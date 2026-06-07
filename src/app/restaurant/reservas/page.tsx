import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reservations } from "@/data/mock";
import { CalendarDays, Plus, SlidersHorizontal } from "lucide-react";

const filters = [
  ["Todas", "28"],
  ["Pendientes", "4"],
  ["Confirmadas", "24"],
  ["Ocupadas", "10"],
  ["Completadas", "18"],
  ["Canceladas", "3"],
  ["No-show", "2"],
] as const;

const statusStyles: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Ocupada: "bg-violet-50 text-violet-700 border-violet-200",
  Completada: "bg-slate-100 text-slate-700 border-slate-200",
  Cancelada: "bg-rose-50 text-rose-700 border-rose-200",
  "No-show": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ReservationsPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reservas</CardTitle>
            <p className="text-sm text-slate-500">
              Tabla compacta con filtros y estados visibles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-2xl">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" className="rounded-2xl">
              <CalendarDays className="mr-2 h-4 w-4" />
              12 jun 2024
            </Button>
            <Button className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {filters.map(([label, value]) => (
              <button
                key={label}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  label === "Todas"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"
                }`}
              >
                {label} <span className="ml-1 text-xs opacity-70">{value}</span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Mesa</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="text-sm text-slate-700">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                      {reservation.time}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">{reservation.guestName}</div>
                      <div className="mt-1 text-xs text-slate-500">{reservation.phone}</div>
                    </td>
                    <td className="px-4 py-3">{reservation.partySize}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusStyles[reservation.status]}>
                        {reservation.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{reservation.tableName}</td>
                    <td className="px-4 py-3">{reservation.channel}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {Object.entries(statusStyles).map(([status, className]) => (
              <Badge key={status} variant="outline" className={className}>
                {status}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
