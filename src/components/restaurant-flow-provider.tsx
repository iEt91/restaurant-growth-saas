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

type RestaurantFlowContextValue = {
  customers: Customer[];
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  menuItems: MenuItem[];
  standardReservationDurationMinutes: number;
  intervalBetweenReservationsMinutes: number;
  saveCustomer: (customer: Customer) => void;
  saveReservation: (reservation: RestaurantReservation) => void;
  saveMenuItem: (menuItem: MenuItem) => void;
  deleteMenuItem: (menuItemId: string) => void;
  updateReservationStatus: (
    reservationId: string,
    nextStatus: ReservationStatus
  ) => void;
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

function findTableIdByName(tableName: string) {
  return restaurantTables.find((table) => table.name === tableName)?.id ?? null;
}

function deriveStatusFromReservation(status: ReservationStatus): TableOverrideStatus {
  if (status === "Confirmada") return "Reservada";
  if (status === "Ocupada") return "Ocupada";
  return "Libre";
}

function deriveManualStatusFromReservation(status: ReservationStatus): TableOverrideStatus {
  if (activeReservationStatuses.has(status)) {
    return deriveStatusFromReservation(status);
  }

  return "Libre";
}

function syncTableOverrideForReservation(
  tableId: string | null,
  nextStatus: ReservationStatus,
  setTableOverrides: React.Dispatch<React.SetStateAction<Record<string, TableOverrideStatus>>>
) {
  if (!tableId) {
    return;
  }

  setTableOverrides((current) => ({
    ...current,
    [tableId]: deriveManualStatusFromReservation(nextStatus),
  }));
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

  const saveReservation = React.useCallback((reservation: RestaurantReservation) => {
    const tableId = findTableIdByName(reservation.tableName);

    syncCustomerProfileForReservation(reservation);

    setReservations((current) => {
      const exists = current.some((item) => item.id === reservation.id);

      if (exists) {
        return current.map((item) =>
          item.id === reservation.id
            ? {
                ...reservation,
                occupiedMinutesElapsed:
                  reservation.status === "Ocupada"
                    ? item.occupiedMinutesElapsed ?? 0
                    : undefined,
                consumptionItems: preserveConsumptionItems(reservation, item),
              }
            : item
        );
      }

      return [
        {
          ...reservation,
          occupiedMinutesElapsed:
            reservation.status === "Ocupada" ? 0 : undefined,
          consumptionItems: reservation.consumptionItems ?? [],
        },
        ...current,
      ];
    });

    syncTableOverrideForReservation(tableId, reservation.status, setTableOverrides);
  }, [syncCustomerProfileForReservation]);

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
  ) => {
    const currentReservation = reservations.find((reservation) => reservation.id === reservationId);
    const tableId = currentReservation
      ? findTableIdByName(currentReservation.tableName)
      : null;

    syncTableOverrideForReservation(tableId, nextStatus, setTableOverrides);

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              status: nextStatus,
              occupiedMinutesElapsed: nextStatus === "Ocupada" ? 0 : undefined,
              consumptionItems: reservation.consumptionItems ?? [],
            }
            : reservation
      )
    );
  }, [reservations]);

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
