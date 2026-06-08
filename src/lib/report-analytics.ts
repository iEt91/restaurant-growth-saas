import type { Customer, MenuItem, RestaurantTable, ReservationStatus } from "@/types/domain";
import type { RestaurantReservation } from "@/data/restaurant-ops";

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

function parseIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string) {
  const parsedDate = parseIsoDate(value);

  if (!parsedDate) {
    return value;
  }

  const day = String(parsedDate.getUTCDate()).padStart(2, "0");
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const year = parsedDate.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function shiftIsoDate(value: string, offsetDays: number) {
  const date = parseIsoDate(value);

  if (!date) {
    return value;
  }

  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatIsoDate(date);
}

function startOfMonthIso(value: string) {
  const date = parseIsoDate(value);

  if (!date) {
    return value;
  }

  date.setUTCDate(1);
  return formatIsoDate(date);
}

function isWithinRange(date: string, range: ReportDateRange) {
  return date >= range.from && date <= range.to;
}

function getReservationSubtotal(reservation: RestaurantReservation) {
  return (reservation.consumptionItems ?? []).reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
}

function getLatestReservationDate(reservations: RestaurantReservation[]) {
  const sortedDates = [...new Set(reservations.map((reservation) => reservation.date))].sort();
  return sortedDates.at(-1) ?? "2026-06-14";
}

export function getReportReferenceDate(reservations: RestaurantReservation[]) {
  return getLatestReservationDate(reservations);
}

function buildPeriodRange(
  period: ReportPeriod,
  referenceDate: string,
  customRange: ReportDateRange
) {
  if (period === "Personalizado") {
    const from = customRange.from || referenceDate;
    const to = customRange.to || referenceDate;

    return from <= to
      ? { from, to }
      : {
          from: to,
          to: from,
        };
  }

  if (period === "Semana") {
    return {
      from: shiftIsoDate(referenceDate, -6),
      to: referenceDate,
    };
  }

  if (period === "Mes") {
    return {
      from: startOfMonthIso(referenceDate),
      to: referenceDate,
    };
  }

  return {
    from: referenceDate,
    to: referenceDate,
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
  const startDate = parseIsoDate(range.from);
  const endDate = parseIsoDate(range.to);

  if (!startDate || !endDate) {
    return rows;
  }

  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const date = formatIsoDate(cursor);
    const dailyReservations = reservations.filter((reservation) => reservation.date === date);
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

function buildProductRows(
  reservations: RestaurantReservation[],
  menuItems: MenuItem[]
) {
  const menuItemById = new Map(menuItems.map((item) => [item.id, item] as const));
  const rows = new Map<string, ReportProductRow>();

  for (const reservation of reservations) {
    if (reservation.status !== "Completada") {
      continue;
    }

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

  const completedReservations = periodReservations.filter(
    (reservation) => reservation.status === "Completada"
  );
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
  referenceDate: string,
  todayDate: string | null
) {
  const salesOnDate = (date: string) =>
    reservations
      .filter((reservation) => reservation.date === date && reservation.status === "Completada")
      .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  const today = todayDate ? salesOnDate(todayDate) : 0;
  const weekRange = buildPeriodRange("Semana", referenceDate, {
    from: referenceDate,
    to: referenceDate,
  });
  const monthRange = buildPeriodRange("Mes", referenceDate, {
    from: referenceDate,
    to: referenceDate,
  });

  const week = reservations
    .filter((reservation) => isWithinRange(reservation.date, weekRange))
    .filter((reservation) => reservation.status === "Completada")
    .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  const month = reservations
    .filter((reservation) => isWithinRange(reservation.date, monthRange))
    .filter((reservation) => reservation.status === "Completada")
    .reduce((sum, reservation) => sum + getReservationSubtotal(reservation), 0);

  return { today, week, month };
}

export function buildReportAnalytics({
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
  const periodRange = buildPeriodRange(period, referenceDate, customRange);
  const periodReservations = reservations.filter((reservation) =>
    isWithinRange(reservation.date, periodRange)
  );

  const completedReservations = periodReservations.filter(
    (reservation) => reservation.status === "Completada"
  );
  const salesTotal = completedReservations.reduce(
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
    todayDate,
    todayLabel: todayDate ? formatDisplayDate(todayDate) : null,
    periodRange,
    selectedLabel:
      period === "Personalizado"
        ? `${formatDisplayDate(periodRange.from)} al ${formatDisplayDate(periodRange.to)}`
        : period,
    comparisonSales: buildSalesComparison(reservations, referenceDate, todayDate),
    salesTotal,
    reservationCounts: {
      total: periodReservations.length,
      completed: periodReservations.filter((reservation) => reservation.status === "Completada").length,
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
