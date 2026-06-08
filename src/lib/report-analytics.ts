import type { Customer, MenuItem, RestaurantTable, ReservationStatus } from "@/types/domain";
import type { RestaurantReservation } from "@/data/restaurant-ops";
import {
  endOfMonthDateKey,
  endOfWeekDateKey,
  formatDisplayDate as formatSharedDisplayDate,
  formatUtcDateKey as formatSharedUtcDateKey,
  getTodayDateKey,
  isDateWithinRange,
  normalizeDateKey as normalizeSharedDateKey,
  parseDateKeyToUtcDate,
  startOfMonthDateKey,
  startOfWeekDateKey,
} from "@/lib/date-utils";

export type ReportPeriod = "Hoy" | "Semana" | "Mes" | "Personalizado";

export type ReportDateRange = {
  from: string;
  to: string;
};

export type ReportMetric = {
  label: string;
  value: number;
  hint: string;
};

export type ReportProductRow = {
  productId: string;
  productName: string;
  category: MenuItem["category"];
  quantity: number;
  revenue: number;
};

export type ReportChannelRow = {
  channel: string;
  count: number;
  percentage: number;
};

export type ReportStatusRow = {
  status: ReservationStatus;
  count: number;
  percentage: number;
};

export type ReportDailyRow = {
  date: string;
  label: string;
  sales: number;
  reservations: number;
};

export type ReportAnalytics = {
  referenceDate: string;
  todayDate: string | null;
  todayLabel: string | null;
  periodRange: ReportDateRange;
  selectedLabel: string;
  comparisonSales: {
    today: number;
    week: number;
    month: number;
  };
  salesTotal: number;
  reservationCounts: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  occupancy: {
    occupied: number;
    free: number;
    reserved: number;
    nextReservation: number;
    outOfService: number;
    percentage: number;
  };
  customers: {
    total: number;
    newCustomers: number;
    recurrentCustomers: number;
    averageTicket: number;
    vipCustomers: number;
    frequentCustomers: number;
  };
  topProducts: ReportProductRow[];
  beverageProducts: ReportProductRow[];
  channelBreakdown: ReportChannelRow[];
  statusBreakdown: ReportStatusRow[];
  salesByDay: ReportDailyRow[];
  reservationsByDay: ReportDailyRow[];
};

const CHANNEL_ORDER = ["Web", "WhatsApp", "Teléfono", "Presencial"] as const;

function formatUtcDateKey(date: Date) {
  return formatSharedUtcDateKey(date);
}

export function normalizeDateKey(value: Date | string | null | undefined) {
  return normalizeSharedDateKey(value);
}

function parseDateKey(value: string | null | undefined) {
  return parseDateKeyToUtcDate(value);
}

export function formatDisplayDate(value: string) {
  return formatSharedDisplayDate(value);
}

function startOfMonthIso(value: string) {
  return startOfMonthDateKey(value);
}

function endOfMonthIso(value: string) {
  return endOfMonthDateKey(value);
}

function startOfWeekIso(value: string) {
  return startOfWeekDateKey(value);
}

function endOfWeekIso(value: string) {
  return endOfWeekDateKey(value);
}

function isWithinRange(date: string, range: ReportDateRange) {
  return isDateWithinRange(date, range.from, range.to);
}

function getReservationSubtotal(reservation: RestaurantReservation) {
  return (reservation.consumptionItems ?? []).reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
}

function getLatestReservationDate(reservations: RestaurantReservation[]) {
  const sortedDates = [
    ...new Set(
      reservations
        .map((reservation) => normalizeDateKey(reservation.date))
        .filter((dateKey): dateKey is string => Boolean(dateKey))
    ),
  ].sort();
  return sortedDates.at(-1) ?? getTodayDateKey();
}

export function getReportReferenceDate(reservations: RestaurantReservation[]) {
  return getLatestReservationDate(reservations);
}

function buildPeriodRange(
  period: ReportPeriod,
  reportDate: string,
  customRange: ReportDateRange
) {
  const normalizedReportDate = normalizeDateKey(reportDate) ?? getTodayDateKey();

  if (period === "Personalizado") {
    const from = normalizeDateKey(customRange.from) ?? normalizedReportDate;
    const to = normalizeDateKey(customRange.to) ?? normalizedReportDate;

    return from <= to
      ? { from, to }
      : {
          from: to,
          to: from,
        };
  }

  if (period === "Semana") {
    return {
      from: startOfWeekIso(normalizedReportDate),
      to: endOfWeekIso(normalizedReportDate),
    };
  }

  if (period === "Mes") {
    return {
      from: startOfMonthIso(normalizedReportDate),
      to: endOfMonthIso(normalizedReportDate),
    };
  }

  return {
    from: normalizedReportDate,
    to: normalizedReportDate,
  };
}

