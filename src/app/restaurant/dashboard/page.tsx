"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import { StatCard } from "@/components/stat-card";
import { promotions } from "@/data/mock";
import type { RestaurantReservation } from "@/data/restaurant-ops";
import {
  endOfMonthDateKey,
  formatDisplayDate,
  getTodayDateKey,
  normalizeDateKey,
  startOfMonthDateKey,
} from "@/lib/date-utils";
import type { Customer, ReservationStatus } from "@/types/domain";
import { CalendarClock, Cake, Clock3, TriangleAlert } from "lucide-react";

type StatusBadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const activeExpectedStatuses = new Set<ReservationStatus>([
  "Pendiente",
  "Confirmada",
  "Ocupada",
]);

const checkInStatuses = new Set<ReservationStatus>(["Ocupada", "Completada"]);

const statusBadgeVariants: Record<ReservationStatus, StatusBadgeVariant> = {
  Pendiente: "warning",
  Confirmada: "success",
  Ocupada: "info",
  Completada: "secondary",
  Cancelada: "danger",
  "No-show": "outline",
};

const spanishMonthNumbers: Record<string, string> = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  septiembre: "09",
  setiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function getReservationGuestName(reservation: RestaurantReservation) {
  return `${reservation.firstName} ${reservation.lastName}`.trim();
}

function getReservationTotal(reservation: RestaurantReservation) {
  return (reservation.consumptionItems ?? []).reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
}

function getReservationContactKeys(reservation: RestaurantReservation) {
  return [reservation.email, reservation.phone].map((value) => value.trim().toLowerCase());
}

function getCustomerContactKeys(customer: Customer) {
  return [
    ...(customer.contactKeys ?? []),
    customer.email,
    customer.phone,
  ].map((value) => value.trim().toLowerCase());
}

function findCustomerForReservation(
  reservation: RestaurantReservation,
  customers: Customer[]
) {
  const reservationKeys = getReservationContactKeys(reservation).filter(Boolean);

  return (
    customers.find((customer) =>
      getCustomerContactKeys(customer).some((key) => reservationKeys.includes(key))
    ) ?? null
  );
}

function parseBirthdayDayMonth(value: string) {
  const normalizedDate = normalizeDateKey(value);

  if (normalizedDate) {
    const [, month, day] = normalizedDate.split("-");
    return { day, month };
  }

  const normalizedText = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const match = normalizedText.match(/^(\d{1,2})\s*(?:de)?\s*([a-z]+)$/);

  if (!match) {
    return null;
  }

  const [, dayRaw, monthRaw] = match;
  const month = spanishMonthNumbers[monthRaw];

  if (!month) {
    return null;
  }

  return {
    day: dayRaw.padStart(2, "0"),
    month,
  };
}

function isBirthdayToday(value: string, todayDateKey: string | null) {
  if (!value || !todayDateKey) {
    return false;
  }

  const birthday = parseBirthdayDayMonth(value);

  if (!birthday) {
    return false;
  }

  const [, currentMonth, currentDay] = todayDateKey.split("-");
  return birthday.day === currentDay && birthday.month === currentMonth;
}

function formatBirthday(value: string) {
  const birthday = parseBirthdayDayMonth(value);

  if (!birthday) {
    return value;
  }

  return `${birthday.day}/${birthday.month}`;
}

function sortReservationsAsc(
  left: RestaurantReservation,
  right: RestaurantReservation
) {
  return `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`);
}

function sortReservationsDesc(
  left: RestaurantReservation,
  right: RestaurantReservation
) {
  return sortReservationsAsc(right, left);
}

function getCurrentDateSnapshot() {
  return getTodayDateKey();
}

function subscribeToCurrentDate(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const immediateTimeoutId = window.setTimeout(onStoreChange, 0);
  let midnightTimeoutId = 0;

  const scheduleMidnightRefresh = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const delay = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

    window.clearTimeout(midnightTimeoutId);
    midnightTimeoutId = window.setTimeout(() => {
      onStoreChange();
      scheduleMidnightRefresh();
    }, delay);
  };

  const refreshWhenVisible = () => {
    if (document.visibilityState === "visible") {
      onStoreChange();
    }
  };

  scheduleMidnightRefresh();
  window.addEventListener("focus", onStoreChange);
  document.addEventListener("visibilitychange", refreshWhenVisible);

  return () => {
    window.clearTimeout(immediateTimeoutId);
    window.clearTimeout(midnightTimeoutId);
    window.removeEventListener("focus", onStoreChange);
    document.removeEventListener("visibilitychange", refreshWhenVisible);
  };
}

function useCurrentLocalDateKey() {
  return React.useSyncExternalStore(
    subscribeToCurrentDate,
    getCurrentDateSnapshot,
    () => null
  );
}

