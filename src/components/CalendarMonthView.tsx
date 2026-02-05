import type { CalendarDay } from "@/lib/dateUtils";
import type { TimeEntry } from "@/types/models";
import { CalendarDayCell } from "./CalendarDayCell";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarMonthViewProps {
  grid: CalendarDay[];
  entriesByDate: Map<string, TimeEntry>;
  monthLabel: string;
  monthTotal: number;
  downloading: boolean;
  isCurrentMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDownload: () => void;
  onDayClick: (dateISO: string) => void;
}

export function CalendarMonthView({
  grid,
  entriesByDate,
  monthLabel,
  monthTotal,
  downloading,
  isCurrentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDownload,
  onDayClick,
}: CalendarMonthViewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
            aria-label="Previous month"
          >
            &lt;
          </button>
          <h2 className="min-w-[11rem] text-center text-lg font-semibold text-gray-900">
            {monthLabel}
          </h2>
          <button
            onClick={onNextMonth}
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
            aria-label="Next month"
          >
            &gt;
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            disabled={isCurrentMonth}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Today
          </button>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {/* Weekday header row */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {WEEKDAY_HEADERS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-semibold uppercase text-gray-500"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {grid.map((day) => (
            <CalendarDayCell
              key={day.dateISO}
              day={day}
              entry={entriesByDate.get(day.dateISO) ?? null}
              onClick={onDayClick}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-600">
        Month total:{" "}
        <span className="font-semibold text-gray-900">
          {monthTotal.toFixed(2)} hrs
        </span>
      </div>
    </div>
  );
}
