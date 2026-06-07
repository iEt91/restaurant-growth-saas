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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";

const sections = [
  "Restaurante",
  "Sucursales",
  "Horarios",
  "Reservas",
  "Plano",
  "Menu",
  "Usuarios",
  "Pagina inicial",
] as const;

const dayOrder = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
] as const;

type DayName = (typeof dayOrder)[number];

type ScheduleBlock = {
  id: string;
  start: string;
  end: string;
};

type ScheduleByDay = Record<DayName, ScheduleBlock[]>;

type EditorState = {
  open: boolean;
  day: DayName;
  mode: "add" | "edit";
  blockId: string | null;
  start: string;
  end: string;
  error: string | null;
};

const initialSchedule: ScheduleByDay = {
  Lunes: [
    { id: "mon-1", start: "08:00", end: "12:00" },
    { id: "mon-2", start: "20:00", end: "00:00" },
  ],
  Martes: [],
  Miercoles: [{ id: "wed-1", start: "12:00", end: "00:00" }],
  Jueves: [{ id: "thu-1", start: "12:00", end: "00:00" }],
  Viernes: [
    { id: "fri-1", start: "12:00", end: "01:00" },
    { id: "fri-2", start: "20:00", end: "01:00" },
  ],
  Sabado: [{ id: "sat-1", start: "12:00", end: "01:00" }],
  Domingo: [{ id: "sun-1", start: "12:00", end: "23:00" }],
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

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateScheduleBlock(start: string, end: string) {
  if (!start || !end) {
    return "Completá ambos horarios.";
  }

  if (start === end) {
    return "La hora de inicio y fin no pueden ser iguales.";
  }

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const durationMinutes =
    endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : 24 * 60 - startMinutes + endMinutes;

  if (durationMinutes <= 0) {
    return "Revisá el rango horario.";
  }

  const isFullDay = start === "00:00" && end === "23:59";
  if (!isFullDay && durationMinutes > 18 * 60) {
    return "El bloque no puede superar las 18 horas.";
  }

  return null;
}

function formatRange(start: string, end: string) {
  return `${start} - ${end}`;
}

export default function SettingsPage() {
  const [autoConfirm, setAutoConfirm] = React.useState(true);
  const [waitlist, setWaitlist] = React.useState(true);
  const [standardDuration, setStandardDuration] = React.useState("90 minutos");
  const [intervalBetweenReservations, setIntervalBetweenReservations] =
    React.useState("15 minutos");
  const [schedule, setSchedule] = React.useState<ScheduleByDay>(initialSchedule);
  const [editor, setEditor] = React.useState<EditorState>(initialEditorState);
  const nextBlockIdRef = React.useRef(1);

  function openAddBlockDialog(day: DayName) {
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

  function openEditBlockDialog(day: DayName, block: ScheduleBlock) {
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
    const validationError = validateScheduleBlock(editor.start, editor.end);
    if (validationError) {
      setEditor((current) => ({ ...current, error: validationError }));
      return;
    }

    const nextBlock: ScheduleBlock = {
      id:
        editor.mode === "edit" && editor.blockId
          ? editor.blockId
          : `block-${nextBlockIdRef.current++}`,
      start: editor.start,
      end: editor.end,
    };

    setSchedule((current) => {
      const dayBlocks = current[editor.day];

      if (editor.mode === "edit" && editor.blockId) {
        return {
          ...current,
          [editor.day]: dayBlocks.map((block) =>
            block.id === editor.blockId ? nextBlock : block
          ),
        };
      }

      return {
        ...current,
        [editor.day]: [...dayBlocks, nextBlock],
      };
    });

    closeEditor();
  }

  function deleteBlock(day: DayName, blockId: string) {
    setSchedule((current) => ({
      ...current,
      [day]: current[day].filter((block) => block.id !== blockId),
    }));
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Configuracion</CardTitle>
          <p className="text-sm text-slate-500">
            Tabs horizontales y layout dividido entre horarios y reservas.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="Horarios">
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

            <TabsContent value="Horarios">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Horarios comerciales</CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Cada día puede tener más de un bloque horario.
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {APP_VERSION}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayOrder.map((day) => {
                      const blocks = schedule[day];

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
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-2xl"
                              onClick={() => openAddBlockDialog(day)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              +
                            </Button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {blocks.length ? (
                              blocks.map((block) => (
                                <div
                                  key={block.id}
                                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex items-center gap-3">
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
                                      onClick={() => deleteBlock(day, block.id)}
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
                    <CardTitle>Configuracion de reservas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Confirmar automaticamente
                        </p>
                        <p className="text-sm text-slate-500">Si hay disponibilidad</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Permitir lista de espera
                        </p>
                        <p className="text-sm text-slate-500">Para horarios completos</p>
                      </div>
                      <Switch checked={waitlist} onCheckedChange={setWaitlist} />
                    </div>

                    <div className="space-y-2">
                      <Label>Duracion estandar de reserva</Label>
                      <Input
                        value={standardDuration}
                        onChange={(event) => setStandardDuration(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalo entre reservas</Label>
                      <Input
                        value={intervalBetweenReservations}
                        onChange={(event) =>
                          setIntervalBetweenReservations(event.target.value)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="Reservas">
              <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuracion general</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Vista base lista para seguir creciendo con reglas reales.
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Confirmar automaticamente
                        </p>
                        <p className="text-sm text-slate-500">Si hay disponibilidad</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">
                          Permitir lista de espera
                        </p>
                        <p className="text-sm text-slate-500">Para horarios completos</p>
                      </div>
                      <Switch checked={waitlist} onCheckedChange={setWaitlist} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {sections
              .filter((section) => section !== "Horarios" && section !== "Reservas")
              .map((section) => (
                <TabsContent key={section} value={section}>
                  <Card>
                    <CardContent className="p-5 text-sm text-slate-500">
                      Seccion {section} lista para seguir creciendo en Sprint 2.
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
          </Tabs>

          <Separator className="my-5" />

          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                Version
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {APP_VERSION}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {VERSION_HISTORY[0].notes[0]}
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Ultima actualizacion: {VERSION_HISTORY[0].date}
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
              {editor.day} - definí hora de inicio y fin para este bloque.
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
    </div>
  );
}
