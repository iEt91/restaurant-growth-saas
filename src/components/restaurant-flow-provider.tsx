"use client";

import * as React from "react";
import type {
  Customer,
  CustomerConsumptionHistoryItem,
  CustomerReservationHistoryItem,
  MenuItem,
  RestaurantTable,
  ReservationStatus,
  TableConsumptionItem,
} from "@/types/domain";
import {
  restaurantReservations,
  restaurantTables,
  type RestaurantReservation,
} from "@/data/restaurant-ops";
import { customers as seededCustomers, menuItems as seededMenuItems } from "@/data/mock";
import {
  formatDisplayDate,
  getTodayDateKey,
  isFutureDate,
  isPastDate,
  isToday,
  normalizeDateKey,
} from "@/lib/date-utils";
import {
  getReservationWindow,
  type BusinessHourBlock,
  windowsOverlap as timeWindowsOverlap,
} from "@/lib/operation-time";

type TableOverrideStatus = RestaurantTable["status"];
export const businessDays = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
] as const;

export type BusinessDayName = (typeof businessDays)[number];
export type BusinessHours = Record<BusinessDayName, BusinessHourBlock[]>;

export type RestaurantProfile = {
  name: string;
  city: string;
  description: string;
  cuisine: string;
  phone: string;
  email: string;
  active: boolean;
};

type ReservationMutationResult = {
  reservation: RestaurantReservation | null;
  warning: string | null;
  error: string | null;
};

type ReservationDraft = Pick<
  RestaurantReservation,
  "id" | "date" | "time" | "partySize" | "tableName"
>;

type ReservationTableOption = {
  id: string;
  name: string;
  capacity: number;
  status: TableOverrideStatus;
  available: boolean;
  label: string;
  reason: string | null;
};

type RestaurantFlowContextValue = {
  restaurantProfile: RestaurantProfile;
  businessHours: BusinessHours;
  customers: Customer[];
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  autoConfirmReservations: boolean;
  allowWaitlist: boolean;
  standardReservationDurationMinutes: number;
  intervalBetweenReservationsMinutes: number;
  updateRestaurantProfile: (profile: RestaurantProfile) => void;
  saveBusinessHourBlock: (
    day: BusinessDayName,
    block: BusinessHourBlock
  ) => void;
  deleteBusinessHourBlock: (day: BusinessDayName, blockId: string) => void;
  saveCustomer: (customer: Customer) => void;
  saveReservation: (reservation: RestaurantReservation) => ReservationMutationResult;
  saveMenuItem: (menuItem: MenuItem) => void;
  deleteMenuItem: (menuItemId: string) => void;
  updateReservationStatus: (
    reservationId: string,
    nextStatus: ReservationStatus
  ) => ReservationMutationResult;
  updateTableStatus: (tableId: string, nextStatus: TableOverrideStatus) => void;
  setMenuItemActive: (menuItemId: string, active: boolean) => void;
  setAutoConfirmReservations: (enabled: boolean) => void;
  setAllowWaitlist: (enabled: boolean) => void;
  setStandardReservationDurationMinutes: (minutes: number) => void;
  setIntervalBetweenReservationsMinutes: (minutes: number) => void;
  getReservationById: (reservationId: string | null) => RestaurantReservation | null;
  getReservationForTable: (tableName: string) => RestaurantReservation | null;
  getActiveReservationForTable: (tableName: string) => RestaurantReservation | null;
  getReservationTableOptions: (
    reservation: ReservationDraft
  ) => ReservationTableOption[];
  getConsumptionItemsForReservation: (
    reservationId: string | null
  ) => TableConsumptionItem[];
  saveConsumptionItems: (
    reservationId: string,
    items: TableConsumptionItem[]
  ) => void;
  openReservationDetail: (reservationId: string) => void;
  focusedReservationId: string | null;
  clearFocusedReservation: () => void;
};

const RestaurantFlowContext = React.createContext<RestaurantFlowContextValue | null>(
  null
);

const activeReservationStatuses = new Set<ReservationStatus>(["Confirmada", "Ocupada"]);
const terminalReservationStatuses = new Set<ReservationStatus>([
  "Completada",
  "Cancelada",
  "No-show",
]);

const initialRestaurantProfile: RestaurantProfile = {
  name: "Avenida 312",
  city: "Buenos Aires",
  description: "Restaurante contemporáneo con operación de salón y reservas.",
  cuisine: "Contemporánea",
  phone: "+54 11 5555-1101",
  email: "hola@avenida312.com",
  active: true,
};

