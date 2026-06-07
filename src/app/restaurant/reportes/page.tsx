import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const reportMetrics: Array<[string, string, string]> = [
  ["Reservas completadas", "318", "+82%"],
  ["Cancelaciones", "22", "6%"],
  ["No-shows", "7", "2%"],
  ["Clientes nuevos", "84", "+23%"],
  ["Clientes recurrentes", "204", "64%"],
  ["Ticket promedio", "$24.800", "+4%"],
];

const bestProducts: Array<[string, number]> = [
  ["Bife de chorizo", 148],
  ["Ravioles", 93],
  ["Milanesa napolitana", 81],
  ["Ojo de bife", 75],
  ["Provoleta", 62],
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reportes</CardTitle>
            <p className="text-sm text-slate-500">
              KPIs arriba, tabs de analisis y un cierre ejecutivo claro.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Junio 2024</Badge>
            <Button className="rounded-2xl">Descargar PDF</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {reportMetrics.map(([label, value, hint]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-3xl font-semibold text-slate-950">{value}</p>
                  <Badge variant="success">{hint}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-[24px] bg-white p-2 shadow-sm">
          {["resumen", "comensales", "ventas", "platos", "bebidas", "clientes", "reservas"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="rounded-2xl px-4 py-2">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="mt-5">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Comensales por dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="grid items-end gap-1 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
                >
                  {Array.from({ length: 30 }, (_, index) => (
                    <div
                      key={index}
                      className="rounded-t-md bg-slate-950/80"
                      style={{ height: `${20 + ((index * 7) % 52)}px` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top platos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestProducts.map(([label, value], index) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">{index + 1}. {label}</p>
                      <p className="mt-1 text-xs text-slate-500">Cantidad vendida</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comensales" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de comensales</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Vista preparada para analisis de afluencia por franja horaria.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventas" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Ventas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Vista preparada para ticket promedio, conversion y mix de ventas.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platos" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Platos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Listado por plato y categoria con ranking de rotacion.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bebidas" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Bebidas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Vista para bebidas mas vendidas y margen por categoria.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Segmentacion de nuevos, recurrentes y VIPs.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Reservas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Tasa de asistencia, cancelacion y no-show lista para evolucionar.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
