import type { Item } from "@/types/models";

export interface DayInfo {
  /** The actual calendar date for this slot */
  date: Date;
  /** The date to display (shifted +7 for past days in rolling week) */
  displayDate: Date;
  isToday: boolean;
  /** Whether this slot represents a past day (showing next week's date) */
  isNextWeek: boolean;
  dayLabel: string;
  dateLabel: string;
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Returns the Monday of the given date's week */
export function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a Date as YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Returns 7 day objects (Mon-Sun) for the rolling week view.
 * Days before today show next week's date (shifted +7).
 * Days from today onward show this week's date.
 */
export function getRollingWeekDays(): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = getWeekStartMonday(today);

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const isToday = formatDateISO(date) === formatDateISO(today);
    const isPast = date < today && !isToday;

    let displayDate: Date;
    if (isPast) {
      displayDate = new Date(date);
      displayDate.setDate(displayDate.getDate() + 7);
    } else {
      displayDate = new Date(date);
    }

    days.push({
      date,
      displayDate,
      isToday,
      isNextWeek: isPast,
      dayLabel: DAY_NAMES[i]!,
      dateLabel: formatDateLabel(displayDate),
    });
  }

  return days;
}

/**
 * For incomplete tasks with a past scheduled_date, returns today's ISO date.
 * Otherwise returns the item's scheduled_date as-is.
 */
export function getEffectiveDate(item: Item): string | null {
  if (
    item.item_type === "task" &&
    !item.is_complete &&
    item.scheduled_date
  ) {
    const today = formatDateISO(new Date());
    if (item.scheduled_date < today) {
      return today;
    }
  }
  return item.scheduled_date;
}

/**
 * Returns true if an event's end time (or end-of-day) has passed.
 */
export function isEventPast(
  scheduledDate: string,
  endTime: string | null,
): boolean {
  const now = new Date();
  if (endTime) {
    const [h, m] = endTime.split(":").map(Number);
    const eventEnd = new Date(scheduledDate + "T00:00:00");
    eventEnd.setHours(h!, m!, 0, 0);
    return now > eventEnd;
  }
  // No end_time: consider it past at end of the scheduled day
  const endOfDay = new Date(scheduledDate + "T23:59:59");
  return now > endOfDay;
}

/**
 * Returns Tailwind gradient classes based on current hour for the today card.
 */
export function getTimeOfDayGradient(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    // Morning: warm sunrise
    return "bg-gradient-to-br from-amber-100 via-orange-50 to-pink-50";
  }
  if (hour >= 11 && hour < 17) {
    // Midday: bright
    return "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50";
  }
  if (hour >= 17 && hour < 21) {
    // Evening: sunset
    return "bg-gradient-to-br from-orange-100 via-pink-50 to-purple-50";
  }
  // Night (21-5): deep
  return "bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100";
}

/**
 * Format a time string (HH:MM:SS or HH:MM) for display (12h format).
 */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = mStr ?? "00";
  const period = h >= 12 ? "pm" : "am";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m}${period}`;
}
