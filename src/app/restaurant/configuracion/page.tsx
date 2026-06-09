"use client";

import * as React from "react";
import { APP_VERSION, VERSION_HISTORY } from "@/config/version";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  businessDays,
  type BusinessDayName,
  type RestaurantProfile,
  useRestaurantFlow,
} from "@/components/restaurant-flow-provider";
import { branches, users } from "@/data/mock";
import { formatDisplayDate } from "@/lib/date-utils";
import {
  type BusinessHourBlock,
  normalizeMinuteSetting,
  reservationDurationConstraints,
  reservationIntervalConstraints,
  validateBusinessHourBlock,
  type MinuteSettingConstraints,
} from "@/lib/operation-time";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";

const sections = [
  "Restaurante",
  "Sucursales",
  "Horarios",
  "Reservas",
  "Plano",
  "Usuarios",
] as const;

type EditorState = {
  open: boolean;
  day: BusinessDayName;
  mode: "add" | "edit";
  blockId: string | null;
  start: string;
  end: string;
  error: string | null;
};

type OperationalSettingsDraft = {
  durationMinutes: number;
  intervalMinutes: number;
};

const initialEditorState: EditorState = {
  open: false,
  day: "Lunes",
  mode: "add",
  blockId: null,
  start: "08:00",
  end: "12:00",
  error: null,
};

function parseOperationalMinuteInput(
  rawValue: string,
  label: string,
  constraints: MinuteSettingConstraints
) {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return {
      value: null,
      error: `${label} es obligatorio.`,
      notice: null,
    };
  }

  if (!/^\d+$/.test(trimmedValue)) {
    return {
      value: null,
      error: `${label} debe ser un número entero en minutos.`,
      notice: null,
    };
  }

  const numericValue = Number(trimmedValue);
  const normalizedValue = normalizeMinuteSetting(numericValue, constraints);

  return {
    value: normalizedValue,
    error: null,
    notice:
      normalizedValue !== numericValue
        ? `${label} se ajustó a ${normalizedValue} min para respetar rango y múltiplos de ${constraints.step}.`
        : null,
  };
}

function formatRange(start: string, end: string) {
  return `${start} - ${end}`;
}

function getBranchStatusBadge(active: boolean) {
  return active ? (
    <Badge variant="success" className="rounded-full px-3 py-1">
      Activa
    </Badge>
  ) : (
    <Badge variant="secondary" className="rounded-full px-3 py-1">
      Inactiva
    </Badge>
  );
}

