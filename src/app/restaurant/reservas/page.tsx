import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reservations } from "@/data/mock";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const statusStyles: Record<string, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmada: "bg-sky-50 text-sky-700 border-sky-200",
  Ocupada: "bg-violet-50 text-violet-700 border-violet-200",
  Completada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelada: "bg-rose-50 text-rose-700 border-rose-200",
  "No-show": "bg-slate-100 text-slate-600 border-slate-200",
};

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Calendario simple</CardTitle>
            <p className="text-sm text-slate-500">
              Vista semanal mockeada para entender la operación diaria.
            </p>
          </div>
          <Button className="rounded-2xl">Nueva reserva</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-7">
            {days.map((day) => (
              <div
                key={day}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-medium text-slate-600"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">
                    {reservation.guestName}
                  </p>
                  <Badge
                    variant="outline"
                    className={statusStyles[reservation.status]}
                  >
                    {reservation.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {reservation.time} · {reservation.partySize} personas
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Mesa {reservation.tableName} · {reservation.channel}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lista de reservas</CardTitle>
            <p className="text-sm text-slate-500">
              Los estados están listos para crecer hacia la lógica real.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-950">{reservation.guestName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {reservation.phone} · {reservation.notes ?? "Sin notas"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{reservation.date}</Badge>
                  <Badge variant="outline">{reservation.status}</Badge>
                  <Badge variant={reservation.vip ? "warning" : "secondary"}>
                    {reservation.vip ? "VIP" : "Normal"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estados disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusStyles).map(([status, className]) => (
              <div
                key={status}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${className}`}
              >
                <p className="text-sm font-medium">{status}</p>
                <Badge variant="outline" className="border-white/40 bg-white/60">
                  Mock
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