const initialBusinessHours: BusinessHours = {
  Lunes: [
    { id: "mon-1", start: "08:00", end: "12:00" },
    { id: "mon-2", start: "20:00", end: "00:00" },
  ],
  Martes: [],
  Miercoles: [{ id: "wed-1", start: "12:00", end: "00:00" }],
  Jueves: [{ id: "thu-1", start: "12:00", end: "00:00" }],
  Viernes: [
    { id: "fri-1", start: "12:00", end: "16:00" },
    { id: "fri-2", start: "20:00", end: "01:00" },
  ],
  Sabado: [{ id: "sat-1", start: "12:00", end: "01:00" }],
  Domingo: [{ id: "sun-1", start: "12:00", end: "23:00" }],
};

const FUTURE_OCCUPY_ERROR =
  "No podés ocupar una reserva futura. Esta acción estará disponible el día de la reserva.";
const FUTURE_COMPLETE_ERROR = "No podés completar una reserva futura.";
const PAST_OCCUPY_ERROR = "No podés ocupar una reserva de una fecha pasada.";

function normalizeContactValue(value: string) {
  return value.trim().toLowerCase();
}

function getCustomerContactKey(phone: string, email: string) {
  return normalizeContactValue(email || phone);
}

function buildContactKeys(customer: Customer) {
  return Array.from(
    new Set([
      ...(customer.contactKeys ?? []),
      getCustomerContactKey(customer.phone, customer.email),
    ])
  );
}

