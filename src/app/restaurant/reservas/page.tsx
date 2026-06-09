"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import type { ReservationChannel as RestaurantReservationChannel } from "@/data/restaurant-ops";
import {
  endOfMonthDateKey,
  endOfWeekDateKey,
  formatDisplayDate,
  getTodayDateKey,
  isDateWithinRange,
  isFutureDate,
  isPastDate,
  normalizeDateKey,
  startOfMonthDateKey,
  startOfWeekDateKey,
} from "@/lib/date-utils";
import {
  CalendarDays,
  CheckCircle2,
  CircleSlash2,
  Eye,
  Pencil,
  Plus,
  SquareCheckBig,
  SquareDashedMousePointer,
  TimerReset,
} from "lucide-react";
const reservationStatuses = [
  "Todas",
  "Pendiente",
  "Confirmada",
  "Ocupada",
  "Completada",
  "Cancelada",
  "No-show",
] as const;

const channelOptions = [
  "Web",
  "WhatsApp",
  "Teléfono",
  "Presencial",
] as const satisfies readonly RestaurantReservationChannel[];

type ReservationStatus = (typeof reservationStatuses)[number];
type ReservationActionStatus = Exclude<ReservationStatus, "Todas">;
type ReservationChannel = RestaurantReservationChannel;
type DialogMode = "create" | "edit" | "view";
type ReservationRangeFilter = "Hoy" | "Semana" | "Mes" | "Personalizado";

type ReservationRange = {
  from: string;
  to: string;
};

const rangeFilterOptions: ReservationRangeFilter[] = [
  "Hoy",
  "Semana",
  "Mes",
  "Personalizado",
];

type ReservationRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  allergies: string;
  preferences: string;
  comments: string;
  date: string;
  time: string;
  partySize: number;
  channel: ReservationChannel;
  status: ReservationActionStatus;
  tableName: string;
};

type ReservationFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
  allergies: string;
  preferences: string;
  comments: string;
  date: string;
  time: string;
  partySize: string;
  channel: ReservationChannel;
  status: ReservationActionStatus;
  tableName: string;
};

type ReservationDialogState = {
  open: boolean;
  mode: DialogMode;
  reservationId: string | null;
  form: ReservationFormState;
  error: string | null;
  notice: string | null;
};

const statusStyles: Record<ReservationActionStatus, string> = {
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Ocupada: "bg-violet-50 text-violet-700 border-violet-200",
  Completada: "bg-slate-100 text-slate-700 border-slate-200",
  Cancelada: "bg-rose-50 text-rose-700 border-rose-200",
  "No-show": "bg-slate-100 text-slate-600 border-slate-200",
};

const emptyFormState: ReservationFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  birthday: "",
  allergies: "",
  preferences: "",
  comments: "",
  date: "",
  time: "",
  partySize: "",
  channel: "Web",
  status: "Pendiente",
  tableName: "",
};

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

function toDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeTableInputValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "—" || trimmed === "â€”") {
    return "";
  }

  return trimmed;
}

function buildRangeForFilter(
  filter: ReservationRangeFilter,
  todayKey: string,
  customRange: ReservationRange
): ReservationRange {
  if (filter === "Semana") {
    return {
      from: startOfWeekDateKey(todayKey),
      to: endOfWeekDateKey(todayKey),
    };
  }

  if (filter === "Mes") {
    return {
      from: startOfMonthDateKey(todayKey),
      to: endOfMonthDateKey(todayKey),
    };
  }

  if (filter === "Personalizado") {
    const from = normalizeDateKey(customRange.from) ?? todayKey;
    const to = normalizeDateKey(customRange.to) ?? todayKey;

    return from <= to ? { from, to } : { from: to, to: from };
  }

  return {
    from: todayKey,
    to: todayKey,
  };
}

function sortReservationsByDateAndTime(
  left: Pick<ReservationRow, "date" | "time">,
  right: Pick<ReservationRow, "date" | "time">
) {
  return `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`);
}

function buildGuestName(reservation: Pick<ReservationRow, "firstName" | "lastName">) {
  return `${reservation.firstName} ${reservation.lastName}`.trim();
}

