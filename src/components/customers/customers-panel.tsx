"use client";

import * as React from "react";
import {
  AlertTriangle,
  Cake,
  Mail,
  Pencil,
  Phone,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
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
import {
  formatDisplayDate,
  getTodayDateKey,
  normalizeDateKey,
  parseDateKeyToUtcDate,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { RestaurantReservation } from "@/data/restaurant-ops";
import type {
  Customer,
  ReservationStatus,
  TableConsumptionItem,
} from "@/types/domain";

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

type ProductConsumptionSummary = {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
};

type CrmCustomer = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  allergies: string[];
  preferences: string[];
  notes: string;
  reservations: RestaurantReservation[];
  completedReservations: RestaurantReservation[];
  cancelledReservations: RestaurantReservation[];
  noShowReservations: RestaurantReservation[];
  upcomingReservation: RestaurantReservation | null;
  latestVisit: RestaurantReservation | null;
  reservationCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalSpent: number;
  averageTicket: number;
  productConsumption: ProductConsumptionSummary[];
  vip: boolean;
  recurrent: boolean;
  birthdayDisplay: string;
  birthdaySoon: boolean;
};

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

const statusStyles: Record<ReservationStatus, string> = {
  Pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  Confirmada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Ocupada: "border-violet-200 bg-violet-50 text-violet-700",
  Completada: "border-slate-200 bg-slate-100 text-slate-700",
  Cancelada: "border-rose-200 bg-rose-50 text-rose-700",
  "No-show": "border-slate-200 bg-slate-100 text-slate-600",
};

const monthNames: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function normalizeContactValue(value: string) {
  return value.trim().toLowerCase();
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

function mergeUniqueStrings(...lists: Array<string[]>) {
  return Array.from(new Set(lists.flat().map((item) => item.trim()).filter(Boolean)));
}

function getReservationTotal(reservation: RestaurantReservation) {
  return (reservation.consumptionItems ?? []).reduce(
    (total, item) => total + item.lineTotal,
    0
  );
}

function getReservationDateTimeKey(reservation: Pick<RestaurantReservation, "date" | "time">) {
  return `${normalizeDateKey(reservation.date) ?? reservation.date}T${reservation.time}`;
}

function sortNewestReservationFirst(
  left: RestaurantReservation,
  right: RestaurantReservation
) {
  return getReservationDateTimeKey(right).localeCompare(getReservationDateTimeKey(left));
}

function sortOldestReservationFirst(
  left: RestaurantReservation,
  right: RestaurantReservation
) {
  return getReservationDateTimeKey(left).localeCompare(getReservationDateTimeKey(right));
}

function toDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function parseBirthday(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const isoDate = normalizeDateKey(normalized);
  if (isoDate) {
    const [, month, day] = isoDate.split("-");
    return {
      day: Number(day),
      month: Number(month),
      display: `${day}/${month}`,
      inputValue: isoDate,
    };
  }

  const textMatch = normalized.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)$/i);
  if (textMatch) {
    const [, dayRaw, monthRaw] = textMatch;
    const month = monthNames[monthRaw.normalize("NFD").replace(/\p{Diacritic}/gu, "")];
    const day = Number(dayRaw);

    if (month && day) {
      return {
        day,
        month,
        display: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
        inputValue: "",
      };
    }
  }

  return {
    day: null,
    month: null,
    display: value,
    inputValue: "",
  };
}

function isBirthdayWithinNextSevenDays(birthday: string, todayKey: string) {
  const parsed = parseBirthday(birthday);
  const todayDate = parseDateKeyToUtcDate(todayKey);

  if (!parsed?.day || !parsed.month || !todayDate) {
    return false;
  }

  const year = todayDate.getUTCFullYear();
  const birthdayThisYear = new Date(Date.UTC(year, parsed.month - 1, parsed.day));
  const birthdayNextYear = new Date(Date.UTC(year + 1, parsed.month - 1, parsed.day));
  const nextBirthday =
    birthdayThisYear >= todayDate ? birthdayThisYear : birthdayNextYear;
  const diffInDays = Math.floor(
    (nextBirthday.getTime() - todayDate.getTime()) / 86_400_000
  );

  return diffInDays >= 0 && diffInDays <= 7;
}