export default function RestaurantDashboardPage() {
  const { reservations, tables, customers } = useRestaurantFlow();
  const todayDateKey = useCurrentLocalDateKey();

  const dashboard = React.useMemo(() => {
    const todayReservations = todayDateKey
      ? reservations
          .filter((reservation) => normalizeDateKey(reservation.date) === todayDateKey)
          .sort(sortReservationsAsc)
      : [];
    const confirmedToday = todayReservations.filter(
      (reservation) => reservation.status === "Confirmada"
    ).length;
    const pendingToday = todayReservations.filter(
      (reservation) => reservation.status === "Pendiente"
    ).length;
    const activeTodayReservations = todayReservations.filter((reservation) =>
      activeExpectedStatuses.has(reservation.status)
    );
    const checkInsToday = todayReservations.filter((reservation) =>
      checkInStatuses.has(reservation.status)
    );
    const completedTodayReservations = todayReservations.filter(
      (reservation) => reservation.status === "Completada"
    );
    const todaySales = completedTodayReservations.reduce(
      (sum, reservation) => sum + getReservationTotal(reservation),
      0
    );
    const occupiedTables = tables.filter((table) => table.status === "Ocupada");
    const operationalTables = tables.filter((table) => table.status !== "Fuera de servicio");
    const activePromotions = promotions.filter((promotion) => promotion.active);
    const expectedGuests = activeTodayReservations.reduce(
      (sum, reservation) => sum + reservation.partySize,
      0
    );
    const averageTicket = completedTodayReservations.length
      ? Math.round(todaySales / completedTodayReservations.length)
      : 0;
    const monthRange = todayDateKey
      ? {
          from: startOfMonthDateKey(todayDateKey),
          to: endOfMonthDateKey(todayDateKey),
        }
      : null;
    const monthlyNoShows = monthRange
      ? reservations.filter((reservation) => {
          const reservationDate = normalizeDateKey(reservation.date);
          return (
            reservation.status === "No-show" &&
            reservationDate !== null &&
            reservationDate >= monthRange.from &&
            reservationDate <= monthRange.to
          );
        }).length
      : 0;
    const birthdayReservations = todayReservations
      .filter((reservation) => isBirthdayToday(reservation.birthday, todayDateKey))
      .map((reservation) => {
        const customer = findCustomerForReservation(reservation, customers);
        return {
          reservation,
          customer,
          isVip:
            Boolean(customer?.vip) ||
            (customer?.totalSpent ?? 0) >= 200000 ||
            (customer?.visits ?? 0) >= 3,
          isRecurrent:
            (customer?.reservationHistory?.length ?? customer?.visits ?? 0) >= 2,
        };
      });
    const hourlyReservations = Array.from(
      todayReservations.reduce((groups, reservation) => {
        const hour = reservation.time.slice(0, 5);
        groups.set(hour, (groups.get(hour) ?? 0) + 1);
        return groups;
      }, new Map<string, number>())
    ).sort(([leftHour], [rightHour]) => leftHour.localeCompare(rightHour));
    const maxHourlyReservations = Math.max(
      ...hourlyReservations.map(([, amount]) => amount),
      1
    );
    const operationalAlerts = todayReservations.flatMap((reservation) => {
      const customer = findCustomerForReservation(reservation, customers);
      const alerts: Array<{ id: string; title: string; detail: string; tone: "amber" | "rose" | "sky" }> = [];
      const customerAllergies = customer?.allergies ?? [];
      const customerPreferences = customer?.preferences ?? [];
      const allergyText =
        reservation.allergies.trim() || customerAllergies.join(", ");
      const preferenceText =
        reservation.preferences.trim() || customerPreferences.join(", ");
      const guestName = getReservationGuestName(reservation);

      if (allergyText) {
        alerts.push({
          id: `${reservation.id}-allergy`,
          title: `${guestName} tiene alergias registradas`,
          detail: allergyText,
          tone: "rose",
        });
      }

      if (preferenceText) {
        alerts.push({
          id: `${reservation.id}-preference`,
          title: `${guestName} tiene preferencias de servicio`,
          detail: preferenceText,
          tone: "amber",
        });
      }

      if (customer?.vip) {
        alerts.push({
          id: `${reservation.id}-vip`,
          title: `${guestName} es cliente VIP`,
          detail: `${reservation.time} - ${reservation.tableName || "Sin mesa asignada"}`,
          tone: "sky",
        });
      }

      return alerts;
    });
    const latestReservations = [...reservations].sort(sortReservationsDesc).slice(0, 5);

    return {
      todayReservations,
      confirmedToday,
      pendingToday,
      activeTodayReservations,
      checkInsToday,
      completedTodayReservations,
      occupiedTables,
      operationalTables,
      activePromotions,
      expectedGuests,
      averageTicket,
      monthlyNoShows,
      birthdayReservations,
      hourlyReservations,
      maxHourlyReservations,
      operationalAlerts,
      latestReservations,
    };
  }, [customers, reservations, tables, todayDateKey]);

  const todayLabel = todayDateKey ? formatDisplayDate(todayDateKey) : "--/--/--";

  const metricCards = [
    {
      label: "Reservas hoy",
      value: String(dashboard.todayReservations.length),
      hint: `Confirmadas: ${dashboard.confirmedToday} · Pendientes: ${dashboard.pendingToday}`,
    },
    {
      label: "Mesas ocupadas",
      value: String(dashboard.occupiedTables.length),
      hint: `${dashboard.occupiedTables.length} de ${dashboard.operationalTables.length}`,
    },
    {
      label: "Clientes esperados",
      value: String(dashboard.expectedGuests),
      hint: `${dashboard.activeTodayReservations.length} reservas activas`,
    },
    {
      label: "Cumpleanos hoy",
      value: String(dashboard.birthdayReservations.length),
      hint: `${dashboard.birthdayReservations.filter((item) => item.isVip).length} VIP`,
    },
    {
      label: "No-shows del mes",
      value: String(dashboard.monthlyNoShows),
      hint: "Mes actual",
    },
    {
      label: "Promociones activas",
      value: String(dashboard.activePromotions.length),
      hint: "Mock visual",
    },
  ];

  const summaryCards = [
    {
      label: "Check-ins",
      value: String(dashboard.checkInsToday.length),
      hint: "ocupadas + completadas",
    },
    {
      label: "Mesas activas",
      value: String(dashboard.occupiedTables.length),
      hint: "ahora",
    },
    {
      label: "Ticket medio",
      value: formatMoney(dashboard.averageTicket),
      hint: dashboard.completedTodayReservations.length
        ? `${dashboard.completedTodayReservations.length} ventas`
        : "sin ventas",
    },
    {
      label: "Promos",
      value: String(dashboard.activePromotions.length),
      hint: "mock",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metricCards.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr_0.75fr]">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle>Resumen del dia</CardTitle>
              <p className="text-sm text-slate-500">
                Operacion real del dia actual: {todayLabel}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Hoy {todayLabel}
              </Badge>
              <Button className="rounded-2xl">Nueva reserva</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                    <Badge variant="secondary">{item.hint}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Reservas por horario</p>
                    <p className="text-xs text-slate-500">
                      Agrupadas con reservas reales de hoy.
                    </p>
                  </div>
                  <Badge variant="outline">Hoy</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {dashboard.hourlyReservations.length > 0 ? (
                    dashboard.hourlyReservations.map(([hour, amount]) => (
                      <div key={hour} className="grid grid-cols-[72px_1fr_32px] items-center gap-3">
                        <p className="text-sm font-medium text-slate-600">{hour}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-950"
                            style={{
                              width: `${Math.max(
                                (amount / dashboard.maxHourlyReservations) * 100,
                                12
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-right text-sm text-slate-500">{amount}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      No hay reservas para hoy.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Cumpleanos hoy</p>
                    <p className="text-xs text-slate-500">Clientes a saludar en el servicio</p>
                  </div>
                  <Badge variant="warning">{dashboard.birthdayReservations.length}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {dashboard.birthdayReservations.length > 0 ? (
                    dashboard.birthdayReservations.map(({ reservation, isVip, isRecurrent }) => (
                      <div
                        key={reservation.id}
                        className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-950">
                              {getReservationGuestName(reservation)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatBirthday(reservation.birthday)} · {reservation.time}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {isVip ? <Badge variant="warning">VIP</Badge> : null}
                            {isRecurrent ? <Badge variant="success">Recurrente</Badge> : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                      No hay cumpleanos cargados para hoy.
                    </div>
                  )}
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
                Alertas operativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.operationalAlerts.length > 0 ? (
                dashboard.operationalAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={
                      alert.tone === "rose"
                        ? "rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900"
                        : alert.tone === "sky"
                          ? "rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900"
                          : "rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                    }
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-xs opacity-80">{alert.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Sin alertas operativas por ahora.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Promociones vigentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.activePromotions.length > 0 ? (
                dashboard.activePromotions.map((promo) => (
                  <div key={promo.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-950">{promo.title}</p>
                      <Badge variant="success">Mock</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{promo.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No hay promociones activas mock.
                </div>
              )}
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
              {dashboard.latestReservations.length > 0 ? (
                dashboard.latestReservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-950">
                        {getReservationGuestName(reservation)}
                      </p>
                      <Badge
                        variant={statusBadgeVariants[reservation.status]}
                        className="rounded-full px-2.5 py-1 text-[11px]"
                      >
                        {reservation.status}
                      </Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDisplayDate(reservation.date)} · {reservation.time} ·{" "}
                      {reservation.tableName || "Sin mesa"} · {reservation.channel}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Todavia no hay reservas registradas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-amber-500" />
              Operacion de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Reservas activas</span>
              <strong className="text-slate-950">{dashboard.activeTodayReservations.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Clientes esperados</span>
              <strong className="text-slate-950">{dashboard.expectedGuests}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>Mesas ocupadas</span>
              <strong className="text-slate-950">{dashboard.occupiedTables.length}</strong>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
