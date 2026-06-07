import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { promotions, reservations, restaurantMetrics } from "@/data/mock";
import { StatCard } from "@/components/stat-card";
import { CalendarClock, Star, TriangleAlert } from "lucide-react";

export default function RestaurantDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {restaurantMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Últimas reservas</CardTitle>
              <p className="text-sm text-slate-500">
                Flujo operativo de hoy con estados mockeados.
              </p>
            </div>
            <Button className="rounded-2xl">Nueva reserva</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {reservations.slice(0, 4).map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-950">
                      {reservation.guestName}
                    </p>
                    {reservation.vip ? (
                      <Badge variant="warning">VIP</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {reservation.phone} · {reservation.channel} · {reservation.tableName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{reservation.status}</Badge>
                  <span className="text-sm font-medium text-slate-700">
                    {reservation.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-500" />
                Alertas de clientes VIP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "María Fernández pidió mesa tranquila y vino blanco.",
                "Paula Acosta suele llegar 10 minutos antes y prefiere mesa central.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                Próximos cumpleaños
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "María Fernández - 18 de julio",
                "Nicolás Suárez - 21 de julio",
                "Sofía Pereyra - 23 de julio",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">{item}</p>
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promociones vigentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-950">{promo.title}</p>
                    <Badge variant={promo.active ? "success" : "secondary"}>
                      {promo.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {promo.description}
                  </p>
                  <Separator className="my-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