function getFormFromReservation(reservation: ReservationRow): ReservationFormState {
  return {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phone: reservation.phone,
    email: reservation.email,
    birthday: reservation.birthday,
    allergies: reservation.allergies,
    preferences: reservation.preferences,
    comments: reservation.comments,
    date: reservation.date,
    time: reservation.time,
    partySize: String(reservation.partySize),
    channel: reservation.channel,
    status: reservation.status,
    tableName: reservation.tableName,
  };
}

function validateReservationForm(form: ReservationFormState) {
  const requiredFields = [
    form.firstName.trim(),
    form.lastName.trim(),
    form.phone.trim(),
    form.email.trim(),
    form.date.trim(),
    form.time.trim(),
    form.partySize.trim(),
    form.channel,
  ];

  if (requiredFields.some((value) => !value)) {
    return "Completá los campos obligatorios.";
  }

  const partySize = Number(form.partySize);
  if (!Number.isInteger(partySize) || partySize <= 0) {
    return "La cantidad de personas debe ser mayor a cero.";
  }

  return null;
}

export default function ReservationsPage() {
  const {
    reservations,
    tables,
    saveReservation,
    updateReservationStatus: syncReservationStatus,
    getReservationTableOptions,
    focusedReservationId,
    clearFocusedReservation,
    autoConfirmReservations,
    allowWaitlist,
  } = useRestaurantFlow();
  const currentDateKey = useCurrentDateKey();
  const effectiveTodayKey = currentDateKey ?? "";
  const [selectedRangeFilter, setSelectedRangeFilter] =
    React.useState<ReservationRangeFilter>("Hoy");
  const [customRange, setCustomRange] = React.useState<ReservationRange>({
    from: "",
    to: "",
  });
  const effectiveCustomRange = React.useMemo(
    () => ({
      from: customRange.from || effectiveTodayKey,
      to: customRange.to || effectiveTodayKey,
    }),
    [customRange, effectiveTodayKey]
  );
  const activeRange = React.useMemo(
    () =>
      effectiveTodayKey
        ? buildRangeForFilter(
            selectedRangeFilter,
            effectiveTodayKey,
            effectiveCustomRange
          )
        : { from: "", to: "" },
    [effectiveCustomRange, effectiveTodayKey, selectedRangeFilter]
  );
  const [selectedFilter, setSelectedFilter] =
    React.useState<ReservationStatus>("Todas");
  const [dialog, setDialog] = React.useState<ReservationDialogState>({
    open: false,
    mode: "create",
    reservationId: null,
    form: emptyFormState,
    error: null,
    notice: null,
  });
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const nextIdRef = React.useRef(reservations.length + 1);

  const reservationsInActiveRange = React.useMemo(
    () =>
      activeRange.from && activeRange.to
        ? reservations
            .filter((reservation) =>
              isDateWithinRange(reservation.date, activeRange.from, activeRange.to)
            )
            .sort(sortReservationsByDateAndTime)
        : [],
    [activeRange.from, activeRange.to, reservations]
  );

  const filterCounts = React.useMemo(() => {
    const counts = reservationStatuses.reduce(
      (acc, status) => {
        if (status === "Todas") {
          return acc;
        }

        acc[status] = reservationsInActiveRange.filter(
          (reservation) => reservation.status === status
        ).length;
        return acc;
      },
      {} as Record<ReservationActionStatus, number>
    );

    return {
      Todas: reservationsInActiveRange.length,
      ...counts,
    };
  }, [reservationsInActiveRange]);

  const visibleReservations = React.useMemo(() => {
    if (selectedFilter === "Todas") {
      return reservationsInActiveRange;
    }

    return reservationsInActiveRange.filter((reservation) => reservation.status === selectedFilter);
  }, [reservationsInActiveRange, selectedFilter]);

  function openCreateDialog() {
    const suggestedDate =
      selectedRangeFilter === "Personalizado"
        ? activeRange.from || effectiveTodayKey || getTodayDateKey()
        : effectiveTodayKey || getTodayDateKey();

    setDialog({
      open: true,
      mode: "create",
      reservationId: null,
      form: {
        ...emptyFormState,
        date: suggestedDate,
        status: autoConfirmReservations ? "Confirmada" : "Pendiente",
      },
      error: null,
      notice: null,
    });
  }

  function openEditDialog(reservation: ReservationRow) {
    setDialog({
      open: true,
      mode: "edit",
      reservationId: reservation.id,
      form: getFormFromReservation(reservation),
      error: null,
      notice: null,
    });
  }

  function openViewDialog(reservation: ReservationRow) {
    setDialog({
      open: true,
      mode: "view",
      reservationId: reservation.id,
      form: getFormFromReservation(reservation),
      error: null,
      notice: null,
    });
  }

  function closeDialog() {
    setDialog((current) => ({
      ...current,
      open: false,
      error: null,
      notice: null,
    }));
  }

  function updateFormField(
    field: keyof ReservationFormState,
    value: string | ReservationActionStatus
  ) {
    setDialog((current) => ({
      ...current,
      form: { ...current.form, [field]: value },
      error: null,
      notice: null,
    }));
  }

  function updateReservationStatus(
    reservationId: string,
    nextStatus: ReservationActionStatus
  ) {
    return syncReservationStatus(reservationId, nextStatus);
  }

  function surfaceMutationResult(
    result: { warning: string | null; error: string | null },
    reservationId: string
  ) {
    if (result.error) {
      setFeedbackMessage(result.error);
      setDialog((current) =>
        current.reservationId === reservationId
          ? {
              ...current,
              error: result.error,
              notice: null,
            }
          : current
      );
      return;
    }

    if (result.warning) {
      setFeedbackMessage(result.warning);
      setDialog((current) =>
        current.reservationId === reservationId
          ? {
              ...current,
              notice: result.warning,
              error: null,
            }
          : current
      );
    }
  }

  function applyReservationStatusChange(
    reservationId: string,
    nextStatus: ReservationActionStatus
  ) {
    const result = updateReservationStatus(reservationId, nextStatus);
    surfaceMutationResult(result, reservationId);
    return result;
  }

  const getReservationById = React.useCallback(
    (reservationId: string | null) => {
      if (!reservationId) return null;
      return reservations.find((reservation) => reservation.id === reservationId) ?? null;
    },
    [reservations]
  );

  const activeReservation = getReservationById(dialog.reservationId);
  const tableOptions = React.useMemo(() => {
    if (!dialog.open) {
      return [];
    }

    if (
      !dialog.form.date ||
      !dialog.form.time ||
      !dialog.form.partySize ||
      Number(dialog.form.partySize) <= 0
    ) {
      return tables.map((table) => ({
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        available: false,
        reason: "Completá fecha, hora y personas",
        label: `${table.name} — ${table.capacity}p — Completá fecha, hora y personas`,
      }));
    }

    return getReservationTableOptions({
      id: dialog.reservationId ?? "draft",
      date: dialog.form.date,
      time: dialog.form.time,
      partySize: Number(dialog.form.partySize),
      tableName: dialog.form.tableName,
    });
  }, [
    dialog.form.date,
    dialog.form.partySize,
    dialog.form.tableName,
    dialog.form.time,
    dialog.open,
    dialog.reservationId,
    getReservationTableOptions,
    tables,
  ]);

  React.useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  React.useEffect(() => {
    if (!focusedReservationId) {
      return;
    }

    const reservationId = focusedReservationId;
    const timeoutId = window.setTimeout(() => {
      const focusedReservation = getReservationById(reservationId);
      if (focusedReservation) {
        openViewDialog(focusedReservation);
      }

      clearFocusedReservation();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [clearFocusedReservation, focusedReservationId, getReservationById]);

  function openReservationEditFromView() {
    if (!activeReservation) return;
    openEditDialog(activeReservation);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateReservationForm(dialog.form);
    if (validationError) {
      setDialog((current) => ({ ...current, error: validationError }));
      return;
    }

    const currentReservation = getReservationById(dialog.reservationId);
    const nextReservation: ReservationRow = {
      id:
        dialog.mode === "edit" && dialog.reservationId
          ? dialog.reservationId
          : `res-${nextIdRef.current++}`,
      firstName: dialog.form.firstName.trim(),
      lastName: dialog.form.lastName.trim(),
      phone: dialog.form.phone.trim(),
      email: dialog.form.email.trim(),
      birthday:
        dialog.form.birthday.trim() ||
        (dialog.mode === "edit" ? currentReservation?.birthday ?? "" : ""),
      allergies: dialog.form.allergies.trim(),
      preferences: dialog.form.preferences.trim(),
      comments: dialog.form.comments.trim(),
      date: dialog.form.date,
      time: dialog.form.time,
      partySize: Number(dialog.form.partySize),
      channel: dialog.form.channel,
      status: dialog.form.status,
      tableName: normalizeTableInputValue(dialog.form.tableName),
    };

    let result = saveReservation(nextReservation);

    if (
      result.error &&
      dialog.mode === "create" &&
      autoConfirmReservations &&
      allowWaitlist
    ) {
      result = saveReservation({
        ...nextReservation,
        status: "Pendiente",
        tableName: "",
      });
    }
    if (result.error) {
      setDialog((current) => ({
        ...current,
        error: result.error,
        notice: null,
      }));
      return;
    }

    setFeedbackMessage(result.warning);
    setDialog((current) => ({
      ...current,
      notice: result.warning,
      error: null,
    }));
    // Futuro: registrar estas correcciones administrativas en audit_logs.

    closeDialog();
  }

  const dialogTitle =
    dialog.mode === "create"
      ? "Nueva reserva"
      : dialog.mode === "edit"
        ? "Editar reserva"
        : "Ver reserva";

  const dialogDescription =
    dialog.mode === "create"
      ? "Completá los datos para crear una nueva reserva."
      : dialog.mode === "edit"
        ? "Actualizá la reserva sin salir de la pantalla."
        : "Revisá la información completa de la reserva.";

  function getTemporalBadgeLabel(date: string) {
    if (isFutureDate(date, currentDateKey)) return "Reserva futura";
    if (isPastDate(date, currentDateKey)) return "Reserva pasada";
    return null;
  }

  function getFlowActionsForReservation(reservation: ReservationRow) {
    const isFutureReservation = isFutureDate(reservation.date, currentDateKey);
    const isPastReservation = isPastDate(reservation.date, currentDateKey);

    if (reservation.status === "Pendiente") {
      return [
        { label: "Confirmar", nextStatus: "Confirmada" as const, variant: "default" as const },
        { label: "Cancelar", nextStatus: "Cancelada" as const, variant: "outline" as const },
        ...(isPastReservation
          ? [{ label: "No-show", nextStatus: "No-show" as const, variant: "outline" as const }]
          : []),
      ];
    }

    if (reservation.status === "Confirmada") {
      return [
        ...(isFutureReservation || isPastReservation
          ? []
          : [{ label: "Marcar ocupada", nextStatus: "Ocupada" as const, variant: "secondary" as const }]),
        { label: "Cancelar", nextStatus: "Cancelada" as const, variant: "outline" as const },
        ...(isFutureReservation
          ? []
          : [{ label: "No-show", nextStatus: "No-show" as const, variant: "outline" as const }]),
      ];
    }

    if (reservation.status === "Ocupada") {
      return isFutureReservation
        ? []
        : [{ label: "Marcar completada", nextStatus: "Completada" as const, variant: "default" as const }];
    }

    return [];
  }

  function getFlowButtonClassName(
    nextStatus: ReservationActionStatus,
    variant: "default" | "outline" | "secondary"
  ) {
    if (nextStatus === "Confirmada") {
      return "h-9 rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-700";
    }

    if (nextStatus === "Ocupada") {
      return "h-9 rounded-xl bg-violet-600 px-3 text-white hover:bg-violet-700";
    }

    if (nextStatus === "Completada") {
      return "h-9 rounded-xl bg-emerald-700 px-3 text-white hover:bg-emerald-800";
    }

    if (nextStatus === "Cancelada") {
      return "h-9 rounded-xl border-rose-200 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100 hover:text-rose-800";
    }

    if (nextStatus === "No-show") {
      return "h-9 rounded-xl border-slate-200 bg-slate-50 px-3 text-slate-700 hover:bg-slate-100 hover:text-slate-950";
    }

    return variant === "default" ? "h-9 rounded-xl px-3 text-white" : "h-9 rounded-xl px-3";
  }

  function renderFlowActions(
    reservationStatus: ReservationActionStatus,
    reservationId: string
  ) {
    const actions = getFlowActionsForReservation({
      id: reservationId,
      firstName: dialog.form.firstName,
      lastName: dialog.form.lastName,
      phone: dialog.form.phone,
      email: dialog.form.email,
      birthday: dialog.form.birthday,
      allergies: dialog.form.allergies,
      preferences: dialog.form.preferences,
      comments: dialog.form.comments,
      date: dialog.form.date,
      time: dialog.form.time,
      partySize: Number(dialog.form.partySize) || 0,
      channel: dialog.form.channel,
      status: reservationStatus,
      tableName: dialog.form.tableName,
    });

    if (!actions.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Sin acciones disponibles
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            size="sm"
            variant={action.variant === "default" ? "default" : action.variant}
            className={
              action.variant === "default"
                ? "h-9 rounded-xl px-3 text-white"
                : "h-9 rounded-xl px-3"
            }
            onClick={() => {
              const result = applyReservationStatusChange(reservationId, action.nextStatus);

              if (result.error || !result.reservation) {
                return;
              }

              setDialog((current) => ({
                ...current,
                form: {
                  ...current.form,
                  status: action.nextStatus,
                  tableName: result.reservation?.tableName ?? current.form.tableName,
                },
                notice: result.warning ?? null,
                error: null,
              }));
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Reservas</CardTitle>
            <p className="text-sm text-slate-500">
              Tabla compacta con filtros y estados visibles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {rangeFilterOptions.map((option) => {
                const isActive = selectedRangeFilter === option;

                return (
                  <Button
                    key={option}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-9 rounded-xl px-3 ${
                      isActive
                        ? "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                    onClick={() => setSelectedRangeFilter(option)}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
            {selectedRangeFilter === "Personalizado" ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Desde
                </span>
                <Input
                  type="date"
                  value={effectiveCustomRange.from}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      from: normalizeDateKey(event.target.value) ?? effectiveTodayKey,
                    }))
                  }
                  className="h-8 w-[132px] rounded-xl border-slate-200 bg-slate-50 px-2 text-xs"
                />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Hasta
                </span>
                <Input
                  type="date"
                  value={effectiveCustomRange.to}
                  onChange={(event) =>
                    setCustomRange((current) => ({
                      ...current,
                      to: normalizeDateKey(event.target.value) ?? effectiveTodayKey,
                    }))
                  }
                  className="h-8 w-[132px] rounded-xl border-slate-200 bg-slate-50 px-2 text-xs"
                />
              </div>
            ) : (
              <Badge
                variant="outline"
                className="inline-flex min-w-[190px] justify-center rounded-2xl px-3 py-2 text-sm"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedRangeFilter === "Hoy"
                  ? formatDisplayDate(activeRange.from)
                  : `${formatDisplayDate(activeRange.from)} - ${formatDisplayDate(activeRange.to)}`}
              </Badge>
            )}
            <Button className="rounded-2xl" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {feedbackMessage ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {feedbackMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {reservationStatuses.map((status) => {
              const isActive = selectedFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedFilter(status)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"
                  }`}
                >
                  {status}{" "}
                  <span className="ml-1 text-xs opacity-70">
                    {filterCounts[status as keyof typeof filterCounts]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <table className="min-w-full table-fixed divide-y divide-slate-100">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[180px]" />
                <col className="w-[110px]" />
                <col className="w-[150px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[420px]" />
                <col className="w-[180px]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-center">Personas</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Mesa</th>
                  <th className="px-4 py-3 text-center">Canal</th>
                  <th className="px-4 py-3 text-center">Estado / Flujo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReservations.map((reservation) => {
                  const flowActions = getFlowActionsForReservation(reservation);
                  const temporalBadgeLabel = getTemporalBadgeLabel(reservation.date);

                  return (
                  <tr key={reservation.id} className="text-sm text-slate-700">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                      {reservation.time}
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDisplayDate(reservation.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">
                        {buildGuestName(reservation)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {reservation.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{reservation.partySize}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`${statusStyles[reservation.status]} whitespace-nowrap`}
                      >
                        {reservation.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {reservation.tableName ? (
                        reservation.tableName
                      ) : reservation.status === "Pendiente" ? (
                        <Badge variant="warning" className="whitespace-nowrap">
                          Lista de espera
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{reservation.channel}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-h-10 w-full flex-wrap items-center justify-center gap-2">
                        {temporalBadgeLabel ? (
                          <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                            {temporalBadgeLabel}
                          </Badge>
                        ) : null}

                        {flowActions.length > 0 ? (
                          flowActions.map((action) => (
                            <Button
                              key={action.label}
                              size="sm"
                              variant={action.variant === "default" ? "default" : action.variant}
                              className={getFlowButtonClassName(action.nextStatus, action.variant)}
                              onClick={() =>
                                applyReservationStatusChange(reservation.id, action.nextStatus)
                              }
                            >
                              {action.nextStatus === "Confirmada" ? (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              ) : action.nextStatus === "Cancelada" ? (
                                <CircleSlash2 className="mr-2 h-4 w-4" />
                              ) : action.nextStatus === "No-show" ? (
                                <TimerReset className="mr-2 h-4 w-4" />
                              ) : action.nextStatus === "Ocupada" ? (
                                <SquareDashedMousePointer className="mr-2 h-4 w-4" />
                              ) : action.nextStatus === "Completada" ? (
                                <SquareCheckBig className="mr-2 h-4 w-4" />
                              ) : null}
                              {action.label}
                            </Button>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Sin flujo operativo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex min-w-[170px] flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openViewDialog(reservation)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openEditDialog(reservation)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {Object.entries(statusStyles).map(([status, className]) => (
              <Badge key={status} variant="outline" className={className}>
                {status}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {dialog.mode === "view" ? (
              <div className="space-y-4">
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`${statusStyles[dialog.form.status]} whitespace-nowrap shadow-sm`}>
                            {dialog.form.status}
                          </Badge>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                            {dialog.form.channel}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                            Reserva de
                          </p>
                          <h3 className="mt-1 text-2xl font-semibold">
                            {dialog.form.firstName} {dialog.form.lastName}
                          </h3>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:min-w-[420px]">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Fecha y hora
                          </p>
                          <p className="mt-1 font-medium text-white">
                            {formatDisplayDate(dialog.form.date)} · {dialog.form.time}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Mesa / personas
                          </p>
                          <p className="mt-1 font-medium text-white">
                            {dialog.form.tableName || 'Sin mesa'} · {dialog.form.partySize}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Datos del cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-4 pt-0 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Teléfono
                        </p>
                        <p className="mt-1 text-slate-700">{dialog.form.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Email
                        </p>
                        <p className="mt-1 text-slate-700">{dialog.form.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Cumpleaños
                        </p>
                        <p className="mt-1 text-slate-700">
                          {dialog.form.birthday ? formatDisplayDate(dialog.form.birthday) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Alergias
                        </p>
                        <p className="mt-1 text-slate-700">{dialog.form.allergies || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Preferencias
                        </p>
                        <p className="mt-1 text-slate-700">{dialog.form.preferences || '—'}</p>
                      </div>
                      {dialog.notice ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          {dialog.notice}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Datos de la reserva</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-4 pt-0 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Fecha
                          </p>
                          <p className="mt-1 text-slate-700">{formatDisplayDate(dialog.form.date)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Hora
                          </p>
                          <p className="mt-1 text-slate-700">{dialog.form.time}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Personas
                          </p>
                          <p className="mt-1 text-slate-700">{dialog.form.partySize}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Canal
                          </p>
                          <p className="mt-1 text-slate-700">{dialog.form.channel}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Estado
                          </p>
                          <p className="mt-1 text-slate-700">{dialog.form.status}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Mesa
                          </p>
                          <p className="mt-1 text-slate-700">{dialog.form.tableName || '—'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <Card className="shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Comentarios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-slate-700">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        {dialog.form.comments.trim() || 'Sin comentarios'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Acciones rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 p-4 pt-0">
                      <Button type="button" onClick={openReservationEditFromView}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar reserva
                      </Button>
                      <Button type="button" variant="outline" onClick={closeDialog}>
                        Cerrar
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <form id="reservation-form" className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nombre *</Label>
                    <Input
                      id="first-name"
                      value={dialog.form.firstName}
                      onChange={(event) =>
                        updateFormField("firstName", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apellido *</Label>
                    <Input
                      id="last-name"
                      value={dialog.form.lastName}
                      onChange={(event) =>
                        updateFormField("lastName", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={dialog.form.phone}
                      onChange={(event) => updateFormField("phone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={dialog.form.email}
                      onChange={(event) => updateFormField("email", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={dialog.form.date}
                      onChange={(event) => updateFormField("date", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={dialog.form.time}
                      onChange={(event) => updateFormField("time", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party-size">Cantidad de personas *</Label>
                    <Input
                      id="party-size"
                      type="number"
                      min={1}
                      value={dialog.form.partySize}
                      onChange={(event) =>
                        updateFormField("partySize", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel">Canal *</Label>
                    <NativeSelect
                      id="channel"
                      value={dialog.form.channel}
                      onChange={(event) =>
                        updateFormField(
                          "channel",
                          event.target.value as ReservationChannel
                        )
                      }
                      className="h-10 focus:border-slate-400"
                    >
                      {channelOptions.map((channel) => (
                        <option key={channel} value={channel}>
                          {channel}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <NativeSelect
                      id="status"
                      value={dialog.form.status}
                      onChange={(event) =>
                        updateFormField(
                          "status",
                          event.target.value as ReservationActionStatus
                        )
                      }
                      className="h-10 focus:border-slate-400"
                    >
                      {reservationStatuses
                        .filter(
                          (status): status is ReservationActionStatus =>
                            status !== "Todas"
                        )
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-name">Mesa</Label>
                    <NativeSelect
                      id="table-name"
                      value={dialog.form.tableName}
                      onChange={(event) =>
                        updateFormField("tableName", event.target.value)
                      }
                      className="h-10 focus:border-slate-400"
                    >
                      <option value="">Sin mesa asignada</option>
                      {tableOptions.map((option) => (
                        <option
                          key={option.id}
                          value={option.name}
                          disabled={!option.available && option.name !== dialog.form.tableName}
                        >
                          {option.label}
                        </option>
                      ))}
                    </NativeSelect>
                    <p className="text-xs text-slate-500">
                      Las mesas no disponibles quedan deshabilitadas para evitar conflictos.
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="birthday">Cumpleaños</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={toDateInputValue(dialog.form.birthday)}
                      onChange={(event) =>
                        updateFormField("birthday", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Input
                      id="allergies"
                      value={dialog.form.allergies}
                      onChange={(event) =>
                        updateFormField("allergies", event.target.value)
                      }
                      placeholder="Gluten, frutos secos..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="preferences">Preferencias</Label>
                    <Input
                      id="preferences"
                      value={dialog.form.preferences}
                      onChange={(event) =>
                        updateFormField("preferences", event.target.value)
                      }
                      placeholder="Mesa tranquila, ventana..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="comments">Comentarios</Label>
                    <textarea
                      id="comments"
                      value={dialog.form.comments}
                      onChange={(event) =>
                        updateFormField("comments", event.target.value)
                      }
                      rows={4}
                      className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                      placeholder="Notas internas sobre la reserva"
                    />
                  </div>
                </div>
                {dialog.mode === "edit" && dialog.reservationId ? (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">Corrección de estado</CardTitle>
                      <p className="text-xs text-slate-500">
                        Correcciones administrativas para casos de error humano.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-0">
                      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Estado actual
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-2 whitespace-nowrap ${statusStyles[dialog.form.status]}`}
                          >
                            {dialog.form.status}
                          </Badge>
                          <p className="mt-3 text-sm text-slate-500">
                            Elegí el estado correcto y guardá los cambios. La mesa asociada se
                            sincroniza automáticamente.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="correction-status">Selector manual de estado</Label>
                          <NativeSelect
                            id="correction-status"
                            value={dialog.form.status}
                            onChange={(event) =>
                              updateFormField(
                                "status",
                                event.target.value as ReservationActionStatus
                              )
                            }
                            className="h-11 focus:border-slate-400"
                          >
                            {reservationStatuses
                              .filter(
                                (status): status is ReservationActionStatus =>
                                  status !== "Todas"
                              )
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                          </NativeSelect>
                          <p className="text-xs text-slate-500">
                            Úsalo para corregir errores como ocupada, cancelada o no-show por
                            equivocación.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Flujo disponible según el estado actual
                        </p>
                        {renderFlowActions(dialog.form.status, dialog.reservationId)}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {dialog.error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {dialog.error}
                  </div>
                ) : null}
              </form>
            )}
          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            {dialog.mode === "view" ? (
              <DialogFooter className="justify-end">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cerrar
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter className="justify-end">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" form="reservation-form">
                  {dialog.mode === "create" ? "Guardar reserva" : "Guardar cambios"}
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

