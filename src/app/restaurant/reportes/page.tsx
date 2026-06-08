"use client";

import * as React from "react";
import {
  BarChart3,
  Download,
  FileDown,
  PieChart,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import { cn } from "@/lib/utils";
import {
  buildReportAnalytics,
  getReportReferenceDate,
  type ReportAnalytics,
  type ReportPeriod,
} from "@/lib/report-analytics";

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "Hoy", label: "Hoy" },
  { value: "Semana", label: "Semana" },
  { value: "Mes", label: "Mes" },
  { value: "Personalizado", label: "Personalizado" },
];

const TAB_OPTIONS = [
  { value: "resumen", label: "Resumen" },
  { value: "comensales", label: "Comensales" },
  { value: "ventas", label: "Ventas" },
  { value: "platos", label: "Platos" },
  { value: "bebidas", label: "Bebidas" },
  { value: "clientes", label: "Clientes" },
  { value: "reservas", label: "Reservas" },
] as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function csvEscape(value: string) {
  if (/[;\n"]/g.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildCsvPayload(analytics: ReportAnalytics) {
  const rows: string[][] = [
    ["Seccion", "Campo", "Valor"],
    ["Resumen", "Periodo", analytics.selectedLabel],
    ["Ventas", "Ventas totales", String(analytics.salesTotal)],
    ["Ventas", "Ventas hoy", String(analytics.comparisonSales.today)],
    ["Ventas", "Ventas semana", String(analytics.comparisonSales.week)],
    ["Ventas", "Ventas mes", String(analytics.comparisonSales.month)],
    ["Reservas", "Total", String(analytics.reservationCounts.total)],
    ["Reservas", "Completadas", String(analytics.reservationCounts.completed)],
    ["Reservas", "Canceladas", String(analytics.reservationCounts.cancelled)],
    ["Reservas", "No-show", String(analytics.reservationCounts.noShow)],
    ["Ocupacion", "Mesas ocupadas", String(analytics.occupancy.occupied)],
    ["Ocupacion", "Mesas libres", String(analytics.occupancy.free)],
    ["Ocupacion", "Porcentaje", String(analytics.occupancy.percentage)],
    ["Clientes", "Total", String(analytics.customers.total)],
    ["Clientes", "Nuevos", String(analytics.customers.newCustomers)],
    ["Clientes", "Recurrentes", String(analytics.customers.recurrentCustomers)],
    ["Clientes", "Ticket promedio", String(analytics.customers.averageTicket)],
  ];

  for (const product of analytics.topProducts) {
    rows.push([
      "Productos",
      product.productName,
      `${product.quantity} unidades / ${formatMoney(product.revenue)}`,
    ]);
  }

  for (const channel of analytics.channelBreakdown) {
    rows.push([
      "Canales",
      channel.channel,
      `${channel.count} reservas (${channel.percentage}%)`,
    ]);
  }

  return rows
    .map((row) => row.map((cell) => csvEscape(cell)).join(";"))
    .join("\n");
}

function buildPrintHtml(analytics: ReportAnalytics) {
  const topProductsRows = analytics.topProducts
    .map(
      (product, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${product.productName}</td>
          <td>${product.category}</td>
          <td>${product.quantity}</td>
          <td>${formatMoney(product.revenue)}</td>
        </tr>
      `
    )
    .join("");

  const channelRows = analytics.channelBreakdown
    .map(
      (channel) => `
        <tr>
          <td>${channel.channel}</td>
          <td>${channel.count}</td>
          <td>${channel.percentage}%</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            margin: 32px;
            background: white;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          .badge {
            display: inline-block;
            padding: 6px 10px;
            border-radius: 999px;
            background: #eef2ff;
            color: #4338ca;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 16px;
          }
          .metric {
            font-size: 28px;
            font-weight: 700;
            margin-top: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          th {
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 11px;
          }
          .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="badge">Reporte funcional</div>
            <h1>Dashboard de reportes</h1>
            <p>${analytics.selectedLabel}</p>
          </div>
          <div>
            <h3>Ventas totales</h3>
            <div class="metric">${formatMoney(analytics.salesTotal)}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Resumen de reservas</h3>
            <p>Total: ${analytics.reservationCounts.total}</p>
            <p>Completadas: ${analytics.reservationCounts.completed}</p>
            <p>Canceladas: ${analytics.reservationCounts.cancelled}</p>
            <p>No-show: ${analytics.reservationCounts.noShow}</p>
          </div>
          <div class="card">
            <h3>Ocupacion</h3>
            <p>Ocupadas: ${analytics.occupancy.occupied}</p>
            <p>Libres: ${analytics.occupancy.free}</p>
            <p>Porcentaje: ${analytics.occupancy.percentage}%</p>
          </div>
        </div>

        <div class="card">
          <h3>Top productos</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Categoria</th>
                <th>Cantidad</th>
                <th>Facturacion</th>
              </tr>
            </thead>
            <tbody>
              ${topProductsRows}
            </tbody>
          </table>
        </div>

        <div class="card" style="margin-top: 16px;">
          <h3>Canales de reserva</h3>
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              ${channelRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generado desde datos mock locales. Sin conexiÃ³n a Supabase.
        </div>
      </body>
    </html>
  `;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  variant = "secondary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <Card className="rounded-[28px]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {value}
              </p>
            </div>
          </div>
          <Badge variant={variant} className="rounded-full px-2.5 py-1 text-[11px]">
            {hint}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  extra,
}: {
  title: string;
  description: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {extra}
    </div>
  );
}

function TrendCard({
  title,
  description,
  rows,
  valueKey,
  valueFormatter,
  emptyMessage,
  toneClassName,
}: {
  title: string;
  description: string;
  rows: ReportAnalytics["salesByDay"];
  valueKey: "sales" | "reservations";
  valueFormatter: (value: number) => string;
  emptyMessage: string;
  toneClassName: string;
}) {
  const maxValue = Math.max(...rows.map((row) => row[valueKey]), 1);

  return (
    <Card className="rounded-[28px]">
      <CardHeader className="border-b border-slate-100 pb-4">
        <SectionHeader title={title} description={description} />
      </CardHeader>
      <CardContent className="pt-5">
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex min-w-full items-end gap-2">
              {rows.map((row) => {
                const barHeight = Math.max(10, Math.round((row[valueKey] / maxValue) * 180));

                return (
                  <div key={row.date} className="flex min-w-[56px] flex-1 flex-col items-center gap-2">
                    <div className="flex h-[200px] items-end">
                      <div
                        className={cn("w-full rounded-t-2xl shadow-sm", toneClassName)}
                        style={{ height: `${barHeight}px` }}
                        title={`${row.label}: ${valueFormatter(row[valueKey])}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-700">{row.label}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{valueFormatter(row[valueKey])}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownList({
  title,
  description,
  rows,
  emptyMessage,
  tone = "slate",
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: number; hint?: string }>;
  emptyMessage: string;
  tone?: "slate" | "violet" | "emerald" | "amber" | "rose";
}) {
  const toneClassName =
    tone === "violet"
      ? "bg-violet-500"
      : tone === "emerald"
        ? "bg-emerald-500"
        : tone === "amber"
          ? "bg-amber-400"
          : tone === "rose"
            ? "bg-rose-500"
            : "bg-slate-950";

  return (
    <Card className="rounded-[28px]">
      <CardHeader className="border-b border-slate-100 pb-4">
        <SectionHeader title={title} description={description} />
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        {rows.length > 0 ? (
          rows.map((row, index) => {
            const maxValue = Math.max(...rows.map((item) => item.value), 1);
            const percentage = Math.round((row.value / maxValue) * 100);

            return (
              <div key={row.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {index + 1}. {row.label}
                    </p>
                    {row.hint ? <p className="mt-1 text-xs text-slate-500">{row.hint}</p> : null}
                  </div>
                  <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
                    {row.value}
                  </Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full", toneClassName)} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const { reservations, customers, tables, menuItems } = useRestaurantFlow();
  const referenceDate = React.useMemo(
    () => getReportReferenceDate(reservations),
    [reservations]
  );
  const [period, setPeriod] = React.useState<ReportPeriod>("Mes");
  const [customRange, setCustomRange] = React.useState({
    from: referenceDate,
    to: referenceDate,
  });

  const analytics = React.useMemo(
    () =>
      buildReportAnalytics({
        reservations,
        customers,
        tables,
        menuItems,
        period,
        customRange,
      }),
    [reservations, customers, tables, menuItems, period, customRange]
  );

  const rankingCustomers = React.useMemo(
    () =>
      [...customers]
        .sort((left, right) => {
          if (right.visits !== left.visits) {
            return right.visits - left.visits;
          }

          if (right.totalSpent !== left.totalSpent) {
            return right.totalSpent - left.totalSpent;
          }

          return left.fullName.localeCompare(right.fullName);
        })
        .slice(0, 5),
    [customers]
  );

  const handleExportCsv = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const csv = buildCsvPayload(analytics);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `reporte-reportes-${analytics.referenceDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [analytics]);

  const handleExportPdf = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previewWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");

    if (!previewWindow) {
      return;
    }

    previewWindow.document.write(buildPrintHtml(analytics));
    previewWindow.document.close();
    previewWindow.focus();
    setTimeout(() => previewWindow.print(), 250);
  }, [analytics]);

  const periodButtons = (
    <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {PERIOD_OPTIONS.map((option) => {
        const isActive = period === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-4",
              isActive
                ? "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );

  const summaryCards = [
    {
      icon: Wallet,
      label: "Ventas totales",
      value: formatMoney(analytics.salesTotal),
      hint: `Periodo ${analytics.selectedLabel}`,
      variant: "success" as const,
    },
    {
      icon: TrendingUp,
      label: "Ventas hoy",
      value: formatMoney(analytics.comparisonSales.today),
      hint: analytics.referenceDate,
      variant: "info" as const,
    },
    {
      icon: BarChart3,
      label: "Ventas semana",
      value: formatMoney(analytics.comparisonSales.week),
      hint: "Ultimos 7 dias",
      variant: "secondary" as const,
    },
    {
      icon: FileDown,
      label: "Ventas mes",
      value: formatMoney(analytics.comparisonSales.month),
      hint: "Mes actual",
      variant: "outline" as const,
    },
  ];

  const reservationCards = [
    {
      icon: PieChart,
      label: "Reservas totales",
      value: String(analytics.reservationCounts.total),
      hint: "En el periodo",
      variant: "secondary" as const,
    },
    {
      icon: Users2,
      label: "Completadas",
      value: String(analytics.reservationCounts.completed),
      hint: "Cerradas con exito",
      variant: "success" as const,
    },
    {
      icon: Users2,
      label: "Canceladas",
      value: String(analytics.reservationCounts.cancelled),
      hint: "Operacion local",
      variant: "warning" as const,
    },
    {
      icon: Users2,
      label: "No-show",
      value: String(analytics.reservationCounts.noShow),
      hint: "Ausencias registradas",
      variant: "danger" as const,
    },
  ];

  const customerCards = [
    {
      icon: Users2,
      label: "Clientes totales",
      value: String(analytics.customers.total),
      hint: "Base actual",
      variant: "secondary" as const,
    },
    {
      icon: Users2,
      label: "Clientes nuevos",
      value: String(analytics.customers.newCustomers),
      hint: "Primeras visitas",
      variant: "info" as const,
    },
    {
      icon: Users2,
      label: "Clientes recurrentes",
      value: String(analytics.customers.recurrentCustomers),
      hint: "Visitan mas de una vez",
      variant: "success" as const,
    },
    {
      icon: Wallet,
      label: "Ticket promedio",
      value: formatMoney(analytics.customers.averageTicket),
      hint: "Reservas completadas",
      variant: "outline" as const,
    },
    {
      icon: TrendingUp,
      label: "VIP",
      value: String(analytics.customers.vipCustomers),
      hint: "Clientes de alto valor",
      variant: "info" as const,
    },
    {
      icon: Users2,
      label: "Frecuentes",
      value: String(analytics.customers.frequentCustomers),
      hint: "5+ visitas",
      variant: "secondary" as const,
    },
  ];

  const occupancyRows = [
    { label: "Mesas ocupadas", value: analytics.occupancy.occupied, hint: "Estado actual" },
    { label: "Mesas libres", value: analytics.occupancy.free, hint: "Listas para asignar" },
    { label: "Mesas reservadas", value: analytics.occupancy.reserved, hint: "Bloqueadas por reserva" },
    {
      label: "Proxima reserva",
      value: analytics.occupancy.nextReservation,
      hint: "Marcadas visualmente",
    },
    {
      label: "Fuera de servicio",
      value: analytics.occupancy.outOfService,
      hint: "No operativas",
    },
  ];

  const topProductRows = analytics.topProducts.slice(0, 5).map((product) => ({
    label: product.productName,
    value: product.quantity,
    hint: `${product.category} · ${formatMoney(product.revenue)}`,
  }));

  const beverageRows = analytics.beverageProducts.slice(0, 5).map((product) => ({
    label: product.productName,
    value: product.quantity,
    hint: `${product.category} · ${formatMoney(product.revenue)}`,
  }));

  const foodRows = analytics.topProducts
    .filter((product) => ["Entradas", "Principales", "Postres"].includes(product.category))
    .slice(0, 5)
    .map((product) => ({
      label: product.productName,
      value: product.quantity,
      hint: `${product.category} · ${formatMoney(product.revenue)}`,
    }));

  const channelRows = analytics.channelBreakdown.map((channel) => ({
    label: channel.channel,
    value: channel.count,
    hint: `${channel.percentage}% de las reservas`,
  }));

  const statusRows = analytics.statusBreakdown.map((status) => ({
    label: status.status,
    value: status.count,
    hint: `${status.percentage}% del total del periodo`,
  }));

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px]">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Reportes funcionales
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Periodo: {analytics.selectedLabel}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Datos mock locales
              </Badge>
            </div>
            <CardTitle className="text-3xl tracking-tight">Reporte ejecutivo</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Medimos ventas, reservas, ocupacion, clientes, productos y canales usando solo
              el estado local ya disponible en la app.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            {periodButtons}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button className="rounded-xl" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {period === "Personalizado" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-from">Desde</Label>
                <Input
                  id="report-from"
                  type="date"
                  value={customRange.from}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-to">Hasta</Label>
                <Input
                  id="report-to"
                  type="date"
                  value={customRange.to}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <SectionHeader
              title="Resumen general"
              description="Ventas y reservas calculadas sobre el rango seleccionado."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reservationCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Ocupacion"
                  description="Estado actual de las mesas sin tocar Supabase."
                  extra={
                    <Badge variant="info" className="rounded-full px-3 py-1">
                      {formatPercent(analytics.occupancy.percentage)} ocupacion
                    </Badge>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    icon={PieChart}
                    label="Mesas ocupadas"
                    value={String(analytics.occupancy.occupied)}
                    hint="En uso"
                    variant="danger"
                  />
                  <MetricCard
                    icon={PieChart}
                    label="Mesas libres"
                    value={String(analytics.occupancy.free)}
                    hint="Disponibles"
                    variant="success"
                  />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">Distribucion de mesas</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Reservadas, proximas y fuera de servicio.
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {analytics.occupancy.reserved + analytics.occupancy.nextReservation + analytics.occupancy.outOfService} mesas
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {occupancyRows.map((row) => {
                      const maxValue = Math.max(...occupancyRows.map((item) => item.value), 1);
                      const percentage = Math.round((row.value / maxValue) * 100);

                      return (
                        <div key={row.label} className="space-y-2">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <div>
                              <p className="font-medium text-slate-900">{row.label}</p>
                              <p className="text-xs text-slate-500">{row.hint}</p>
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{row.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white">
                            <div
                              className="h-full rounded-full bg-slate-950"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Clientes"
                  description="Metrica de CRM calculada desde el estado local."
                  extra={
                    <Badge variant="success" className="rounded-full px-3 py-1">
                      {formatMoney(analytics.customers.averageTicket)} ticket promedio
                    </Badge>
                  }
                />
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {customerCards.map((card) => (
                    <MetricCard key={card.label} {...card} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Productos"
                  description="Top 5 de productos mas vendidos y la facturacion generada."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {topProductRows.length > 0 ? (
                  topProductRows.map((row, index) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-950">
                            {index + 1}. {row.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {row.value} vendidos
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Todavia no hay consumos completados en el rango seleccionado.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Canales de reserva"
                  description="Distribucion por Web, WhatsApp, Telefono y Presencial."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {channelRows.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-950">{row.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {row.value}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-[24px] bg-white p-2 shadow-sm">
          {TAB_OPTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-2xl px-4 py-2">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <TrendCard
              title="Ventas por dia"
              description="Resumen diario del periodo seleccionado."
              rows={analytics.salesByDay}
              valueKey="sales"
              valueFormatter={formatMoney}
              emptyMessage="No hay ventas para graficar en este periodo."
              toneClassName="bg-slate-950"
            />
            <TrendCard
              title="Reservas por dia"
              description="Cantidad de reservas cargadas cada dia."
              rows={analytics.reservationsByDay}
              valueKey="reservations"
              valueFormatter={(value) => String(value)}
              emptyMessage="No hay reservas para graficar en este periodo."
              toneClassName="bg-violet-500"
            />
          </div>
        </TabsContent>

        <TabsContent value="comensales" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <TrendCard
              title="Reserva y consumo"
              description="Relacion entre reservas activas y ventas completadas."
              rows={analytics.salesByDay}
              valueKey="sales"
              valueFormatter={formatMoney}
              emptyMessage="Sin datos de comensales en este periodo."
              toneClassName="bg-emerald-500"
            />
            <BreakdownList
              title="Visitas"
              description="Snapshot del CRM y ocupacion del comedor."
              rows={[
                { label: "Clientes totales", value: analytics.customers.total },
                { label: "Clientes nuevos", value: analytics.customers.newCustomers },
                { label: "Clientes recurrentes", value: analytics.customers.recurrentCustomers },
                { label: "VIP", value: analytics.customers.vipCustomers },
              ]}
              emptyMessage="No hay clientes para mostrar."
              tone="emerald"
            />
          </div>
        </TabsContent>

        <TabsContent value="ventas" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <TrendCard
              title="Ventas diarias"
              description="Detalle de facturacion del periodo."
              rows={analytics.salesByDay}
              valueKey="sales"
              valueFormatter={formatMoney}
              emptyMessage="No hay ventas para este periodo."
              toneClassName="bg-violet-500"
            />
            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Comparativo"
                  description="Ventas comparadas contra hoy, semana y mes."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {[
                  { label: "Ventas hoy", value: analytics.comparisonSales.today },
                  { label: "Ventas semana", value: analytics.comparisonSales.week },
                  { label: "Ventas mes", value: analytics.comparisonSales.month },
                  { label: "Ventas periodo", value: analytics.salesTotal },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-950">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-950">{formatMoney(item.value)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platos" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <BreakdownList
              title="Top productos"
              description="Productos mas vendidos del rango seleccionado."
              rows={topProductRows}
              emptyMessage="No hay productos completados en este periodo."
              tone="violet"
            />
            <BreakdownList
              title="Categorias de comida"
              description="Ingredientes del mix de ventas no-bebidas."
              rows={foodRows}
              emptyMessage="No hay platos para mostrar."
              tone="emerald"
            />
          </div>
        </TabsContent>

        <TabsContent value="bebidas" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <BreakdownList
              title="Bebidas y vinos"
              description="Rotacion de bebidas, vinos y tragos."
              rows={beverageRows}
              emptyMessage="No hay bebidas completadas en este periodo."
              tone="amber"
            />
            <BreakdownList
              title="Canal de origen"
              description="Como llegaron las reservas que terminaron en consumo."
              rows={channelRows}
              emptyMessage="No hay canales para mostrar."
              tone="slate"
            />
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Ranking de clientes"
                  description="Ordenado por visitas y gasto acumulado."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {rankingCustomers.map((customer, index) => (
                  <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-950">
                          {index + 1}. {customer.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.visits} visitas · {formatMoney(customer.totalSpent)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {customer.vip ? (
                          <Badge variant="success" className="rounded-full px-2.5 py-1 text-[11px]">
                            VIP
                          </Badge>
                        ) : null}
                        {customer.allergies.length > 0 ? (
                          <Badge variant="warning" className="rounded-full px-2.5 py-1 text-[11px]">
                            Alergia
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-[28px]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <SectionHeader
                  title="Ticket y estado"
                  description="Metricas del CRM calculadas sobre el estado local."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                <MetricCard
                  icon={Wallet}
                  label="Ticket promedio"
                  value={formatMoney(analytics.customers.averageTicket)}
                  hint="Con reservas completadas"
                  variant="outline"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Clientes frecuentes"
                  value={String(analytics.customers.frequentCustomers)}
                  hint="5 o mas visitas"
                  variant="secondary"
                />
                <MetricCard
                  icon={Users2}
                  label="Clientes nuevos"
                  value={String(analytics.customers.newCustomers)}
                  hint="Primera reserva dentro del rango"
                  variant="info"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reservas" className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <BreakdownList
              title="Estados de reserva"
              description="Distribucion de pendientes, confirmadas, ocupadas y cerradas."
              rows={statusRows}
              emptyMessage="No hay reservas en el rango actual."
              tone="rose"
            />
            <BreakdownList
              title="Canales"
              description="Origen de las reservas en el periodo analizado."
              rows={channelRows}
              emptyMessage="No hay canales para mostrar."
              tone="slate"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