function splitListField(value: string) {
  return value
    .split(/[,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeUniqueStrings(base: string[], next: string[]) {
  return Array.from(new Set([...base, ...next].filter(Boolean)));
}

function buildCustomerName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function parseReservationWindow(
  reservation: Pick<RestaurantReservation, "date" | "time">,
  durationMinutes: number,
  intervalMinutes: number
) {
  const window = getReservationWindow(
    reservation.time,
    durationMinutes,
    intervalMinutes
  );
  const date = normalizeDateKey(reservation.date);

  if (!window || !date) {
    return null;
  }

  return {
    date,
    ...window,
  };
}

function sortTablesByCapacity(tables: RestaurantTable[]) {
  return [...tables].sort(
    (left, right) => left.capacity - right.capacity || left.name.localeCompare(right.name)
  );
}

function getReservationTableAvailability(
  table: RestaurantTable,
  reservation: ReservationDraft,
  reservations: RestaurantReservation[],
  durationMinutes: number,
  intervalMinutes: number
) {
  if (table.status === "Fuera de servicio") {
    return {
      available: false,
      reason: "Fuera de servicio",
    };
  }

  if (table.capacity < reservation.partySize) {
    return {
      available: false,
      reason: "Capacidad insuficiente",
    };
  }

  const candidateWindow = parseReservationWindow(
    reservation,
    durationMinutes,
    intervalMinutes
  );

  if (!candidateWindow) {
    return {
      available: false,
      reason: "Horario inválido",
    };
  }

  const blockingReservations = reservations.filter(
    (currentReservation) =>
      currentReservation.id !== reservation.id &&
      currentReservation.tableName === table.name &&
      isBlockingReservationStatus(currentReservation.status)
  );
  const currentReservationOwnsTable = reservations.some(
    (currentReservation) =>
      currentReservation.id === reservation.id &&
      currentReservation.tableName === table.name &&
      isBlockingReservationStatus(currentReservation.status)
  );

  const isCandidateForToday = isToday(candidateWindow.date);

  if (
    isCandidateForToday &&
    table.status !== "Libre" &&
    blockingReservations.length === 0 &&
    !currentReservationOwnsTable
  ) {
    return {
      available: false,
      reason:
        table.status === "Ocupada"
          ? "Mesa ocupada"
          : table.status === "Reservada"
            ? "Mesa reservada"
            : "No disponible",
    };
  }

  const hasConflict = blockingReservations.some((currentReservation) => {
    const currentWindow = parseReservationWindow(
      currentReservation,
      durationMinutes,
      intervalMinutes
    );

    if (!currentWindow) {
      return false;
    }

    return reservationWindowsOverlap(candidateWindow, currentWindow);
  });

  if (hasConflict) {
    return {
      available: false,
      reason: "Conflicto horario",
    };
  }

  return {
    available: true,
    reason: null,
  };
}

function buildTableAvailabilityOptions(
  reservation: ReservationDraft,
  reservations: RestaurantReservation[],
  tables: RestaurantTable[],
  durationMinutes: number,
  intervalMinutes: number
) {
  return sortTablesByCapacity(tables).map((table) => {
    const availability = getReservationTableAvailability(
      table,
      reservation,
      reservations,
      durationMinutes,
      intervalMinutes
    );

    return {
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      available: availability.available,
      reason: availability.reason,
      label: `${table.name} — ${table.capacity}p — ${
        availability.available ? "Disponible" : availability.reason ?? "No disponible"
      }`,
    } satisfies ReservationTableOption;
  });
}

function resolveReservationTableDecision({
  reservation,
  reservations,
  tables,
  durationMinutes,
  intervalMinutes,
}: {
  reservation: ReservationDraft;
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  durationMinutes: number;
  intervalMinutes: number;
}) {
  const requestedTableName = normalizeTableName(reservation.tableName);
  const requestedTable = requestedTableName
    ? tables.find((table) => table.name === requestedTableName) ?? null
    : null;

  if (requestedTable) {
    const requestedAvailability = getReservationTableAvailability(
      requestedTable,
      reservation,
      reservations,
      durationMinutes,
      intervalMinutes
    );

    if (requestedAvailability.available) {
      return {
        tableName: requestedTable.name,
        warning: null,
        error: null,
      };
    }

    return {
      tableName: "",
      warning: null,
      error: "Esa mesa no está disponible para el horario seleccionado.",
    };
  }

  const nextAvailableTable = sortTablesByCapacity(tables).find(
    (table) =>
      getReservationTableAvailability(
        table,
        reservation,
        reservations,
        durationMinutes,
        intervalMinutes
      ).available
  );

  if (nextAvailableTable) {
    return {
      tableName: nextAvailableTable.name,
      warning: "Mesa asignada automáticamente.",
      error: null,
    };
  }

  return {
    tableName: "",
    warning: "No se encontró mesa disponible automáticamente.",
    error: reservation.tableName.trim() ? null : null,
  };
}

function buildReservationDateLabel(date: string) {
  return formatDisplayDate(date);
}

function reservationWindowsOverlap(
  left: { date: string; start: number; end: number },
  right: { date: string; start: number; end: number }
) {
  if (left.date !== right.date) {
    return false;
  }

  return timeWindowsOverlap(left, right);
}

function normalizeTableName(tableName: string) {
  const normalized = tableName.trim();

  if (!normalized || normalized === "—" || normalized === "â€”") {
    return "";
  }

  return normalized;
}

function isBlockingReservationStatus(status: ReservationStatus) {
  return status === "Confirmada" || status === "Ocupada";
}

function isOperationalReservation(reservation: RestaurantReservation, todayKey: string) {
  return activeReservationStatuses.has(reservation.status) && isToday(reservation.date, todayKey);
}

function getReservationStatusTransitionError(
  reservation: RestaurantReservation,
  nextStatus: ReservationStatus,
  todayKey: string
) {
  const reservationIsFuture = isFutureDate(reservation.date, todayKey);
  const reservationIsPast = isPastDate(reservation.date, todayKey);

  if (reservationIsFuture) {
    if (nextStatus === "Ocupada") return FUTURE_OCCUPY_ERROR;
    if (nextStatus === "Completada") return FUTURE_COMPLETE_ERROR;
    if (nextStatus === "No-show") {
      return "No podés marcar no-show en una reserva futura.";
    }
  }

  if (reservationIsPast && nextStatus === "Ocupada") {
    return PAST_OCCUPY_ERROR;
  }

  return null;
}

function buildCustomerFromReservation(
  reservation: RestaurantReservation
): Customer {
  const fullName = buildCustomerName(reservation.firstName, reservation.lastName);

  return {
    id: crypto.randomUUID(),
    fullName,
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phone: reservation.phone,
    email: reservation.email,
    birthday: reservation.birthday,
    visits: 0,
    totalSpent: 0,
    averageTicket: 0,
    preferences: splitListField(reservation.preferences),
    allergies: splitListField(reservation.allergies),
    lastVisit: "",
    reservations: [],
    notes: reservation.comments,
    vip: false,
    contactKeys: [getCustomerContactKey(reservation.phone, reservation.email)],
    reservationHistory: [],
    consumptionHistory: [],
    favoriteProducts: [],
  };
}

function buildCustomerReservationHistoryItem(
  reservation: RestaurantReservation
): CustomerReservationHistoryItem {
  return {
    id: reservation.id,
    date: reservation.date,
    time: reservation.time,
    status: reservation.status,
    tableName: reservation.tableName,
    partySize: reservation.partySize,
    channel: reservation.channel,
  };
}

function buildCustomerConsumptionHistoryItem(
  reservation: RestaurantReservation
): CustomerConsumptionHistoryItem {
  const items = reservation.consumptionItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: `consumption-${reservation.id}`,
    reservationId: reservation.id,
    date: reservation.date,
    tableName: reservation.tableName,
    items,
    subtotal,
  };
}

function buildGuestName(reservation: RestaurantReservation) {
  return `${reservation.firstName} ${reservation.lastName}`.trim();
}

function deriveStatusFromReservation(status: ReservationStatus): TableOverrideStatus {
  if (status === "Confirmada") return "Reservada";
  if (status === "Ocupada") return "Ocupada";
  return "Libre";
}

function getSyncedTableStatus({
  baseStatus,
  overrideStatus,
  activeReservation,
}: {
  baseStatus: TableOverrideStatus;
  overrideStatus: TableOverrideStatus | undefined;
  activeReservation: RestaurantReservation | null;
}) {
  if (activeReservation) {
    return deriveStatusFromReservation(activeReservation.status);
  }

  const effectiveStatus = overrideStatus ?? baseStatus;

  if (effectiveStatus === "Fuera de servicio") {
    return effectiveStatus;
  }

  if (effectiveStatus === "Próxima reserva") {
    return effectiveStatus;
  }

  return "Libre";
}

function preserveConsumptionItems(
  nextReservation: RestaurantReservation,
  currentReservation: RestaurantReservation | undefined
) {
  return nextReservation.consumptionItems ?? currentReservation?.consumptionItems;
}

function groupConsumptionItems(items: TableConsumptionItem[]) {
  const grouped = new Map<string, TableConsumptionItem>();

  for (const item of items) {
    const existing = grouped.get(item.productId);

    if (!existing) {
      grouped.set(item.productId, { ...item });
      continue;
    }

    const nextQuantity = existing.quantity + item.quantity;
    const nextLineTotal = existing.lineTotal + item.lineTotal;

    grouped.set(item.productId, {
      ...existing,
      quantity: nextQuantity,
      lineTotal: nextLineTotal,
      unitPrice: nextQuantity > 0 ? Math.round(nextLineTotal / nextQuantity) : existing.unitPrice,
    });
  }

  return Array.from(grouped.values());
}

export function RestaurantFlowProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialCustomerProfiles = React.useMemo(
    () =>
      seededCustomers.map((customer) => ({
        ...customer,
        contactKeys: buildContactKeys(customer),
        reservationHistory: customer.reservationHistory ?? [],
        consumptionHistory: customer.consumptionHistory ?? [],
        favoriteProducts: customer.favoriteProducts ?? [],
      })),
    []
  );
  const [reservations, setReservations] = React.useState<RestaurantReservation[]>(
    restaurantReservations
  );
  const [restaurantProfile, setRestaurantProfile] =
    React.useState<RestaurantProfile>(initialRestaurantProfile);
  const [businessHours, setBusinessHours] =
    React.useState<BusinessHours>(initialBusinessHours);
  const [autoConfirmReservations, setAutoConfirmReservations] = React.useState(true);
  const [allowWaitlist, setAllowWaitlist] = React.useState(true);
  const [customerProfiles, setCustomerProfiles] = React.useState<Customer[]>(
    initialCustomerProfiles
  );
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>(seededMenuItems);
  const [tableOverrides, setTableOverrides] = React.useState<
    Record<string, TableOverrideStatus>
  >({});
  const [standardReservationDurationMinutes, setStandardReservationDurationMinutes] =
    React.useState(90);
  const [intervalBetweenReservationsMinutes, setIntervalBetweenReservationsMinutes] =
    React.useState(15);
  const [focusedReservationId, setFocusedReservationId] = React.useState<string | null>(
    null
  );
  const todayDateKey = getTodayDateKey();

  const updateRestaurantProfile = React.useCallback((profile: RestaurantProfile) => {
    setRestaurantProfile(profile);
  }, []);

  const saveBusinessHourBlock = React.useCallback(
    (day: BusinessDayName, block: BusinessHourBlock) => {
      setBusinessHours((current) => {
        const dayBlocks = current[day];
        const exists = dayBlocks.some((currentBlock) => currentBlock.id === block.id);

        return {
          ...current,
          [day]: exists
            ? dayBlocks.map((currentBlock) =>
                currentBlock.id === block.id ? block : currentBlock
              )
            : [...dayBlocks, block].sort((left, right) =>
                left.start.localeCompare(right.start)
              ),
        };
      });
    },
    []
  );

  const deleteBusinessHourBlock = React.useCallback(
    (day: BusinessDayName, blockId: string) => {
      setBusinessHours((current) => ({
        ...current,
        [day]: current[day].filter((block) => block.id !== blockId),
      }));
    },
    []
  );

  const updateStandardReservationDurationMinutes = React.useCallback((minutes: number) => {
    setStandardReservationDurationMinutes(Math.max(15, Math.round(minutes || 0)));
  }, []);

  const updateIntervalBetweenReservationsMinutes = React.useCallback((minutes: number) => {
    setIntervalBetweenReservationsMinutes(Math.max(0, Math.round(minutes || 0)));
  }, []);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.status === "Ocupada" && isToday(reservation.date)
            ? {
                ...reservation,
                occupiedMinutesElapsed: (reservation.occupiedMinutesElapsed ?? 0) + 1,
              }
            : reservation
        )
      );
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const getReservationById = React.useCallback(
    (reservationId: string | null) => {
      if (!reservationId) {
        return null;
      }

      return reservations.find((reservation) => reservation.id === reservationId) ?? null;
    },
    [reservations]
  );

  const getReservationForTable = React.useCallback(
    (tableName: string) =>
      reservations.find((reservation) => reservation.tableName === tableName) ?? null,
    [reservations]
  );

  const getActiveReservationForTable = React.useCallback(
    (tableName: string) =>
      reservations.find(
        (reservation) =>
          reservation.tableName === tableName &&
          isOperationalReservation(reservation, todayDateKey)
      ) ?? null,
    [reservations, todayDateKey]
  );

  const getConsumptionItemsForReservation = React.useCallback(
    (reservationId: string | null) => {
      if (!reservationId) {
        return [];
      }

      return (
        reservations.find((reservation) => reservation.id === reservationId)
          ?.consumptionItems ?? []
      );
    },
    [reservations]
  );

  const saveCustomer = React.useCallback((customer: Customer) => {
    setCustomerProfiles((current) => {
      const nextCustomer: Customer = {
        ...customer,
        contactKeys: buildContactKeys(customer),
        reservationHistory: customer.reservationHistory ?? [],
        consumptionHistory: customer.consumptionHistory ?? [],
        favoriteProducts: customer.favoriteProducts ?? [],
      };

      const existingIndexById = current.findIndex((item) => item.id === nextCustomer.id);
      const existingIndexByContact =
        existingIndexById >= 0
          ? existingIndexById
          : current.findIndex((item) =>
              buildContactKeys(item).some((contactKey) =>
                (nextCustomer.contactKeys ?? []).includes(contactKey)
              )
            );

      if (existingIndexByContact >= 0) {
        return current.map((item, index) =>
          index === existingIndexByContact ? nextCustomer : item
        );
      }

      return [nextCustomer, ...current];
    });
  }, []);

  const syncCustomerProfileForReservation = React.useCallback(
    (reservation: RestaurantReservation) => {
      setCustomerProfiles((current) => {
        const reservationContactKey = getCustomerContactKey(
          reservation.phone,
          reservation.email
        );
        const existingIndex = current.findIndex((item) =>
          buildContactKeys(item).includes(reservationContactKey)
        );

        const baseCustomer =
          existingIndex >= 0
            ? current[existingIndex]
            : buildCustomerFromReservation(reservation);

        const nextCustomer: Customer = {
          ...baseCustomer,
          fullName: buildCustomerName(reservation.firstName, reservation.lastName),
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          phone: reservation.phone,
          email: reservation.email,
          birthday: reservation.birthday || baseCustomer.birthday,
          preferences: mergeUniqueStrings(
            baseCustomer.preferences,
            splitListField(reservation.preferences)
          ),
          allergies: mergeUniqueStrings(
            baseCustomer.allergies,
            splitListField(reservation.allergies)
          ),
          notes: reservation.comments.trim() ? reservation.comments : baseCustomer.notes,
          reservations: mergeUniqueStrings(baseCustomer.reservations, [
            `${buildReservationDateLabel(reservation.date)} ${reservation.time}`,
          ]),
          contactKeys: buildContactKeys({
            ...baseCustomer,
            phone: reservation.phone,
            email: reservation.email,
          }),
        };

        if (existingIndex >= 0) {
          return current.map((item, index) =>
            index === existingIndex ? nextCustomer : item
          );
        }

        return [nextCustomer, ...current];
      });
    },
    []
  );

  const normalizedTableOverrides = React.useMemo(() => {
    const nextOverrides = { ...tableOverrides };

    for (const table of restaurantTables) {
      const hasActiveReservation = reservations.some(
        (reservation) =>
          reservation.tableName === table.name &&
          isOperationalReservation(reservation, todayDateKey)
      );
      const overrideStatus = nextOverrides[table.id];

      if (
        !hasActiveReservation &&
        (overrideStatus === "Ocupada" || overrideStatus === "Reservada")
      ) {
        nextOverrides[table.id] = "Libre";
      }
    }

    return nextOverrides;
  }, [reservations, tableOverrides, todayDateKey]);

  const tables = React.useMemo(() => {
    return restaurantTables.map((table) => {
      const activeReservation = getActiveReservationForTable(table.name);
      const overrideStatus = normalizedTableOverrides[table.id];
      const status = getSyncedTableStatus({
        baseStatus: table.status,
        overrideStatus,
        activeReservation,
      });

      return {
        ...table,
        status,
        currentGuest: activeReservation ? buildGuestName(activeReservation) : undefined,
        reservationTime: activeReservation ? activeReservation.time : undefined,
      };
    });
  }, [getActiveReservationForTable, normalizedTableOverrides]);

  const saveReservation = React.useCallback(
    (reservation: RestaurantReservation): ReservationMutationResult => {
      const currentReservation = reservations.find((item) => item.id === reservation.id);
      const policyError = getReservationStatusTransitionError(
        reservation,
        reservation.status,
        todayDateKey
      );

      if (policyError) {
        return {
          reservation: null,
          warning: null,
          error: policyError,
        };
      }

      const shouldResolveTable =
        reservation.status === "Pendiente" ||
        isBlockingReservationStatus(reservation.status);
      const decision = shouldResolveTable
        ? resolveReservationTableDecision({
            reservation: {
              id: reservation.id,
              date: reservation.date,
              time: reservation.time,
              partySize: reservation.partySize,
              tableName: reservation.tableName,
            },
            reservations,
            tables,
            durationMinutes: standardReservationDurationMinutes,
            intervalMinutes: intervalBetweenReservationsMinutes,
          })
        : {
            tableName: normalizeTableName(reservation.tableName),
            warning: null,
            error: null,
          };

      if (decision.error) {
        return {
          reservation: null,
          warning: null,
          error: decision.error,
        };
      }

      if (isBlockingReservationStatus(reservation.status) && !decision.tableName) {
        return {
          reservation: null,
          warning: null,
          error: "No hay mesas disponibles para este horario.",
        };
      }

      if (
        reservation.status === "Pendiente" &&
        !decision.tableName &&
        !allowWaitlist
      ) {
        return {
          reservation: null,
          warning: null,
          error: "No hay mesas disponibles para este horario.",
        };
      }

      if (
        reservation.status === "Ocupada" &&
        !normalizeTableName(reservation.tableName) &&
        !decision.tableName
      ) {
        return {
          reservation: null,
          warning: null,
          error: "No se puede marcar como ocupada sin mesa asignada.",
        };
      }

      const nextReservation: RestaurantReservation = {
        ...reservation,
        tableName: decision.tableName,
        occupiedMinutesElapsed:
          reservation.status === "Ocupada"
            ? currentReservation?.occupiedMinutesElapsed ?? 0
            : undefined,
        consumptionItems: preserveConsumptionItems(reservation, currentReservation),
      };

      syncCustomerProfileForReservation(nextReservation);

      setReservations((current) => {
        const exists = current.some((item) => item.id === reservation.id);

        if (exists) {
          return current.map((item) =>
            item.id === reservation.id ? nextReservation : item
          );
        }

        return [nextReservation, ...current];
      });

      return {
        reservation: nextReservation,
        warning:
          decision.warning ??
          (normalizeTableName(reservation.tableName) ||
          terminalReservationStatuses.has(reservation.status)
            ? null
            : decision.tableName
              ? "Mesa asignada automáticamente."
              : allowWaitlist
                ? "Reserva pendiente sin mesa asignada. Queda en lista de espera."
                : "No se encontró mesa disponible automáticamente."),
        error: null,
      };
    },
    [
      allowWaitlist,
      intervalBetweenReservationsMinutes,
      reservations,
      standardReservationDurationMinutes,
      syncCustomerProfileForReservation,
      tables,
      todayDateKey,
    ]
  );

  const saveMenuItem = React.useCallback((menuItem: MenuItem) => {
    setMenuItems((current) => {
      const exists = current.some((item) => item.id === menuItem.id);

      if (exists) {
        return current.map((item) => (item.id === menuItem.id ? menuItem : item));
      }

      return [menuItem, ...current];
    });
  }, []);

  const deleteMenuItem = React.useCallback((menuItemId: string) => {
    setMenuItems((current) => current.filter((item) => item.id !== menuItemId));
  }, []);

  const updateReservationStatus = React.useCallback(
    (
      reservationId: string,
      nextStatus: ReservationStatus
    ): ReservationMutationResult => {
      const currentReservation = reservations.find(
        (reservation) => reservation.id === reservationId
      );

      if (!currentReservation) {
        return {
          reservation: null,
          warning: "No encontramos la reserva para actualizar.",
          error: "No encontramos la reserva para actualizar.",
        };
      }

      const policyError = getReservationStatusTransitionError(
        currentReservation,
        nextStatus,
        todayDateKey
      );

      if (policyError) {
        return {
          reservation: null,
          warning: null,
          error: policyError,
        };
      }

      let nextReservation = {
        ...currentReservation,
        status: nextStatus,
        occupiedMinutesElapsed: nextStatus === "Ocupada" ? 0 : undefined,
        consumptionItems: currentReservation.consumptionItems ?? [],
      } satisfies RestaurantReservation;

      let warning: string | null = null;

      if (isBlockingReservationStatus(nextStatus)) {
        const decision = resolveReservationTableDecision({
          reservation: {
            id: currentReservation.id,
            date: currentReservation.date,
            time: currentReservation.time,
            partySize: currentReservation.partySize,
            tableName: currentReservation.tableName,
          },
          reservations,
          tables,
          durationMinutes: standardReservationDurationMinutes,
          intervalMinutes: intervalBetweenReservationsMinutes,
        });

        if (decision.error) {
          return {
            reservation: null,
            warning: null,
            error: decision.error,
          };
        }

        if (isBlockingReservationStatus(nextStatus) && !decision.tableName) {
          return {
            reservation: null,
            warning: null,
            error:
              nextStatus === "Ocupada"
                ? "No se puede marcar como ocupada sin mesa asignada."
                : "No hay mesas disponibles para este horario.",
          };
        }

        nextReservation = {
          ...nextReservation,
          tableName: decision.tableName,
        };
        warning = decision.warning;
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId ? nextReservation : reservation
        )
      );

      return {
        reservation: nextReservation,
        warning,
        error: null,
      };
    },
    [
      intervalBetweenReservationsMinutes,
      reservations,
      standardReservationDurationMinutes,
      tables,
      todayDateKey,
    ]
  );

  const getReservationTableOptions = React.useCallback(
    (reservation: ReservationDraft) =>
      buildTableAvailabilityOptions(
        reservation,
        reservations,
        tables,
        standardReservationDurationMinutes,
        intervalBetweenReservationsMinutes
      ),
    [
      intervalBetweenReservationsMinutes,
      reservations,
      standardReservationDurationMinutes,
      tables,
    ]
  );

  const saveConsumptionItems = React.useCallback(
    (reservationId: string, items: TableConsumptionItem[]) => {
      const groupedItems = groupConsumptionItems(items);

      setReservations((current) =>
        current.map((reservation) => {
          if (reservation.id !== reservationId) {
            return reservation;
          }

          if (reservation.status !== "Ocupada" || !isToday(reservation.date, todayDateKey)) {
            return reservation;
          }

          return {
            ...reservation,
            consumptionItems: groupedItems,
          };
        })
      );
    },
    [todayDateKey]
  );

  const setMenuItemActive = React.useCallback((menuItemId: string, active: boolean) => {
    setMenuItems((current) =>
      current.map((item) =>
        item.id === menuItemId
          ? {
              ...item,
              active,
            }
          : item
      )
    );
  }, []);

  const customers = React.useMemo(() => {
    const customerById = new Map<string, Customer>();
    const contactIndex = new Map<string, string>();

    function registerCustomer(customer: Customer) {
      const nextCustomer: Customer = {
        ...customer,
        contactKeys: buildContactKeys(customer),
        reservationHistory: customer.reservationHistory ?? [],
        consumptionHistory: customer.consumptionHistory ?? [],
        favoriteProducts: customer.favoriteProducts ?? [],
      };

      customerById.set(nextCustomer.id, nextCustomer);

      for (const contactKey of nextCustomer.contactKeys ?? []) {
        contactIndex.set(contactKey, nextCustomer.id);
      }
    }

    for (const customer of customerProfiles) {
      registerCustomer(customer);
    }

    for (const reservation of reservations) {
      const reservationContactKey = getCustomerContactKey(reservation.phone, reservation.email);
      const matchedCustomerId = contactIndex.get(reservationContactKey);
      let currentCustomer = matchedCustomerId
        ? customerById.get(matchedCustomerId) ?? null
        : null;

      if (!currentCustomer) {
        currentCustomer = buildCustomerFromReservation(reservation);
      }

      const reservationHistory = [
        ...(currentCustomer.reservationHistory ?? []),
        buildCustomerReservationHistoryItem(reservation),
      ];

      const reservationLabel = `${buildReservationDateLabel(reservation.date)} ${reservation.time}`;
      const updatedReservations = mergeUniqueStrings(currentCustomer.reservations, [
        reservationLabel,
      ]);
      const updatedPreferences = mergeUniqueStrings(
        currentCustomer.preferences,
        splitListField(reservation.preferences)
      );
      const updatedAllergies = mergeUniqueStrings(
        currentCustomer.allergies,
        splitListField(reservation.allergies)
      );

      const consumptionHistory = [...(currentCustomer.consumptionHistory ?? [])];
      const isCompletedReservation = reservation.status === "Completada";
      const completedConsumption = isCompletedReservation
        ? buildCustomerConsumptionHistoryItem(reservation)
        : null;

      if (completedConsumption) {
        consumptionHistory.push(completedConsumption);
      }

      const favoriteProductCounts = new Map<string, number>();
      for (const entry of consumptionHistory) {
        for (const item of entry.items) {
          favoriteProductCounts.set(
            item.productName,
            (favoriteProductCounts.get(item.productName) ?? 0) + item.quantity
          );
        }
      }

      const favoriteProducts = Array.from(favoriteProductCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([name]) => name);

      const visits = currentCustomer.visits + (isCompletedReservation ? 1 : 0);
      const totalSpent =
        currentCustomer.totalSpent + (completedConsumption?.subtotal ?? 0);
      const averageTicket = visits > 0 ? Math.round(totalSpent / visits) : 0;
      const vip =
        (currentCustomer.vip ?? false) ||
        visits >= 10 ||
        averageTicket >= 24000 ||
        totalSpent >= 400000;
      const latestCompletedReservation = reservationHistory
        .filter((item) => item.status === "Completada")
        .sort((left, right) =>
          `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`)
        )[0];

      currentCustomer = {
        ...currentCustomer,
        fullName: currentCustomer.fullName || buildCustomerName(reservation.firstName, reservation.lastName),
        firstName: currentCustomer.firstName ?? reservation.firstName,
        lastName: currentCustomer.lastName ?? reservation.lastName,
        phone: currentCustomer.phone || reservation.phone,
        email: currentCustomer.email || reservation.email,
        birthday: currentCustomer.birthday || reservation.birthday,
        preferences: updatedPreferences,
        allergies: updatedAllergies,
        reservations: updatedReservations,
        reservationHistory,
        consumptionHistory,
        visits,
        totalSpent,
        averageTicket,
        lastVisit: latestCompletedReservation
          ? `${buildReservationDateLabel(latestCompletedReservation.date)} - ${latestCompletedReservation.time}`
          : currentCustomer.lastVisit,
        favoriteProducts,
        vip,
        contactKeys: buildContactKeys({
          ...currentCustomer,
          phone: reservation.phone,
          email: reservation.email,
        }),
      };

      customerById.set(currentCustomer.id, currentCustomer);

      for (const contactKey of currentCustomer.contactKeys ?? []) {
        contactIndex.set(contactKey, currentCustomer.id);
      }
    }

    return Array.from(customerById.values()).sort((left, right) => {
      if (right.visits !== left.visits) {
        return right.visits - left.visits;
      }

      if (right.totalSpent !== left.totalSpent) {
        return right.totalSpent - left.totalSpent;
      }

      return left.fullName.localeCompare(right.fullName);
    });
  }, [customerProfiles, reservations]);

  const updateTableStatus = React.useCallback(
    (tableId: string, nextStatus: TableOverrideStatus) => {
      setTableOverrides((current) => ({
        ...current,
        [tableId]: nextStatus,
      }));
    },
    []
  );

  const openReservationDetail = React.useCallback((reservationId: string) => {
    setFocusedReservationId(reservationId);
  }, []);

  const clearFocusedReservation = React.useCallback(() => {
    setFocusedReservationId(null);
  }, []);

  const value = React.useMemo<RestaurantFlowContextValue>(
    () => ({
      restaurantProfile,
      businessHours,
      customers,
      reservations,
      tables,
      menuItems,
      autoConfirmReservations,
      allowWaitlist,
      standardReservationDurationMinutes,
      intervalBetweenReservationsMinutes,
      updateRestaurantProfile,
      saveBusinessHourBlock,
      deleteBusinessHourBlock,
      saveCustomer,
      saveReservation,
      saveMenuItem,
      deleteMenuItem,
      updateReservationStatus,
      updateTableStatus,
      setMenuItemActive,
      setAutoConfirmReservations,
      setAllowWaitlist,
      setStandardReservationDurationMinutes: updateStandardReservationDurationMinutes,
      setIntervalBetweenReservationsMinutes: updateIntervalBetweenReservationsMinutes,
      getReservationById,
      getReservationForTable,
      getActiveReservationForTable,
      getReservationTableOptions,
      getConsumptionItemsForReservation,
      saveConsumptionItems,
      openReservationDetail,
      focusedReservationId,
      clearFocusedReservation,
    }),
    [
      allowWaitlist,
      autoConfirmReservations,
      businessHours,
      clearFocusedReservation,
      customers,
      deleteBusinessHourBlock,
      focusedReservationId,
      getActiveReservationForTable,
      getReservationById,
      getReservationForTable,
      getConsumptionItemsForReservation,
      getReservationTableOptions,
      intervalBetweenReservationsMinutes,
      openReservationDetail,
      menuItems,
      reservations,
      restaurantProfile,
      saveBusinessHourBlock,
      saveCustomer,
      saveReservation,
      saveMenuItem,
      deleteMenuItem,
      saveConsumptionItems,
      setMenuItemActive,
      standardReservationDurationMinutes,
      updateReservationStatus,
      updateIntervalBetweenReservationsMinutes,
      updateRestaurantProfile,
      updateStandardReservationDurationMinutes,
      updateTableStatus,
      tables,
    ]
  );

  return (
    <RestaurantFlowContext.Provider value={value}>
      {children}
    </RestaurantFlowContext.Provider>
  );
}

export function useRestaurantFlow() {
  const context = React.useContext(RestaurantFlowContext);

  if (!context) {
    throw new Error("useRestaurantFlow must be used within RestaurantFlowProvider");
  }

  return context;
}
