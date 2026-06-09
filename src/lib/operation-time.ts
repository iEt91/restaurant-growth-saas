export type TimeWindow = {
  start: number;
  end: number;
};

export type BusinessHourBlock = {
  id: string;
  start: string;
  end: string;
};

export type MinuteSettingConstraints = {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export const reservationDurationConstraints: MinuteSettingConstraints = {
  min: 30,
  max: 240,
  step: 5,
  defaultValue: 90,
};

export const reservationIntervalConstraints: MinuteSettingConstraints = {
  min: 5,
  max: 120,
  step: 5,
  defaultValue: 15,
};

const minutesPerDay = 24 * 60;

export function normalizeMinuteSetting(
  value: number,
  constraints: MinuteSettingConstraints
) {
  if (!Number.isFinite(value)) {
    return constraints.defaultValue;
  }

  const roundedToStep = Math.round(value / constraints.step) * constraints.step;
  return Math.min(Math.max(roundedToStep, constraints.min), constraints.max);
}

export function parseTimeToMinutes(time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getTimeRangeDurationMinutes(start: string, end: string) {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null || start === end) {
    return null;
  }

  return endMinutes > startMinutes
    ? endMinutes - startMinutes
    : minutesPerDay - startMinutes + endMinutes;
}

export function getReservationWindow(
  time: string,
  durationMinutes: number,
  intervalMinutes: number
) {
  const start = parseTimeToMinutes(time);

  if (start === null) {
    return null;
  }

  return {
    start,
    end: start + Math.max(durationMinutes, 0) + Math.max(intervalMinutes, 0),
  };
}

function expandBusinessBlock(block: Pick<BusinessHourBlock, "start" | "end">) {
  const start = parseTimeToMinutes(block.start);
  const end = parseTimeToMinutes(block.end);

  if (start === null || end === null || block.start === block.end) {
    return [];
  }

  if (end > start) {
    return [{ start, end }];
  }

  return [
    { start, end: minutesPerDay },
    { start: 0, end },
  ];
}

export function windowsOverlap(left: TimeWindow, right: TimeWindow) {
  return left.start < right.end && right.start < left.end;
}

export function businessBlocksOverlap(
  left: Pick<BusinessHourBlock, "start" | "end">,
  right: Pick<BusinessHourBlock, "start" | "end">
) {
  const leftWindows = expandBusinessBlock(left);
  const rightWindows = expandBusinessBlock(right);

  return leftWindows.some((leftWindow) =>
    rightWindows.some((rightWindow) => windowsOverlap(leftWindow, rightWindow))
  );
}

export function validateBusinessHourBlock({
  start,
  end,
  existingBlocks,
  editingBlockId,
}: {
  start: string;
  end: string;
  existingBlocks: BusinessHourBlock[];
  editingBlockId?: string | null;
}) {
  if (!start || !end) {
    return "Completá ambos horarios.";
  }

  if (start === end) {
    return "La hora de inicio y fin no pueden ser iguales.";
  }

  const durationMinutes = getTimeRangeDurationMinutes(start, end);

  if (!durationMinutes || durationMinutes <= 0) {
    return "Revisá el rango horario.";
  }

  const isFullDay = start === "00:00" && end === "23:59";
  if (!isFullDay && durationMinutes > 18 * 60) {
    return "El bloque no puede superar las 18 horas.";
  }

  const comparableBlocks = existingBlocks.filter(
    (block) => block.id !== editingBlockId
  );
  const duplicatedBlock = comparableBlocks.some(
    (block) => block.start === start && block.end === end
  );

  if (duplicatedBlock) {
    return "Ese bloque horario ya existe para este día.";
  }

  const overlappingBlock = comparableBlocks.some((block) =>
    businessBlocksOverlap({ start, end }, block)
  );

  if (overlappingBlock) {
    return "Ese bloque se solapa con otro horario del mismo día.";
  }

  return null;
}