function formatDayLabel(date: string) {
  return formatDisplayDate(date);
}

function buildDailyRows(
  range: ReportDateRange,
  reservations: RestaurantReservation[]
): ReportDailyRow[] {
  const rows: ReportDailyRow[] = [];
  const startDate = parseDateKey(range.from);
  const endDate = parseDateKey(range.to);

  if (!startDate || !endDate) {
    return rows;
  }

  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const date = formatUtcDateKey(cursor);
    const dailyReservations = reservations.filter(
      (reservation) => normalizeDateKey(reservation.date) === date
    );
    const sales = dailyReservations
      .filter((reservation) => reservation.status === "Completada")
      .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

    rows.push({
      date,
      label: formatDayLabel(date),
      sales,
      reservations: dailyReservations.length,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return rows;
}

function getCompletedReservations(reservations: RestaurantReservation[]) {
  return reservations.filter((reservation) => reservation.status === "Completada");
}

function buildProductRows(
  reservations: RestaurantReservation[],
  menuItems: MenuItem[]
) {
  const menuItemById = new Map(menuItems.map((item) => [item.id, item] as const));
  const rows = new Map<string, ReportProductRow>();

  for (const reservation of getCompletedReservations(reservations)) {
    for (const item of reservation.consumptionItems ?? []) {
      const catalogItem = menuItemById.get(item.productId);
      const existing = rows.get(item.productId);
      const category = catalogItem?.category ?? item.category;
      const productName = catalogItem?.name ?? item.productName;

      if (!existing) {
        rows.set(item.productId, {
          productId: item.productId,
          productName,
          category,
          quantity: item.quantity,
          revenue: item.lineTotal,
        });
        continue;
      }

      rows.set(item.productId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.lineTotal,
      });
    }
  }

  return [...rows.values()].sort(
    (left, right) => right.quantity - left.quantity || right.revenue - left.revenue
  );
}

function buildChannelBreakdown(reservations: RestaurantReservation[]) {
  const counts = new Map<string, number>();

  for (const reservation of reservations) {
    counts.set(reservation.channel, (counts.get(reservation.channel) ?? 0) + 1);
  }

  return CHANNEL_ORDER.map((channel) => {
    const count = counts.get(channel) ?? 0;
    const percentage = reservations.length > 0 ? Math.round((count / reservations.length) * 100) : 0;

    return {
      channel,
      count,
      percentage,
    };
  });
}

function buildStatusBreakdown(reservations: RestaurantReservation[]) {
  const statusOrder: ReservationStatus[] = [
    "Pendiente",
    "Confirmada",
    "Ocupada",
    "Completada",
    "Cancelada",
    "No-show",
  ];
  const counts = new Map<ReservationStatus, number>();

  for (const reservation of reservations) {
    counts.set(reservation.status, (counts.get(reservation.status) ?? 0) + 1);
  }

  return statusOrder.map((status) => {
    const count = counts.get(status) ?? 0;
    const percentage = reservations.length > 0 ? Math.round((count / reservations.length) * 100) : 0;

    return {
      status,
      count,
      percentage,
    };
  });
}

function buildCustomerMetrics(
  customers: Customer[],
  range: ReportDateRange,
  periodReservations: RestaurantReservation[]
) {
  const reservationHistoryByCustomer = customers.map((customer) => {
    const history = [...(customer.reservationHistory ?? [])].sort((left, right) =>
      `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)
    );
    const historyInRange = history.filter((entry) => isWithinRange(entry.date, range));
    const firstReservationDate = history[0]?.date ?? null;

    return {
      customer,
      history,
      historyInRange,
      firstReservationDate,
    };
  });

  const newCustomers = reservationHistoryByCustomer.filter(
    (entry) => entry.firstReservationDate && isWithinRange(entry.firstReservationDate, range)
  ).length;

  const recurrentCustomers = reservationHistoryByCustomer.filter((entry) => {
    if (entry.historyInRange.length === 0) {
      return false;
    }

    if (entry.firstReservationDate && isWithinRange(entry.firstReservationDate, range)) {
      return false;
    }

    if (entry.historyInRange.length > 1) {
      return true;
    }

    return (entry.customer.visits ?? 0) > 1;
  }).length;

  const completedReservations = getCompletedReservations(periodReservations);
  const totalRevenue = completedReservations.reduce(
    (sum, reservation) => sum + getReservationSubtotal(reservation),
    0
  );
  const averageTicket = completedReservations.length
    ? Math.round(totalRevenue / completedReservations.length)
    : 0;
  const vipCustomers = customers.filter(
    (customer) => customer.vip || customer.visits >= 10 || customer.totalSpent >= 240000
  ).length;
  const frequentCustomers = customers.filter((customer) => customer.visits >= 5).length;

  return {
    total: customers.length,
    newCustomers,
    recurrentCustomers,
    averageTicket,
    vipCustomers,
    frequentCustomers,
  };
}

function buildSalesComparison(
  reservations: RestaurantReservation[],
  todayKey: string
) {
  const completedReservations = getCompletedReservations(reservations);
  const salesOnDate = (date: string) =>
    completedReservations
      .filter((reservation) => normalizeDateKey(reservation.date) === date)
      .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  const today = salesOnDate(todayKey);
  const weekRange = buildPeriodRange("Semana", todayKey, {
    from: todayKey,
    to: todayKey,
  });
  const monthRange = buildPeriodRange("Mes", todayKey, {
    from: todayKey,
    to: todayKey,
  });

  const week = completedReservations
    .filter((reservation) => isWithinRange(reservation.date, weekRange))
    .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  const month = completedReservations
    .filter((reservation) => isWithinRange(reservation.date, monthRange))
    .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  return { today, week, month };
}

export function calculateReports({
  reservations,
  customers,
  tables,
  menuItems,
  todayDate,
  period,
  customRange,
}: {
  reservations: RestaurantReservation[];
  customers: Customer[];
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  todayDate: string | null;
  period: ReportPeriod;
  customRange: ReportDateRange;
}): ReportAnalytics {
  const referenceDate = getLatestReservationDate(reservations);
  const todayKey = normalizeDateKey(todayDate) ?? referenceDate;
  // Todas las metricas pasan por date keys yyyy-mm-dd para evitar mezclar dd/mm/yyyy con ISO.
  const periodRange = buildPeriodRange(period, todayKey, customRange);
  const periodReservations = reservations.filter((reservation) =>
    isWithinRange(reservation.date, periodRange)
  );
  const completedPeriodReservations = getCompletedReservations(periodReservations);

  const salesTotal = completedPeriodReservations.reduce(
    (sum, reservation) => sum + getReservationSubtotal(reservation),
    0
  );

  const occupancyTables = tables.filter((table) => table.status !== "Fuera de servicio");
  const occupiedTables = occupancyTables.filter((table) => table.status === "Ocupada").length;
  const freeTables = occupancyTables.filter((table) => table.status === "Libre").length;
  const reservedTables = occupancyTables.filter((table) => table.status === "Reservada").length;
  const nextReservationTables = occupancyTables.filter(
    (table) => table.status === "Próxima reserva"
  ).length;
  const outOfServiceTables = tables.filter((table) => table.status === "Fuera de servicio").length;
  const occupancyPercentage =
    occupancyTables.length > 0 ? Math.round((occupiedTables / occupancyTables.length) * 100) : 0;

  const salesByDay = buildDailyRows(periodRange, reservations);
  const reservationsByDay = buildDailyRows(periodRange, periodReservations);
  const topProducts = buildProductRows(periodReservations, menuItems);
  const beverageProducts = topProducts.filter((product) =>
    ["Bebidas", "Vinos", "Tragos"].includes(product.category)
  );

  return {
    referenceDate,
    todayDate: todayKey,
    todayLabel: formatDisplayDate(todayKey),
    periodRange,
    selectedLabel:
      period === "Personalizado"
        ? `${formatDisplayDate(periodRange.from)} al ${formatDisplayDate(periodRange.to)}`
        : period,
    comparisonSales: buildSalesComparison(reservations, todayKey),
    salesTotal,
    reservationCounts: {
      total: periodReservations.length,
      completed: completedPeriodReservations.length,
      cancelled: periodReservations.filter((reservation) => reservation.status === "Cancelada").length,
      noShow: periodReservations.filter((reservation) => reservation.status === "No-show").length,
    },
    occupancy: {
      occupied: occupiedTables,
      free: freeTables,
      reserved: reservedTables,
      nextReservation: nextReservationTables,
      outOfService: outOfServiceTables,
      percentage: occupancyPercentage,
    },
    customers: buildCustomerMetrics(customers, periodRange, periodReservations),
    topProducts,
    beverageProducts,
    channelBreakdown: buildChannelBreakdown(periodReservations),
    statusBreakdown: buildStatusBreakdown(periodReservations),
    salesByDay,
    reservationsByDay,
  };
}

export function buildReportAnalytics(args: Parameters<typeof calculateReports>[0]) {
  return calculateReports(args);
}
