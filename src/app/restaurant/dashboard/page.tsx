import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { promotions, reservations, restaurantMetrics } from "@/data/mock";
import { StatCard } from "@/components/stat-card";
import { CalendarClock, TriangleAlert } from "lucide-react";

const hourlySlots = [
  ["12:00", 3],
  ["13:00", 7],
  ["14:00", 5],
  ["20:00", 12],
  ["21:00", 9],
  ["22:00", 8],
  ["23:00", 4],
] as const;

export default function RestaurantDashboardPage() {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {restaurantMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr_0.75fr]">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle>Resumen del dia</CardTitle>
              <p className="text-sm text-slate-500">
                Reservas, ocupacion y ritmo de servicio en una sola vista.
              </p>
            </div>
            <Button className="rounded-2xl">Nueva reserva</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Check-ins", "28", "+12%"],
                ["Mesas activas", "18", "72%"],
                ["Ticket medio", "$24.800", "+4%"],
                ["Promos", "2", "vigentes"],
              ].map(([label, value, hint]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-slate-950">{value}</p>
                    <Badge variant="secondary">{hint}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Reservas por horario</p>
                    <p className="text-xs text-slate-500">Pico de noche y arranque de mediodia</p>
                  </div>
                  <Badge variant="outline">Hoy</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {hourlySlots.map(([hour, amount]) => (
                    <div key={hour} className="grid grid-cols-[72px_1fr_32px] items-center gap-3">
                      <p className="text-sm font-medium text-slate-600">{hour}</p>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-950"
                          style={{ width: `${amount * 8}%` }}
                        />
                      </div>
                      <p className="text-right text-sm text-slate-500">{amount}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Cumpleanos hoy</p>
                    <p className="text-xs text-slate-500">Clientes a saludar en el servicio</p>
                  </div>
                  <Badge variant="warning">4</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "María Fernández - VIP",
                    "Santiago Varela",
                    "Paula Acosta",
                    "Sofía Pereyra",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-500" />
                Alertas VIP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Maria Fernandez prefiere mesa tranquila y vino blanco.
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Paula Acosta suele llegar 10 minutos antes y evita lacteos.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promociones vigentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {promotions.map((promo) => (
                <div key={promo.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-950">{promo.title}</p>
                    <Badge variant={promo.active ? "success" : "secondary"}>
                      {promo.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{promo.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                Ultimas reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservations.slice(0, 4).map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-950">{reservation.guestName}</p>
                    <Badge variant="outline">{reservation.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {reservation.time} - {reservation.tableName} - {reservation.channel}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
