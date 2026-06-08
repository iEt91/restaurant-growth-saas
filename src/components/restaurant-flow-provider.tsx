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

type TableOverrideStatus = RestaurantTable["status"];

type ReservationMutationResult = {
  reservation: RestaurantReservation | null;
  warning: string | null;
};

type RestaurantFlowContextValue = {
  customers: Customer[];
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  standardReservationDurationMinutes: number;
  intervalBetweenReservationsMinutes: number;
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
  setStandardReservationDurationMinutes: (minutes: number) => void;
  setIntervalBetweenReservationsMinutes: (minutes: number) => void;
  getReservationById: (reservationId: string | null) => RestaurantReservation | null;
  getReservationForTable: (tableName: string) => RestaurantReservation | null;
  getActiveReservationForTable: (tableName: string) => RestaurantReservation | null;
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

function buildReservationDateLabel(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function parseTimeToMinutes(time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getReservationWindow(
  reservation: Pick<RestaurantReservation, "date" | "time">,
  durationMinutes: number
) {
  const start = parseTimeToMinutes(reservation.time);

  if (start === null) {
    return null;
  }

  return {
    date: reservation.date,
    start,
    end: start + durationMinutes,
  };
}

function windowsOverlap(
  left: { date: string; start: number; end: number },
  right: { date: string; start: number; end: number }
) {
  if (left.date !== right.date) {
    return false;
  }

  return left.start < right.end && right.start < left.end;
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

function canAssignTableToReservation(
  table: RestaurantTable,
  reservation: Pick<
    RestaurantReservation,
    "id" | "date" | "time" | "partySize" | "tableName"
  >,
  reservations: RestaurantReservation[],
  durationMinutes: number
) {
  if (table.status === "Fuera de servicio") {
    return false;
  }

  if (table.capacity < reservation.partySize) {
    return false;
  }

  const candidateWindow = getReservationWindow(reservation, durationMinutes);

  if (!candidateWindow) {
    return false;
  }

  const currentReservationBlocks = reservations.some(
    (currentReservation) =>
      currentReservation.id === reservation.id &&
      currentReservation.tableName === table.name &&
      isBlockingReservationStatus(currentReservation.status)
  );

  const blockingReservations = reservations.filter(
    (currentReservation) =>
      currentReservation.id !== reservation.id &&
      currentReservation.tableName === table.name &&
      isBlockingReservationStatus(currentReservation.status)
  );

  if (table.status !== "Libre" && blockingReservations.length === 0 && !currentReservationBlocks) {
    return false;
  }

  return !blockingReservations.some((currentReservation) => {
    const currentWindow = getReservationWindow(currentReservation, durationMinutes);

    if (!currentWindow) {
      return false;
    }

    return windowsOverlap(candidateWindow, currentWindow);
  });
}

function resolveReservationTableAssignment({
  reservation,
  reservations,
  tables,
  durationMinutes,
}: {
  reservation: Pick<
    RestaurantReservation,
    "id" | "date" | "time" | "partySize" | "tableName"
  >;
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  durationMinutes: number;
}) {
  const requestedTableName = normalizeTableName(reservation.tableName);
  const sortableTables = [...tables].sort(
    (left, right) => left.capacity - right.capacity || left.name.localeCompare(right.name)
  );

  const requestedTable = requestedTableName
    ? tables.find((table) => table.name === requestedTableName) ?? null
    : null;
  const requestedTableIsValid =
    requestedTable !== null &&
    canAssignTableToReservation(requestedTable, reservation, reservations, durationMinutes);

  if (requestedTableIsValid) {
    return {
      tableName: requestedTableName,
      warning: null,
    };
  }

  const nextAvailableTable = sortableTables.find((table) =>
    canAssignTableToReservation(table, reservation, reservations, durationMinutes)
  );

  if (nextAvailableTable) {
    return {
      tableName: nextAvailableTable.name,
      warning: null,
    };
  }

  return {
    tableName: "",
    warning:
      "No hay mesa disponible automaticamente para ese horario. Podes asignarla manualmente.",
  };
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

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.status === "Ocupada"
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
          activeReservationStatuses.has(reservation.status)
      ) ?? null,
    [reservations]
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

  const tables = React.useMemo(() => {
    return restaurantTables.map((table) => {
      const activeReservation = getActiveReservationForTable(table.name);
      const overrideStatus = tableOverrides[table.id];

      const status =
        overrideStatus === "Fuera de servicio"
          ? overrideStatus
          : activeReservation
            ? deriveStatusFromReservation(activeReservation.status)
            : overrideStatus ?? table.status;

      return {
        ...table,
        status,
        currentGuest: activeReservation ? buildGuestName(activeReservation) : undefined,
        reservationTime: activeReservation ? activeReservation.time : undefined,
      };
    });
  }, [getActiveReservationForTable, tableOverrides]);

  const saveReservation = React.useCallback(
    (reservation: RestaurantReservation): ReservationMutationResult => {
      const currentReservation = reservations.find((item) => item.id === reservation.id);
      const resolvedTable = resolveReservationTableAssignment({
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
      });
      const nextReservation: RestaurantReservation = {
        ...reservation,
        tableName: resolvedTable.tableName,
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
        warning: resolvedTable.warning,
      };
    },
    [reservations, standardReservationDurationMinutes, syncCustomerProfileForReservation, tables]
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
        const resolvedTable = resolveReservationTableAssignment({
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
        });

        nextReservation = {
          ...nextReservation,
          tableName: resolvedTable.tableName,
        };
        warning = resolvedTable.warning;
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId ? nextReservation : reservation
        )
      );

      return {
        reservation: nextReservation,
        warning,
      };
    },
    [reservations, standardReservationDurationMinutes, tables]
  );

  const saveConsumptionItems = React.useCallback(
    (reservationId: string, items: TableConsumptionItem[]) => {
      const groupedItems = groupConsumptionItems(items);

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === reservationId
            ? {
                ...reservation,
                consumptionItems: groupedItems,
              }
            : reservation
        )
      );
    },
    []
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
      customers,
      reservations,
      tables,
      menuItems,
      standardReservationDurationMinutes,
      intervalBetweenReservationsMinutes,
      saveCustomer,
      saveReservation,
      saveMenuItem,
      deleteMenuItem,
      updateReservationStatus,
      updateTableStatus,
      setMenuItemActive,
      setStandardReservationDurationMinutes,
      setIntervalBetweenReservationsMinutes,
      getReservationById,
      getReservationForTable,
      getActiveReservationForTable,
      getConsumptionItemsForReservation,
      saveConsumptionItems,
      openReservationDetail,
      focusedReservationId,
      clearFocusedReservation,
    }),
    [
      clearFocusedReservation,
      customers,
      focusedReservationId,
      getActiveReservationForTable,
      getReservationById,
      getReservationForTable,
      getConsumptionItemsForReservation,
      intervalBetweenReservationsMinutes,
      openReservationDetail,
      menuItems,
      reservations,
      saveCustomer,
      saveReservation,
      saveMenuItem,
      deleteMenuItem,
      saveConsumptionItems,
      setIntervalBetweenReservationsMinutes,
      setMenuItemActive,
      setStandardReservationDurationMinutes,
      standardReservationDurationMinutes,
      updateReservationStatus,
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
