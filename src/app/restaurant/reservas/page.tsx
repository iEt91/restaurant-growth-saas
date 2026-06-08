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
import { CalendarDays, Eye, Pencil, Plus, SlidersHorizontal } from "lucide-react";

const reservationStatuses = [
  "Todas",
  "Pendiente",
  "Confirmada",
  "Ocupada",
  "Completada",
  "Cancelada",
  "No-show",
] as const;

const channelOptions = ["Web", "WhatsApp", "Teléfono", "Presencial"] as const;

type ReservationStatus = (typeof reservationStatuses)[number];
type ReservationActionStatus = Exclude<ReservationStatus, "Todas">;
type ReservationChannel = (typeof channelOptions)[number];
type DialogMode = "create" | "edit" | "view";

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
};

const initialReservations: ReservationRow[] = [
  {
    id: "res-1",
    firstName: "María",
    lastName: "Fernández",
    phone: "+54 11 4444-1212",
    email: "maria.fernandez@email.com",
    birthday: "18 de julio",
    allergies: "Gluten",
    preferences: "Mesa tranquila, vino blanco",
    comments: "Celebración de aniversario",
    date: "2026-06-12",
    time: "20:30",
    partySize: 4,
    channel: "WhatsApp",
    status: "Confirmada",
    tableName: "Mesa 12",
  },
  {
    id: "res-2",
    firstName: "Santiago",
    lastName: "Varela",
    phone: "+54 11 4444-3434",
    email: "santi.varela@email.com",
    birthday: "2 de marzo",
    allergies: "Frutos secos",
    preferences: "Ventana, postres con chocolate",
    comments: "Llega 10 min tarde",
    date: "2026-06-12",
    time: "21:00",
    partySize: 2,
    channel: "Web",
    status: "Pendiente",
    tableName: "Mesa 07",
  },
  {
    id: "res-3",
    firstName: "Paula",
    lastName: "Acosta",
    phone: "+54 11 4444-5656",
    email: "paula.acosta@email.com",
    birthday: "9 de noviembre",
    allergies: "Lácteos",
    preferences: "Menú degustación, mesa central",
    comments: "VIP frecuente",
    date: "2026-06-13",
    time: "13:15",
    partySize: 6,
    channel: "Teléfono",
    status: "Ocupada",
    tableName: "Mesa 03",
  },
  {
    id: "res-4",
    firstName: "Nicolás",
    lastName: "Suárez",
    phone: "+54 11 4444-7878",
    email: "nicolas.suarez@email.com",
    birthday: "20 de enero",
    allergies: "",
    preferences: "Mesa 1-2",
    comments: "No llegó a la reserva anterior",
    date: "2026-06-13",
    time: "22:00",
    partySize: 8,
    channel: "Presencial",
    status: "No-show",
    tableName: "Mesa 01",
  },
  {
    id: "res-5",
    firstName: "Laura",
    lastName: "Fernández",
    phone: "+54 11 5555-9090",
    email: "laura.fernandez@email.com",
    birthday: "12 de septiembre",
    allergies: "Sin gluten",
    preferences: "Terraza, luz tenue",
    comments: "Cena de trabajo",
    date: "2026-06-14",
    time: "19:30",
    partySize: 3,
    channel: "WhatsApp",
    status: "Completada",
    tableName: "Mesa 09",
  },
  {
    id: "res-6",
    firstName: "Pedro",
    lastName: "Sosa",
    phone: "+54 11 5555-8888",
    email: "pedro.sosa@email.com",
    birthday: "3 de abril",
    allergies: "",
    preferences: "Barra, sin picante",
    comments: "Confirmada por concierge",
    date: "2026-06-14",
    time: "23:00",
    partySize: 2,
    channel: "Presencial",
    status: "Cancelada",
    tableName: "Mesa 04",
  },
];

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
  const [reservations, setReservations] =
    React.useState<ReservationRow[]>(initialReservations);
  const [selectedFilter, setSelectedFilter] =
    React.useState<ReservationStatus>("Todas");
  const [dialog, setDialog] = React.useState<ReservationDialogState>({
    open: false,
    mode: "create",
    reservationId: null,
    form: emptyFormState,
    error: null,
  });
  const nextIdRef = React.useRef(initialReservations.length + 1);

  const filterCounts = React.useMemo(() => {
    const counts = reservationStatuses.reduce(
      (acc, status) => {
        if (status === "Todas") {
          return acc;
        }

        acc[status] = reservations.filter(
          (reservation) => reservation.status === status
        ).length;
        return acc;
      },
      {} as Record<ReservationActionStatus, number>
    );

    return {
      Todas: reservations.length,
      ...counts,
    };
  }, [reservations]);

  const visibleReservations = React.useMemo(() => {
    if (selectedFilter === "Todas") {
      return reservations;
    }

    return reservations.filter((reservation) => reservation.status === selectedFilter);
  }, [reservations, selectedFilter]);

  function openCreateDialog() {
    setDialog({
      open: true,
      mode: "create",
      reservationId: null,
      form: emptyFormState,
      error: null,
    });
  }

  function openEditDialog(reservation: ReservationRow) {
    setDialog({
      open: true,
      mode: "edit",
      reservationId: reservation.id,
      form: getFormFromReservation(reservation),
      error: null,
    });
  }

  function openViewDialog(reservation: ReservationRow) {
    setDialog({
      open: true,
      mode: "view",
      reservationId: reservation.id,
      form: getFormFromReservation(reservation),
      error: null,
    });
  }

  function closeDialog() {
    setDialog((current) => ({
      ...current,
      open: false,
      error: null,
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
    }));
  }

  function updateReservationStatus(
    reservationId: string,
    nextStatus: ReservationActionStatus
  ) {
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? { ...reservation, status: nextStatus }
          : reservation
      )
    );
  }

  function handleDeleteReservation(reservationId: string) {
    const shouldDelete = window.confirm(
      "¿Querés eliminar esta reserva? Esta acción no se puede deshacer."
    );

    if (!shouldDelete) return;

    setReservations((current) =>
      current.filter((reservation) => reservation.id !== reservationId)
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateReservationForm(dialog.form);
    if (validationError) {
      setDialog((current) => ({ ...current, error: validationError }));
      return;
    }

    const nextReservation: ReservationRow = {
      id:
        dialog.mode === "edit" && dialog.reservationId
          ? dialog.reservationId
          : `res-${nextIdRef.current++}`,
      firstName: dialog.form.firstName.trim(),
      lastName: dialog.form.lastName.trim(),
      phone: dialog.form.phone.trim(),
      email: dialog.form.email.trim(),
      birthday: dialog.form.birthday.trim(),
      allergies: dialog.form.allergies.trim(),
      preferences: dialog.form.preferences.trim(),
      comments: dialog.form.comments.trim(),
      date: dialog.form.date,
      time: dialog.form.time,
      partySize: Number(dialog.form.partySize),
      channel: dialog.form.channel,
      status: dialog.form.status,
      tableName: dialog.form.tableName.trim() || "—",
    };

    setReservations((current) => {
      if (dialog.mode === "edit" && dialog.reservationId) {
        return current.map((reservation) =>
          reservation.id === dialog.reservationId ? nextReservation : reservation
        );
      }

      return [nextReservation, ...current];
    });

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
            <Button variant="outline" className="rounded-2xl">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" className="rounded-2xl">
              <CalendarDays className="mr-2 h-4 w-4" />
              12 jun 2026
            </Button>
            <Button className="rounded-2xl" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
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
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Mesa</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReservations.map((reservation) => (
                  <tr key={reservation.id} className="text-sm text-slate-700">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                      {reservation.time}
                      <div className="mt-1 text-xs text-slate-500">
                        {reservation.date}
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
                    <td className="px-4 py-3">{reservation.partySize}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={statusStyles[reservation.status]}
                      >
                        {reservation.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{reservation.tableName}</td>
                    <td className="px-4 py-3">{reservation.channel}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
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

                        {reservation.status === "Pendiente" ? (
                          <>
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                updateReservationStatus(reservation.id, "Confirmada")
                              }
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                updateReservationStatus(reservation.id, "Cancelada")
                              }
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleDeleteReservation(reservation.id)}
                            >
                              Eliminar
                            </Button>
                          </>
                        ) : null}

                        {reservation.status === "Confirmada" ? (
                          <>
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                updateReservationStatus(reservation.id, "Ocupada")
                              }
                            >
                              Marcar ocupada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                updateReservationStatus(reservation.id, "Cancelada")
                              }
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : null}

                        {reservation.status === "Ocupada" ? (
                          <Button
                            size="sm"
                            className="rounded-xl"
                            onClick={() =>
                              updateReservationStatus(reservation.id, "Completada")
                            }
                          >
                            Marcar completada
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Datos del cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 p-4 pt-0 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Nombre
                      </p>
                      <p className="mt-1 font-medium text-slate-950">
                        {dialog.form.firstName} {dialog.form.lastName}
                      </p>
                    </div>
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
                      <p className="mt-1 text-slate-700">{dialog.form.birthday || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Alergias
                      </p>
                      <p className="mt-1 text-slate-700">{dialog.form.allergies || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Preferencias
                      </p>
                      <p className="mt-1 text-slate-700">
                        {dialog.form.preferences || "—"}
                      </p>
                    </div>
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
                        <p className="mt-1 text-slate-700">{dialog.form.date}</p>
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
                        <p className="mt-1 text-slate-700">
                          {dialog.form.tableName || "—"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Comentarios
                      </p>
                      <p className="mt-1 text-slate-700">
                        {dialog.form.comments || "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                    <select
                      id="channel"
                      value={dialog.form.channel}
                      onChange={(event) =>
                        updateFormField(
                          "channel",
                          event.target.value as ReservationChannel
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                    >
                      {channelOptions.map((channel) => (
                        <option key={channel} value={channel}>
                          {channel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      value={dialog.form.status}
                      onChange={(event) =>
                        updateFormField(
                          "status",
                          event.target.value as ReservationActionStatus
                        )
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
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
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-name">Mesa</Label>
                    <Input
                      id="table-name"
                      value={dialog.form.tableName}
                      onChange={(event) =>
                        updateFormField("tableName", event.target.value)
                      }
                      placeholder="Mesa 12"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="birthday">Cumpleaños</Label>
                    <Input
                      id="birthday"
                      value={dialog.form.birthday}
                      onChange={(event) =>
                        updateFormField("birthday", event.target.value)
                      }
                      placeholder="18 de julio"
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