function buildCustomerContactKey(reservation: RestaurantReservation) {
  const email = normalizeContactValue(reservation.email);
  const phone = normalizeContactValue(reservation.phone);

  return email || phone || reservation.id;
}

function findMatchingProfile(
  reservation: RestaurantReservation,
  profiles: Customer[]
) {
  const email = normalizeContactValue(reservation.email);
  const phone = normalizeContactValue(reservation.phone);

  if (email) {
    const byEmail = profiles.find(
      (profile) => normalizeContactValue(profile.email) === email
    );
    if (byEmail) return byEmail;
  }

  if (phone) {
    return (
      profiles.find((profile) => normalizeContactValue(profile.phone) === phone) ?? null
    );
  }

  return null;
}

function groupConsumptionItems(items: TableConsumptionItem[]) {
  const grouped = new Map<string, ProductConsumptionSummary>();

  for (const item of items) {
    const key = item.productId || item.productName;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        total: item.lineTotal,
      });
      continue;
    }

    grouped.set(key, {
      ...existing,
      quantity: existing.quantity + item.quantity,
      total: existing.total + item.lineTotal,
    });
  }

  return Array.from(grouped.values()).sort(
    (left, right) => right.quantity - left.quantity || right.total - left.total
  );
}

function buildCrmCustomers({
  reservations,
  profiles,
  todayKey,
}: {
  reservations: RestaurantReservation[];
  profiles: Customer[];
  todayKey: string;
}) {
  const groupedReservations = new Map<string, RestaurantReservation[]>();

  for (const reservation of reservations) {
    const key = buildCustomerContactKey(reservation);
    groupedReservations.set(key, [...(groupedReservations.get(key) ?? []), reservation]);
  }

  return Array.from(groupedReservations.entries())
    .map(([key, customerReservations]) => {
      const sortedReservations = [...customerReservations].sort(sortNewestReservationFirst);
      const baseReservation = sortedReservations[0];
      const profile = findMatchingProfile(baseReservation, profiles);
      const completedReservations = sortedReservations.filter(
        (reservation) => reservation.status === "Completada"
      );
      const cancelledReservations = sortedReservations.filter(
        (reservation) => reservation.status === "Cancelada"
      );
      const noShowReservations = sortedReservations.filter(
        (reservation) => reservation.status === "No-show"
      );
      const allConsumptionItems = completedReservations.flatMap(
        (reservation) => reservation.consumptionItems ?? []
      );
      const totalSpent = completedReservations.reduce(
        (total, reservation) => total + getReservationTotal(reservation),
        0
      );
      const upcomingReservation =
        [...sortedReservations]
          .filter((reservation) => {
            const dateKey = normalizeDateKey(reservation.date);
            return (
              Boolean(dateKey && dateKey >= todayKey) &&
              ["Pendiente", "Confirmada", "Ocupada"].includes(reservation.status)
            );
          })
          .sort(sortOldestReservationFirst)[0] ?? null;
      const latestVisit = completedReservations[0] ?? null;
      const reservationPreferences = sortedReservations.flatMap((reservation) =>
        splitCommaList(reservation.preferences)
      );
      const reservationAllergies = sortedReservations.flatMap((reservation) =>
        splitCommaList(reservation.allergies)
      );
      const notes = profile?.notes?.trim() || baseReservation.comments || "";
      const birthday = profile?.birthday || baseReservation.birthday || "";
      const parsedBirthday = parseBirthday(birthday);
      const completedCount = completedReservations.length;
      const reservationCount = sortedReservations.length;
      const averageTicket =
        completedCount > 0 ? Math.round(totalSpent / completedCount) : 0;

      return {
        id: profile?.id ?? `crm-${key}`,
        fullName:
          profile?.fullName ||
          `${baseReservation.firstName} ${baseReservation.lastName}`.trim(),
        firstName: profile?.firstName ?? baseReservation.firstName,
        lastName: profile?.lastName ?? baseReservation.lastName,
        phone: profile?.phone || baseReservation.phone,
        email: profile?.email || baseReservation.email,
        birthday,
        allergies: mergeUniqueStrings(profile?.allergies ?? [], reservationAllergies),
        preferences: mergeUniqueStrings(
          profile?.preferences ?? [],
          reservationPreferences
        ),
        notes,
        reservations: sortedReservations,
        completedReservations,
        cancelledReservations,
        noShowReservations,
        upcomingReservation,
        latestVisit,
        reservationCount,
        completedCount,
        cancelledCount: cancelledReservations.length,
        noShowCount: noShowReservations.length,
        totalSpent,
        averageTicket,
        productConsumption: groupConsumptionItems(allConsumptionItems),
        vip: completedCount >= 3 || totalSpent > 200000,
        recurrent: reservationCount >= 2,
        birthdayDisplay: parsedBirthday?.display ?? "Sin cumpleaños cargado",
        birthdaySoon: isBirthdayWithinNextSevenDays(birthday, todayKey),
      } satisfies CrmCustomer;
    })
    .sort((left, right) => {
      if (right.vip !== left.vip) return Number(right.vip) - Number(left.vip);
      if (right.totalSpent !== left.totalSpent) return right.totalSpent - left.totalSpent;
      return left.fullName.localeCompare(right.fullName);
    });
}

