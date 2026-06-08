export type DateInput = Date | string | null | undefined;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const ARGENTINE_DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/;

function padDatePart(value: number | string) {
  return String(value).padStart(2, "0");
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
}

export function formatUtcDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);
  const day = padDatePart(date.getUTCDate());

  return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
  return formatLocalDateKey(new Date());
}

export function normalizeDateKey(value: DateInput) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatLocalDateKey(value);
  }

  const rawValue = value.trim();
  const isoMatch = rawValue.match(ISO_DATE_PATTERN);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  const argentineMatch = rawValue.match(ARGENTINE_DATE_PATTERN);

  if (argentineMatch) {
    const [, day, month, yearRaw] = argentineMatch;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
  }

  return null;
}

export function parseDateKeyToUtcDate(value: DateInput) {
  const dateKey = normalizeDateKey(value);

  if (!dateKey) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDisplayDate(value: DateInput) {
  const dateKey = normalizeDateKey(value);

  if (!dateKey) {
    return typeof value === "string" ? value : "";
  }

  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

export function isSameDate(left: DateInput, right: DateInput) {
  const leftKey = normalizeDateKey(left);
  const rightKey = normalizeDateKey(right);

  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

export function isToday(value: DateInput, today: DateInput = getTodayDateKey()) {
  return isSameDate(value, today);
}

export function isFutureDate(value: DateInput, today: DateInput = getTodayDateKey()) {
  const dateKey = normalizeDateKey(value);
  const todayKey = normalizeDateKey(today);

  return Boolean(dateKey && todayKey && dateKey > todayKey);
}

export function isPastDate(value: DateInput, today: DateInput = getTodayDateKey()) {
  const dateKey = normalizeDateKey(value);
  const todayKey = normalizeDateKey(today);

  return Boolean(dateKey && todayKey && dateKey < todayKey);
}

export function isDateWithinRange(date: DateInput, from: DateInput, to: DateInput) {
  const dateKey = normalizeDateKey(date);
  const fromKey = normalizeDateKey(from);
  const toKey = normalizeDateKey(to);

  if (!dateKey || !fromKey || !toKey) {
    return false;
  }

  const rangeStart = fromKey <= toKey ? fromKey : toKey;
  const rangeEnd = fromKey <= toKey ? toKey : fromKey;

  return dateKey >= rangeStart && dateKey <= rangeEnd;
}

export function startOfWeekDateKey(value: DateInput) {
  const date = parseDateKeyToUtcDate(value);

  if (!date) {
    return normalizeDateKey(value) ?? getTodayDateKey();
  }

  const dayOfWeek = date.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + mondayOffset);

  return formatUtcDateKey(date);
}

export function endOfWeekDateKey(value: DateInput) {
  const date = parseDateKeyToUtcDate(startOfWeekDateKey(value));

  if (!date) {
    return normalizeDateKey(value) ?? getTodayDateKey();
  }

  date.setUTCDate(date.getUTCDate() + 6);

  return formatUtcDateKey(date);
}

export function startOfMonthDateKey(value: DateInput) {
  const date = parseDateKeyToUtcDate(value);

  if (!date) {
    return normalizeDateKey(value) ?? getTodayDateKey();
  }

  date.setUTCDate(1);

  return formatUtcDateKey(date);
}

export function endOfMonthDateKey(value: DateInput) {
  const date = parseDateKeyToUtcDate(value);

  if (!date) {
    return normalizeDateKey(value) ?? getTodayDateKey();
  }

  date.setUTCMonth(date.getUTCMonth() + 1, 0);

  return formatUtcDateKey(date);
}
