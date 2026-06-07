"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card>
        <CardHeader>
          <CardTitle>CRM de clientes</CardTitle>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedCustomer(customer)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition",
                selectedCustomer.id === customer.id
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{customer.fullName}</p>
                {customer.vip ? <Badge variant="warning">VIP</Badge> : null}
              </div>
              <p
                className={cn(
                  "mt-1 text-sm",
                  selectedCustomer.id === customer.id
                    ? "text-slate-200"
                    : "text-slate-500"
                )}
              >
                {customer.phone}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ficha de cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Cliente seleccionado
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  {selectedCustomer.fullName}
                </h3>
              </div>
              {selectedCustomer.vip ? <Badge variant="warning">VIP</Badge> : null}
            </div>
            <p className="mt-4 text-sm text-slate-300">
              {selectedCustomer.phone} · {selectedCustomer.email}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Cumpleaños", selectedCustomer.birthday],
              ["Visitas", `${selectedCustomer.visits}`],
              ["Gasto acumulado", `$${selectedCustomer.totalSpent.toLocaleString("es-AR")}`],
              ["Ticket promedio", `$${selectedCustomer.averageTicket.toLocaleString("es-AR")}`],
              ["Última visita", selectedCustomer.lastVisit],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">Preferencias</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCustomer.preferences.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
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
            <p className="text-sm font-semibold text-slate-950">
              Historial de reservas
            </p>
            <div className="mt-4 space-y-3">
              {selectedCustomer.reservations.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
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
