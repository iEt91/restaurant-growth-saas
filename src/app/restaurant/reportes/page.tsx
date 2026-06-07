import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reportMetrics: Array<[string, string, string]> = [
  ["Reservas completadas", "318", "82%"],
  ["Cancelaciones", "22", "6%"],
  ["No-shows", "7", "2%"],
  ["Clientes nuevos", "84", "23%"],
  ["Clientes recurrentes", "204", "64%"],
  ["Ticket promedio", "$24.800", "+4%"],
];

const bestProducts: Array<[string, number]> = [
  ["Risotto de hongos", 124],
  ["Negroni de la casa", 112],
  ["Burrata con tomates asados", 97],
  ["Torta tibia de chocolate", 88],
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportMetrics.map(([label, value, hint]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                <Badge variant="success">{hint}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bestProducts.map(([label, value]) => (
              <div key={label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <span className="text-sm text-slate-500">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-950"
                    style={{ width: `${Math.max(38, Number(value))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lectura ejecutiva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
            <p>
              El restaurante mantiene una ocupación saludable con un ticket promedio
              en crecimiento y una tasa de no-show controlada.
            </p>
            <p>
              La próxima iteración podría sumar gráficos reales, pero el Sprint 1
              deja clara la jerarquía visual y los KPIs importantes.
            </p>
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Resumen
              </p>
              <p className="mt-2 text-2xl font-semibold">Operación estable</p>
              <p className="mt-2 text-sm text-slate-300">
                Reserva, sala y CRM listos para la siguiente capa de lógica.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