export default function SettingsPage() {
  const {
    restaurantProfile,
    updateRestaurantProfile,
    businessHours,
    saveBusinessHourBlock,
    deleteBusinessHourBlock,
    autoConfirmReservations,
    setAutoConfirmReservations,
    allowWaitlist,
    setAllowWaitlist,
    standardReservationDurationMinutes,
    setStandardReservationDurationMinutes,
    intervalBetweenReservationsMinutes,
    setIntervalBetweenReservationsMinutes,
  } = useRestaurantFlow();
  const [profileForm, setProfileForm] =
    React.useState<RestaurantProfile>(restaurantProfile);
  const [profileNotice, setProfileNotice] = React.useState("Sin cambios pendientes.");
  const [settingsNotice, setSettingsNotice] = React.useState("Configuración operativa activa.");
  const [editor, setEditor] = React.useState<EditorState>(initialEditorState);
  const [durationInput, setDurationInput] = React.useState(
    String(standardReservationDurationMinutes)
  );
  const [intervalInput, setIntervalInput] = React.useState(
    String(intervalBetweenReservationsMinutes)
  );
  const [durationError, setDurationError] = React.useState<string | null>(null);
  const [intervalError, setIntervalError] = React.useState<string | null>(null);
  const [pendingOperationalSettings, setPendingOperationalSettings] =
    React.useState<OperationalSettingsDraft | null>(null);
  const [confirmSettingsOpen, setConfirmSettingsOpen] = React.useState(false);
  const nextBlockIdRef = React.useRef(1);

  const profileDirty = React.useMemo(
    () => JSON.stringify(profileForm) !== JSON.stringify(restaurantProfile),
    [profileForm, restaurantProfile]
  );

  function updateProfileField<K extends keyof RestaurantProfile>(
    field: K,
    value: RestaurantProfile[K]
  ) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
    setProfileNotice("Cambios pendientes de guardar.");
  }

  function saveProfile() {
    updateRestaurantProfile({
      ...profileForm,
      name: profileForm.name.trim() || restaurantProfile.name,
      city: profileForm.city.trim(),
      description: profileForm.description.trim(),
      cuisine: profileForm.cuisine.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
    });
    setProfileNotice("Configuración guardada correctamente.");
  }

  function openAddBlockDialog(day: BusinessDayName) {
    setEditor({
      open: true,
      day,
      mode: "add",
      blockId: null,
      start: "08:00",
      end: "12:00",
      error: null,
    });
  }

  function openEditBlockDialog(day: BusinessDayName, block: BusinessHourBlock) {
    setEditor({
      open: true,
      day,
      mode: "edit",
      blockId: block.id,
      start: block.start,
      end: block.end,
      error: null,
    });
  }

  function closeEditor() {
    setEditor(initialEditorState);
  }

  function saveBlock() {
    const validationError = validateBusinessHourBlock({
      start: editor.start,
      end: editor.end,
      existingBlocks: businessHours[editor.day],
      editingBlockId: editor.blockId,
    });

    if (validationError) {
      setEditor((current) => ({ ...current, error: validationError }));
      return;
    }

    saveBusinessHourBlock(editor.day, {
      id:
        editor.mode === "edit" && editor.blockId
          ? editor.blockId
          : `block-${nextBlockIdRef.current++}`,
      start: editor.start,
      end: editor.end,
    });
    setSettingsNotice("Horario comercial guardado correctamente.");
    closeEditor();
  }

  function removeBlock(day: BusinessDayName, blockId: string) {
    deleteBusinessHourBlock(day, blockId);
    setSettingsNotice("Bloque horario eliminado. El día se mantiene disponible.");
  }

  function updateAutoConfirm(enabled: boolean) {
    setAutoConfirmReservations(enabled);
    setSettingsNotice(
      enabled
        ? "Las reservas nuevas intentarán confirmarse automáticamente si hay mesa."
        : "Las reservas nuevas quedarán pendientes por defecto."
    );
  }

  function updateWaitlist(enabled: boolean) {
    setAllowWaitlist(enabled);
    setSettingsNotice(
      enabled
        ? "Lista de espera activa para reservas sin mesa disponible."
        : "Sin lista de espera: se bloquearán reservas sin mesa disponible."
    );
  }

  function resetOperationalInputs() {
    setDurationInput(String(standardReservationDurationMinutes));
    setIntervalInput(String(intervalBetweenReservationsMinutes));
    setDurationError(null);
    setIntervalError(null);
  }

  function updateDurationDraft(value: string) {
    if (!/^\d*$/.test(value)) {
      setDurationError("La duración debe ser un número entero en minutos.");
      return;
    }

    setDurationInput(value);
    setDurationError(null);
  }

  function updateIntervalDraft(value: string) {
    if (!/^\d*$/.test(value)) {
      setIntervalError("El intervalo debe ser un número entero en minutos.");
      return;
    }

    setIntervalInput(value);
    setIntervalError(null);
  }

  function prepareOperationalSettingsConfirmation() {
    const nextDuration = parseOperationalMinuteInput(
      durationInput,
      "La duración estándar",
      reservationDurationConstraints
    );
    const nextInterval = parseOperationalMinuteInput(
      intervalInput,
      "El intervalo entre reservas",
      reservationIntervalConstraints
    );

    setDurationError(nextDuration.error);
    setIntervalError(nextInterval.error);

    if (!nextDuration.value || !nextInterval.value) {
      return;
    }

    setDurationInput(String(nextDuration.value));
    setIntervalInput(String(nextInterval.value));

    const notice = [nextDuration.notice, nextInterval.notice].filter(Boolean).join(" ");
    if (notice) {
      setSettingsNotice(notice);
    }

    if (
      nextDuration.value === standardReservationDurationMinutes &&
      nextInterval.value === intervalBetweenReservationsMinutes
    ) {
      setSettingsNotice("Sin cambios operativos pendientes.");
      return;
    }

    setPendingOperationalSettings({
      durationMinutes: nextDuration.value,
      intervalMinutes: nextInterval.value,
    });
    setConfirmSettingsOpen(true);
  }

  function cancelOperationalSettingsConfirmation() {
    setConfirmSettingsOpen(false);
    setPendingOperationalSettings(null);
    resetOperationalInputs();
    setSettingsNotice("Cambio operativo cancelado. Se restauraron los valores anteriores.");
  }

  function confirmOperationalSettingsChange() {
    if (!pendingOperationalSettings) {
      return;
    }

    setStandardReservationDurationMinutes(pendingOperationalSettings.durationMinutes);
    setIntervalBetweenReservationsMinutes(pendingOperationalSettings.intervalMinutes);
    setDurationInput(String(pendingOperationalSettings.durationMinutes));
    setIntervalInput(String(pendingOperationalSettings.intervalMinutes));
    setPendingOperationalSettings(null);
    setConfirmSettingsOpen(false);
    setSettingsNotice(
      "Cambios operativos confirmados. Disponibilidad, autoasignación y contador usan estos valores."
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Configuración</CardTitle>
          <p className="text-sm text-slate-500">
            Parámetros reales para operación diaria, reservas y plano de mesas.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="Restaurante">
            <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-2 rounded-[24px] bg-slate-100 p-2">
              {sections.map((section) => (
                <TabsTrigger
                  key={section}
                  value={section}
                  className="rounded-2xl px-4 py-2"
                >
                  {section}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Restaurante">
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Datos del restaurante</CardTitle>
                    <p className="text-sm text-slate-500">
                      Estos datos alimentan el panel interno y el sidebar del restaurante.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre del restaurante</Label>
                        <Input
                          value={profileForm.name}
                          onChange={(event) => updateProfileField("name", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ciudad / ubicación</Label>
                        <Input
                          value={profileForm.city}
                          onChange={(event) => updateProfileField("city", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de cocina</Label>
                        <Input
                          value={profileForm.cuisine}
                          onChange={(event) => updateProfileField("cuisine", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input
                          value={profileForm.phone}
                          onChange={(event) => updateProfileField("phone", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={profileForm.email}
                          onChange={(event) => updateProfileField("email", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <NativeSelect
                          value={profileForm.active ? "activo" : "inactivo"}
                          onChange={(event) =>
                            updateProfileField("active", event.target.value === "activo")
                          }
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </NativeSelect>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción breve</Label>
                      <textarea
                        value={profileForm.description}
                        onChange={(event) =>
                          updateProfileField("description", event.target.value)
                        }
                        className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </div>

                    <div className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-600">{profileNotice}</p>
                      <Button
                        className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={!profileDirty}
                        onClick={saveProfile}
                      >
                        Guardar restaurante
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vista previa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-[28px] bg-slate-950 p-5 text-white">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Restaurant Growth SaaS
                      </p>
                      <p className="mt-3 text-2xl font-semibold">{profileForm.name}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {profileForm.cuisine} · {profileForm.city}
                      </p>
                    </div>
                    <Badge variant={profileForm.active ? "success" : "secondary"}>
                      {profileForm.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="Horarios">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Horarios comerciales</CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Cada día puede tener cero, uno o múltiples bloques horarios.
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      Estado local
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {businessDays.map((day) => {
                      const blocks = businessHours[day];

                      return (
                        <div
                          key={day}
                          className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-base font-semibold text-slate-950">
                                {day}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Bloques horarios del día
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 rounded-full"
                              onClick={() => openAddBlockDialog(day)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {blocks.length ? (
                              blocks.map((block) => (
                                <div
                                  key={block.id}
                                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-800">
                                      {formatRange(block.start, block.end)}
                                    </div>
                                    {block.end < block.start ? (
                                      <Badge
                                        variant="outline"
                                        className="rounded-full border-0 bg-violet-50 text-violet-700"
                                      >
                                        Cruza medianoche
                                      </Badge>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-3 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                      onClick={() => openEditBlockDialog(day, block)}
                                    >
                                      <Pencil className="mr-2 h-3.5 w-3.5" />
                                      Editar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 rounded-xl px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                      onClick={() => removeBlock(day, block.id)}
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                Cerrado
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de reservas</CardTitle>
                    <p className="text-sm text-slate-500">
                      Estos valores afectan disponibilidad, autoasignación y contador.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      <CheckCircle2 className="mr-2 inline h-4 w-4" />
                      {settingsNotice}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Confirmar automáticamente
                        </p>
                        <p className="text-sm text-slate-500">Si hay disponibilidad</p>
                      </div>
                      <Switch checked={autoConfirmReservations} onCheckedChange={updateAutoConfirm} />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Permitir lista de espera
                        </p>
                        <p className="text-sm text-slate-500">Para horarios completos</p>
                      </div>
                      <Switch checked={allowWaitlist} onCheckedChange={updateWaitlist} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reservation-duration">
                        Duración estándar de reserva
                      </Label>
                      <div className="relative">
                        <Input
                          id="reservation-duration"
                          type="number"
                          inputMode="numeric"
                          min={reservationDurationConstraints.min}
                          max={reservationDurationConstraints.max}
                          step={reservationDurationConstraints.step}
                          value={durationInput}
                          onBlur={prepareOperationalSettingsConfirmation}
                          onChange={(event) => updateDurationDraft(event.target.value)}
                          className="pr-16"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          min
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Mín. 30 · Máx. 240 · Avanza de 5 en 5.
                      </p>
                      {durationError ? (
                        <p className="text-sm text-rose-600">{durationError}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reservation-interval">
                        Intervalo entre reservas
                      </Label>
                      <div className="relative">
                        <Input
                          id="reservation-interval"
                          type="number"
                          inputMode="numeric"
                          min={reservationIntervalConstraints.min}
                          max={reservationIntervalConstraints.max}
                          step={reservationIntervalConstraints.step}
                          value={intervalInput}
                          onBlur={prepareOperationalSettingsConfirmation}
                          onChange={(event) => updateIntervalDraft(event.target.value)}
                          className="pr-16"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          min
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Mín. 5 · Máx. 120 · Avanza de 5 en 5.
                      </p>
                      {intervalError ? (
                        <p className="text-sm text-rose-600">{intervalError}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      className="w-full rounded-2xl bg-violet-600 text-white hover:bg-violet-700"
                      onClick={prepareOperationalSettingsConfirmation}
                    >
                      Aplicar cambios operativos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="Reservas">
              <Card>
                <CardHeader>
                  <CardTitle>Reglas de reservas</CardTitle>
                  <p className="text-sm text-slate-500">
                    Resumen de cómo se comportan las reservas nuevas.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-950">Estado inicial</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {autoConfirmReservations
                        ? "Confirmada si hay mesa disponible; pendiente si entra en lista de espera."
                        : "Pendiente por defecto hasta confirmación manual."}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-950">Disponibilidad</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Duración {standardReservationDurationMinutes} min + intervalo{" "}
                      {intervalBetweenReservationsMinutes} min.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Sucursales">
              <Card>
                <CardHeader>
                  <CardTitle>Sucursales</CardTitle>
                  <p className="text-sm text-slate-500">
                    Lista local preparada para conectar a Supabase más adelante.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branches.length ? (
                    branches.map((branch, index) => (
                      <div
                        key={branch.id}
                        className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">{branch.name}</p>
                          <p className="text-sm text-slate-500">
                            {branch.address} · {branch.city}
                          </p>
                          <p className="text-xs text-slate-400">{branch.openingHours}</p>
                        </div>
                        {getBranchStatusBadge(index !== 2)}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Sin sucursales cargadas.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Usuarios">
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios</CardTitle>
                  <p className="text-sm text-slate-500">
                    Visual local sin permisos reales todavía.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.length ? (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">{user.fullName}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <Badge variant={user.active ? "success" : "secondary"}>
                          {user.role}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Sin usuarios configurados.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {sections
              .filter(
                (section) =>
                  !["Restaurante", "Horarios", "Reservas", "Sucursales", "Usuarios"].includes(section)
              )
              .map((section) => (
                <TabsContent key={section} value={section}>
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-500">
                      Sección {section} lista para seguir creciendo sin conectar Supabase todavía.
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
          </Tabs>

          <Separator className="my-5" />

          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                Versión
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {APP_VERSION}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {VERSION_HISTORY[0].notes[0]}
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Última actualización: {formatDisplayDate(VERSION_HISTORY[0].date)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editor.open}
        onOpenChange={(open) => {
          if (!open) {
            closeEditor();
          }
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editor.mode === "add" ? "Agregar bloque horario" : "Editar bloque horario"}
            </DialogTitle>
            <DialogDescription>
              {editor.day} · definí hora de inicio y fin para este bloque.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-time">Hora inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={editor.start}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      start: event.target.value,
                      error: null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Hora fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={editor.end}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      end: event.target.value,
                      error: null,
                    }))
                  }
                />
              </div>
            </div>

            {editor.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {editor.error}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeEditor}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveBlock}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmSettingsOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelOperationalSettingsConfirmation();
          }
        }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Confirmar cambio operativo</DialogTitle>
            <DialogDescription>
              Este cambio puede afectar la disponibilidad de mesas, la asignación automática de reservas y el cálculo del tiempo restante en el plano de mesas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Duración estándar actual
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {standardReservationDurationMinutes} min
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Nueva duración estándar
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {pendingOperationalSettings?.durationMinutes ?? standardReservationDurationMinutes} min
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Intervalo actual
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {intervalBetweenReservationsMinutes} min
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Nuevo intervalo
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {pendingOperationalSettings?.intervalMinutes ?? intervalBetweenReservationsMinutes} min
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelOperationalSettingsConfirmation}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700"
              onClick={confirmOperationalSettingsChange}
            >
              Confirmar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
