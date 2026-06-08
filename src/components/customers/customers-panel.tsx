"use client";

import * as React from "react";
import { Pencil, Search, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import { cn } from "@/lib/utils";
import type { Customer, CustomerConsumptionHistoryItem, CustomerReservationHistoryItem } from "@/types/domain";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().split(/\s+/);
  const firstName = normalized[0] ?? "";
  const lastName = normalized.slice(1).join(" ");

  return { firstName, lastName };
}

function splitCommaList(value: string) {
  return value
    .split(/[,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function toDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function reservationHistoryKey(entry: CustomerReservationHistoryItem) {
  return `${entry.date}T${entry.time}`;
}

function consumptionHistoryKey(entry: CustomerConsumptionHistoryItem) {
  return `${entry.date}T${entry.id}`;
}

type CustomerFormState = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  preferences: string;
  allergies: string;
  notes: string;
};

function buildFormState(customer: Customer): CustomerFormState {
  const splitName = splitFullName(customer.fullName);

  return {
    id: customer.id,
    firstName: customer.firstName ?? splitName.firstName,
    lastName: customer.lastName ?? splitName.lastName,
    phone: customer.phone,
    email: customer.email,
    birthday: toDateInputValue(customer.birthday),
    preferences: customer.preferences.join(", "),
    allergies: customer.allergies.join(", "),
    notes: customer.notes ?? "",
  };
}

function metricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

function customerSummaryBadges(customer: Customer) {
  const badges: React.ReactNode[] = [];

  if (customer.vip) {
    badges.push(
      <Badge key="vip" variant="warning">
        VIP
      </Badge>
    );
  }

  if (customer.visits >= 5) {
    badges.push(
      <Badge key="frequent" variant="success">
        Frecuente
      </Badge>
    );
  }

  if (customer.allergies.length > 0) {
    badges.push(
      <Badge key="allergy" variant="danger">
        Alergia
      </Badge>
    );
  }

  if (customer.birthdaySoon) {
    badges.push(
      <Badge key="birthday" variant="info">
        Cumpleaños próximo
      </Badge>
    );
  }

  return badges;
}

export function CustomersPanel() {
  const { customers, saveCustomer } = useRestaurantFlow();
  const [query, setQuery] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<CustomerFormState | null>(null);

  const filteredCustomers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.phone,
        customer.email,
        customer.birthday,
        customer.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [customers, query]);

  const selectedCustomer = React.useMemo(() => {
    if (!customers.length || filteredCustomers.length === 0) {
      return null;
    }

    return (
      customers.find((customer) => customer.id === selectedCustomerId) ??
      filteredCustomers[0] ??
      customers[0] ??
      null
    );
  }, [customers, filteredCustomers, selectedCustomerId]);

  const reservationHistory = React.useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return [...(selectedCustomer.reservationHistory ?? [])].sort((left, right) =>
      reservationHistoryKey(right).localeCompare(reservationHistoryKey(left))
    );
  }, [selectedCustomer]);

  const consumptionHistory = React.useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return [...(selectedCustomer.consumptionHistory ?? [])].sort((left, right) =>
      consumptionHistoryKey(right).localeCompare(consumptionHistoryKey(left))
    );
  }, [selectedCustomer]);

  const metrics = React.useMemo(() => {
    if (!selectedCustomer) {
      return null;
    }

    return [
      {
        label: "Visitas completadas",
        value: String(selectedCustomer.visits),
        hint: selectedCustomer.reservationHistory?.length
          ? `${selectedCustomer.reservationHistory.length} reservas registradas`
          : "Sin historial reciente",
      },
      {
        label: "Gasto acumulado",
        value: formatMoney(selectedCustomer.totalSpent),
        hint: "Incluye consumos de visitas completadas",
      },
      {
        label: "Ticket promedio",
        value: formatMoney(selectedCustomer.averageTicket),
        hint: "Promedio sobre visitas completadas",
      },
      {
        label: "Última visita",
        value: selectedCustomer.lastVisit || "Sin datos",
        hint: "Última reserva completada",
      },
      {
        label: "Pedidos favoritos",
        value: String(selectedCustomer.favoriteProducts?.length ?? 0),
        hint:
          selectedCustomer.favoriteProducts?.length
            ? selectedCustomer.favoriteProducts.slice(0, 3).join(" · ")
            : "Todavía no hay suficientes consumos",
      },
      {
        label: "Reservas totales",
        value: String(selectedCustomer.reservations.length),
        hint: "Historial guardado en el CRM",
      },
    ];
  }, [selectedCustomer]);

  function openEditCustomer(customer: Customer) {
    setForm(buildFormState(customer));
    setEditOpen(true);
  }

  function closeEditCustomer() {
    setEditOpen(false);
  }

  function updateFormField<K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K]
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  }

  function handleSaveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer || !form) {
      return;
    }

    saveCustomer({
      ...selectedCustomer,
      id: form.id,
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      birthday: form.birthday.trim() || selectedCustomer.birthday,
      preferences: splitCommaList(form.preferences),
      allergies: splitCommaList(form.allergies),
      notes: form.notes.trim(),
    });

    setEditOpen(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
      <Card className="h-fit">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="space-y-3">
            <div>
              <CardTitle>Clientes</CardTitle>
              <p className="text-sm text-slate-500">
                CRM conectado a reservas, consumos e historial.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 p-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950">
                  {filteredCustomers.length} clientes
                </p>
                <p className="text-sm text-slate-500">Seleccioná una ficha para verla completa.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              const active = selectedCustomer?.id === customer.id;

              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={cn(
                    "w-full rounded-3xl border px-4 py-4 text-left transition",
                    active
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_28px_rgba(15,23,42,0.18)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{customer.fullName}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-500")}>
                        {customer.phone}
                      </p>
                      <p className={cn("mt-1 text-xs", active ? "text-slate-400" : "text-slate-400")}>
                        {customer.email}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={active ? "secondary" : "outline"}>
                        {customer.visits} visitas
                      </Badge>
                      {customer.vip ? <Badge variant="warning">VIP</Badge> : null}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              No encontramos clientes con ese filtro.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Ficha del cliente</CardTitle>
              <p className="text-sm text-slate-500">
                Datos, historial de reservas y consumos asociados.
              </p>
            </div>
            {selectedCustomer ? (
              <Button className="rounded-2xl" onClick={() => openEditCustomer(selectedCustomer)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar cliente
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-4">
          {selectedCustomer ? (
            <>
              <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {customerSummaryBadges(selectedCustomer)}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Cliente seleccionado
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold">{selectedCustomer.fullName}</h3>
                      <p className="mt-2 text-sm text-slate-300">{selectedCustomer.email}</p>
                      <p className="mt-1 text-sm text-slate-400">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {metricCard({ label: "Cumpleaños", value: selectedCustomer.birthday || "Sin dato" })}
                    {metricCard({
                      label: "Preferencias",
                      value: String(selectedCustomer.preferences.length),
                      hint: selectedCustomer.preferences.join(" · ") || "Sin preferencias",
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metrics?.map((metric) => (
                  <div key={metric.label}>{metricCard(metric)}</div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Preferencias</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCustomer.preferences.length > 0 ? (
                      selectedCustomer.preferences.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Sin preferencias cargadas.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Alergias</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCustomer.allergies.length > 0 ? (
                      selectedCustomer.allergies.map((item) => (
                        <Badge key={item} variant="danger">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Sin alergias registradas.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Historial de reservas</p>
                      <p className="text-sm text-slate-500">
                        Fechas, mesas, estado y tamaño del grupo.
                      </p>
                    </div>
                    <Badge variant="outline">{reservationHistory.length}</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {reservationHistory.length > 0 ? (
                      reservationHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {formatDateLabel(entry.date)} · {entry.time}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {entry.tableName} · {entry.partySize} personas · {entry.channel}
                              </p>
                            </div>
                            <Badge
                              variant={
                                entry.status === "Completada"
                                  ? "success"
                                  : entry.status === "Cancelada"
                                    ? "danger"
                                    : entry.status === "No-show"
                                      ? "secondary"
                                      : entry.status === "Ocupada"
                                        ? "warning"
                                        : "info"
                              }
                            >
                              {entry.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Todavía no hay reservas en el historial de este cliente.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Consumos asociados</p>
                      <p className="text-sm text-slate-500">
                        Items cargados por reserva completada.
                      </p>
                    </div>
                    <Badge variant="outline">{consumptionHistory.length}</Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {consumptionHistory.length > 0 ? (
                      consumptionHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {formatDateLabel(entry.date)} · {entry.tableName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {entry.items.length} items cargados
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formatMoney(entry.subtotal)}
                            </p>
                          </div>

                          <div className="mt-3 space-y-2">
                            {entry.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm"
                              >
                                <span className="text-slate-700">
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="font-medium text-slate-950">
                                  {formatMoney(item.lineTotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Todavía no hay consumos asociados a este cliente.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notas internas</p>
                    <p className="text-sm text-slate-500">Información útil para el equipo.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {selectedCustomer.notes?.trim() ? selectedCustomer.notes : "Sin notas internas."}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
              Seleccioná un cliente para ver su ficha, historial y consumos.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditCustomer();
          }
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <form className="flex h-[90vh] max-h-[90vh] min-h-0 flex-col" onSubmit={handleSaveCustomer}>
            <div className="border-b border-slate-100 px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-semibold text-slate-950">
                  Editar cliente
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Ajustá datos de contacto, preferencias, alergias y notas internas.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {form ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Nombre</p>
                    <Input
                      value={form.firstName}
                      onChange={(event) => updateFormField("firstName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Apellido</p>
                    <Input
                      value={form.lastName}
                      onChange={(event) => updateFormField("lastName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Teléfono</p>
                    <Input
                      value={form.phone}
                      onChange={(event) => updateFormField("phone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Email</p>
                    <Input
                      value={form.email}
                      onChange={(event) => updateFormField("email", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Cumpleaños</p>
                    <Input
                      type="date"
                      value={form.birthday}
                      onChange={(event) => updateFormField("birthday", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Alergias</p>
                    <Input
                      value={form.allergies}
                      onChange={(event) => updateFormField("allergies", event.target.value)}
                      placeholder="Separadas por coma"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Preferencias</p>
                    <Input
                      value={form.preferences}
                      onChange={(event) => updateFormField("preferences", event.target.value)}
                      placeholder="Separadas por coma"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm font-medium text-slate-700">Notas internas</p>
                    <textarea
                      value={form.notes}
                      onChange={(event) => updateFormField("notes", event.target.value)}
                      className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      placeholder="Notas para el equipo"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={closeEditCustomer}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-2xl">
                Guardar cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
