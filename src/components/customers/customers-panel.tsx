"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

export function CustomersPanel({ customers }: { customers: Customer[] }) {
  const [selectedCustomer, setSelectedCustomer] = React.useState(customers[0]);
  const [query, setQuery] = React.useState("");

  const filtered = customers.filter((customer) =>
    [customer.fullName, customer.email, customer.phone]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Clientes</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left transition",
                selectedCustomer.id === customer.id
                  ? "border-slate-950 bg-slate-950 text-white shadow-[0_12px_22px_rgba(15,23,42,0.18)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{customer.fullName}</p>
                  <p className={cn("mt-1 text-xs", selectedCustomer.id === customer.id ? "text-slate-300" : "text-slate-500")}>
                    {customer.phone}
                  </p>
                </div>
                {customer.vip ? <Badge variant="warning">VIP</Badge> : null}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Ficha del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-4">
          <div className="rounded-[28px] bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Cliente seleccionado</p>
                <h3 className="mt-2 text-2xl font-semibold">{selectedCustomer.fullName}</h3>
                <p className="mt-2 text-sm text-slate-300">{selectedCustomer.email}</p>
              </div>
              {selectedCustomer.vip ? <Badge variant="warning">VIP</Badge> : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Cumpleanos", selectedCustomer.birthday],
              ["Visitas", String(selectedCustomer.visits)],
              ["Gasto acumulado", `$${selectedCustomer.totalSpent.toLocaleString("es-AR")}`],
              ["Ticket promedio", `$${selectedCustomer.averageTicket.toLocaleString("es-AR")}`],
              ["Ultima visita", selectedCustomer.lastVisit],
              ["Telefono", selectedCustomer.phone],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
                <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Preferencias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCustomer.preferences.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Alergias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCustomer.allergies.map((item) => (
                  <Badge key={item} variant="danger">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-950">Historial de reservas</p>
            <div className="mt-4 space-y-2">
              {selectedCustomer.reservations.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-700">{item}</p>
                  <Badge variant="outline">Completada</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