function buildFormState(customer: CrmCustomer): CustomerFormState {
  const splitName = splitFullName(customer.fullName);
  const parsedBirthday = parseBirthday(customer.birthday);

  return {
    id: customer.id,
    firstName: customer.firstName || splitName.firstName,
    lastName: customer.lastName || splitName.lastName,
    phone: customer.phone,
    email: customer.email,
    birthday: parsedBirthday?.inputValue || toDateInputValue(customer.birthday),
    preferences: customer.preferences.join(", "),
    allergies: customer.allergies.join(", "),
    notes: customer.notes,
  };
}

function subscribeToCurrentDate(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function useCurrentDateKey() {
  return React.useSyncExternalStore(
    subscribeToCurrentDate,
    () => getTodayDateKey(),
    () => null
  );
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
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

function statusBadge(status: ReservationStatus) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", statusStyles[status])}>
      {status}
    </Badge>
  );
}

function emptyText(value: string, fallback: string) {
  return value.trim() ? value : fallback;
}

export function CustomersPanel() {
  const { customers, reservations, saveCustomer } = useRestaurantFlow();
  const todayKey = useCurrentDateKey();
  const [query, setQuery] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<CustomerFormState | null>(null);

  const crmCustomers = React.useMemo(
    () =>
      todayKey
        ? buildCrmCustomers({
            reservations,
            profiles: customers,
            todayKey,
          })
        : [],
    [customers, reservations, todayKey]
  );

  const filteredCustomers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return crmCustomers;
    }

    return crmCustomers.filter((customer) =>
      [
        customer.firstName,
        customer.lastName,
        customer.fullName,
        customer.phone,
        customer.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [crmCustomers, query]);

  const selectedCustomer = React.useMemo(() => {
    if (filteredCustomers.length === 0) {
      return null;
    }

    return (
      filteredCustomers.find((customer) => customer.id === selectedCustomerId) ??
      filteredCustomers[0]
    );
  }, [filteredCustomers, selectedCustomerId]);

  const reservationRows = React.useMemo(
    () => selectedCustomer?.reservations ?? [],
    [selectedCustomer]
  );

  const productRows = React.useMemo(
    () => selectedCustomer?.productConsumption ?? [],
    [selectedCustomer]
  );

  function openEditCustomer(customer: CrmCustomer) {
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

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    saveCustomer({
      id: form.id,
      fullName,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      birthday: form.birthday.trim() || selectedCustomer.birthday,
      visits: selectedCustomer.completedCount,
      totalSpent: selectedCustomer.totalSpent,
      averageTicket: selectedCustomer.averageTicket,
      preferences: splitCommaList(form.preferences),
      allergies: splitCommaList(form.allergies),
      lastVisit: selectedCustomer.latestVisit
        ? `${formatDisplayDate(selectedCustomer.latestVisit.date)} - ${selectedCustomer.latestVisit.time}`
        : "",
      reservations: selectedCustomer.reservations.map(
        (reservation) => `${formatDisplayDate(reservation.date)} ${reservation.time}`
      ),
      notes: form.notes.trim(),
      vip: selectedCustomer.vip,
      contactKeys: [normalizeContactValue(form.email), normalizeContactValue(form.phone)].filter(Boolean),
      reservationHistory: selectedCustomer.reservations.map((reservation) => ({
        id: reservation.id,
        date: reservation.date,
        time: reservation.time,
        status: reservation.status,
        tableName: reservation.tableName,
        partySize: reservation.partySize,
        channel: reservation.channel,
      })),
      consumptionHistory: selectedCustomer.completedReservations
        .filter((reservation) => (reservation.consumptionItems ?? []).length > 0)
        .map((reservation) => ({
          id: `consumption-${reservation.id}`,
          reservationId: reservation.id,
          date: reservation.date,
          tableName: reservation.tableName,
          items: reservation.consumptionItems ?? [],
          subtotal: getReservationTotal(reservation),
        })),
      favoriteProducts: selectedCustomer.productConsumption
        .slice(0, 3)
        .map((item) => item.productName),
    });

    setEditOpen(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-6">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="space-y-3">
            <div>
              <CardTitle>Clientes</CardTitle>
              <p className="text-sm text-slate-500">
                CRM construido desde reservas, consumos y preferencias locales.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, teléfono o email"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950">
                  {filteredCustomers.length} clientes
                </p>
                <p className="text-sm text-slate-500">
                  Unificados por email o teléfono.
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          {crmCustomers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              Todavía no hay clientes registrados. Los clientes aparecerán automáticamente
              cuando crees reservas.
            </div>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => {
              const active = selectedCustomer?.id === customer.id;
              const visitLabel = customer.latestVisit
                ? `Última visita ${formatDisplayDate(customer.latestVisit.date)}`
                : customer.upcomingReservation
                  ? `Próxima reserva ${formatDisplayDate(customer.upcomingReservation.date)}`
                  : "Sin visitas completadas";

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
                        {visitLabel}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {customer.vip ? <Badge variant="warning">VIP</Badge> : null}
                      {customer.recurrent ? <Badge variant="success">Recurrente</Badge> : null}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
              No encontramos clientes con ese criterio.
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
                Datos operativos, historial, consumos y alertas para servicio.
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
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCustomer.vip ? <Badge variant="warning">VIP</Badge> : null}
                      {selectedCustomer.recurrent ? (
                        <Badge variant="success">Recurrente</Badge>
                      ) : null}
                      {selectedCustomer.birthdaySoon ? (
                        <Badge variant="info">Cumpleaños próximo</Badge>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Cliente seleccionado
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold">{selectedCustomer.fullName}</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Phone className="h-4 w-4" />
                        {selectedCustomer.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Mail className="h-4 w-4" />
                        {selectedCustomer.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Cumpleaños
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {selectedCustomer.birthdayDisplay}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Próxima reserva
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {selectedCustomer.upcomingReservation
                          ? `${formatDisplayDate(selectedCustomer.upcomingReservation.date)} · ${selectedCustomer.upcomingReservation.time}`
                          : "Sin próxima"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total de reservas",
                    value: String(selectedCustomer.reservationCount),
                    hint: "Historial completo",
                  },
                  {
                    label: "Completadas",
                    value: String(selectedCustomer.completedCount),
                    hint: "Visitas cerradas",
                  },
                  {
                    label: "Canceladas",
                    value: String(selectedCustomer.cancelledCount),
                    hint: `${selectedCustomer.noShowCount} no-show`,
                  },
                  {
                    label: "Ticket promedio",
                    value: formatMoney(selectedCustomer.averageTicket),
                    hint: `${formatMoney(selectedCustomer.totalSpent)} acumulado`,
                  },
                ].map((metric) => (
                  <div key={metric.label}>{metricCard(metric)}</div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="shadow-none xl:col-span-1">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cake className="h-4 w-4 text-violet-500" />
                      Cumpleaños
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-sm text-slate-600">
                      {selectedCustomer.birthday
                        ? `Fecha registrada: ${selectedCustomer.birthdayDisplay}`
                        : "Sin cumpleaños cargado"}
                    </p>
                    {selectedCustomer.birthdaySoon ? (
                      <Badge variant="info" className="mt-3">
                        Cumpleaños próximo
                      </Badge>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      Alergias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 p-5 pt-0">
                    {selectedCustomer.allergies.length > 0 ? (
                      selectedCustomer.allergies.map((item) => (
                        <Badge key={item} variant="danger">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        Sin alergias registradas
                      </span>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-4 w-4 text-amber-500" />
                      Preferencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 p-5 pt-0">
                    {selectedCustomer.preferences.length > 0 ? (
                      selectedCustomer.preferences.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        Sin preferencias registradas
                      </span>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notas internas</p>
                    <p className="text-sm text-slate-500">
                      Comentarios útiles para recepción y salón.
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {emptyText(selectedCustomer.notes, "Sin notas internas")}
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card className="shadow-none">
                  <CardHeader className="border-b border-slate-100 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">Historial</CardTitle>
                        <p className="text-sm text-slate-500">
                          Reservas ordenadas de más reciente a más antigua.
                        </p>
                      </div>
                      <Badge variant="outline">{reservationRows.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {reservationRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3">Hora</th>
                              <th className="px-4 py-3 text-center">Personas</th>
                              <th className="px-4 py-3 text-center">Mesa</th>
                              <th className="px-4 py-3 text-center">Canal</th>
                              <th className="px-4 py-3 text-center">Estado</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reservationRows.map((reservation) => (
                              <tr key={reservation.id} className="text-slate-700">
                                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                                  {formatDisplayDate(reservation.date)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  {reservation.time}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {reservation.partySize}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {reservation.tableName || "—"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {reservation.channel}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {statusBadge(reservation.status)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-950">
                                  {getReservationTotal(reservation) > 0
                                    ? formatMoney(getReservationTotal(reservation))
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-5 text-sm text-slate-500">
                        Todavía no hay reservas en el historial.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader className="border-b border-slate-100 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">Consumos</CardTitle>
                        <p className="text-sm text-slate-500">
                          Productos agrupados por cantidad y gasto.
                        </p>
                      </div>
                      <Badge variant="success">{formatMoney(selectedCustomer.totalSpent)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-5">
                    {productRows.length > 0 ? (
                      productRows.map((item) => (
                        <div
                          key={item.productId || item.productName}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-950">
                                {item.productName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Cantidad total: x{item.quantity}
                              </p>
                            </div>
                            <p className="whitespace-nowrap text-sm font-semibold text-slate-950">
                              {formatMoney(item.total)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Todavía no hay consumos asociados a este cliente.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : crmCustomers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
              Todavía no hay clientes registrados. Los clientes aparecerán automáticamente
              cuando crees reservas.
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
              No encontramos clientes con ese criterio.
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
