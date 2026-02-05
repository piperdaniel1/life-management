import { dayjs } from "@/lib/dayjs";
import type { Dayjs } from "@/lib/dayjs";
import type { Item } from "@/types/models";

export interface DayInfo {
  /** The actual calendar date for this slot */
  date: Dayjs;
  /** The date to display (shifted +7 for past days in rolling week) */
  displayDate: Dayjs;
  isToday: boolean;
  /** Whether this slot represents a past day (showing next week's date) */
  isNextWeek: boolean;
  dayLabel: string;
  dateLabel: string;
}

/** Format a Dayjs (or anything dayjs can parse) as YYYY-MM-DD */
export function formatDateISO(date: Dayjs | string): string {
  return dayjs(date).format("YYYY-MM-DD");
}

/**
 * Returns 7 day objects (Mon-Sun) for the rolling week view.
 * Days before today show next week's date (shifted +7).
 * Days from today onward show this week's date.
 */
export function getRollingWeekDays(): DayInfo[] {
  const today = dayjs().startOf("day");
  const monday = today.startOf("isoWeek");

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const date = monday.add(i, "day");
    const isToday = date.isSame(today, "day");
    const isPast = date.isBefore(today) && !isToday;

    const displayDate = isPast ? date.add(7, "day") : date;

    days.push({
      date,
      displayDate,
      isToday,
      isNextWeek: isPast,
      dayLabel: date.format("dddd"),
      dateLabel: displayDate.format("MMM D"),
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
    const today = dayjs().format("YYYY-MM-DD");
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
  const now = dayjs();
  if (endTime) {
    const [h, m] = endTime.split(":").map(Number);
    const eventEnd = dayjs(scheduledDate).hour(h!).minute(m!).second(0);
    return now.isAfter(eventEnd);
  }
  const endOfDay = dayjs(scheduledDate).hour(23).minute(59).second(59);
  return now.isAfter(endOfDay);
}

/**
 * Returns Tailwind gradient classes based on current hour for the today card.
 */
export function getTimeOfDayGradient(): string {
  const hour = dayjs().hour();

  if (hour >= 5 && hour < 11) {
    return "bg-gradient-to-br from-amber-100 via-orange-50 to-pink-50";
  }
  if (hour >= 11 && hour < 17) {
    return "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50";
  }
  if (hour >= 17 && hour < 21) {
    return "bg-gradient-to-br from-orange-100 via-pink-50 to-purple-50";
  }
  return "bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100";
}

/**
 * Format a time string (HH:MM:SS or HH:MM) for display (12h format).
 */
export function formatTime(time: string): string {
  return dayjs(`2000-01-01T${time}`).format("h:mma");
}

export interface CalendarDay {
  dateISO: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Returns a 42-cell (6-row) calendar grid for the given month.
 * Uses isoWeek so weeks start on Monday.
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = dayjs().startOf("day");
  const firstOfMonth = dayjs().year(year).month(month).startOf("month");
  const gridStart = firstOfMonth.startOf("isoWeek");

  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = gridStart.add(i, "day");
    const dow = d.day();
    cells.push({
      dateISO: d.format("YYYY-MM-DD"),
      dayOfMonth: d.date(),
      isCurrentMonth: d.month() === month,
      isToday: d.isSame(today, "day"),
      isWeekend: dow === 0 || dow === 6,
    });
  }

  return cells;
}
