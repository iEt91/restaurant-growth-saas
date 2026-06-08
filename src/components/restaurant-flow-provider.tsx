"use client";

import * as React from "react";
import type {
  RestaurantTable,
  ReservationStatus,
  TableConsumptionItem,
} from "@/types/domain";
import {
  restaurantReservations,
  restaurantTables,
  type RestaurantReservation,
} from "@/data/restaurant-ops";

type TableOverrideStatus = RestaurantTable["status"];

type RestaurantFlowContextValue = {
  reservations: RestaurantReservation[];
  tables: RestaurantTable[];
  standardReservationDurationMinutes: number;
  intervalBetweenReservationsMinutes: number;
  saveReservation: (reservation: RestaurantReservation) => void;
  updateReservationStatus: (
    reservationId: string,
    nextStatus: ReservationStatus
  ) => void;
  updateTableStatus: (tableId: string, nextStatus: TableOverrideStatus) => void;
  setStandardReservationDurationMinutes: (minutes: number) => void;
  setIntervalBetweenReservationsMinutes: (minutes: number) => void;
  getReservationById: (reservationId: string | null) => RestaurantReservation | null;
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
  const [reservations, setReservations] = React.useState<RestaurantReservation[]>(
    restaurantReservations
  );
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
  }, []);

  const updateReservationStatus = React.useCallback(
    (
    reservationId: string,
    nextStatus: ReservationStatus
  ) => {
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
  }, []);

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

  const updateTableStatus = React.useCallback(
    (tableId: string, nextStatus: TableOverrideStatus) => {
    setTableOverrides((current) => ({
      ...current,
      [tableId]: nextStatus,
    }));
  }, []);

  const openReservationDetail = React.useCallback((reservationId: string) => {
    setFocusedReservationId(reservationId);
  }, []);

  const clearFocusedReservation = React.useCallback(() => {
    setFocusedReservationId(null);
  }, []);

  const value = React.useMemo<RestaurantFlowContextValue>(
    () => ({
      reservations,
      tables,
      standardReservationDurationMinutes,
      intervalBetweenReservationsMinutes,
      saveReservation,
      updateReservationStatus,
      updateTableStatus,
      setStandardReservationDurationMinutes,
      setIntervalBetweenReservationsMinutes,
      getReservationById,
      getActiveReservationForTable,
      getConsumptionItemsForReservation,
      saveConsumptionItems,
      openReservationDetail,
      focusedReservationId,
      clearFocusedReservation,
    }),
    [
      clearFocusedReservation,
      focusedReservationId,
      getActiveReservationForTable,
      getReservationById,
      getConsumptionItemsForReservation,
      intervalBetweenReservationsMinutes,
      openReservationDetail,
      reservations,
      saveReservation,
      saveConsumptionItems,
      setIntervalBetweenReservationsMinutes,
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
