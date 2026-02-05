import type { CalendarDay } from "@/lib/dateUtils";
import type { TimeEntry } from "@/types/models";

interface CalendarDayCellProps {
  day: CalendarDay;
  entry: TimeEntry | null;
  onClick: (dateISO: string) => void;
}

export function CalendarDayCell({ day, entry, onClick }: CalendarDayCellProps) {
  const base = "relative flex flex-col gap-0.5 border border-gray-100 p-1.5 text-left cursor-pointer transition-colors min-h-[4rem] sm:min-h-[5.5rem]";

  const bg = day.isToday
    ? "bg-blue-50 ring-2 ring-blue-400 ring-inset"
    : day.isWeekend && day.isCurrentMonth
      ? "bg-gray-50 hover:bg-gray-100"
      : day.isCurrentMonth
        ? "bg-white hover:bg-gray-50"
        : "bg-gray-50/60 hover:bg-gray-100/60";

  const textColor = day.isCurrentMonth ? "text-gray-900" : "text-gray-400";

  return (
    <div className={`${base} ${bg}`} onClick={() => onClick(day.dateISO)}>
      <span
        className={`text-xs font-medium ${day.isToday ? "text-blue-700" : textColor}`}
      >
        {day.dayOfMonth}
      </span>

      {entry && (
        <>
          <span className="inline-flex w-fit rounded bg-teal-100 px-1.5 py-0.5 text-xs font-semibold text-teal-700">
            {entry.hours}h
          </span>
          <span className="hidden text-xs text-gray-500 leading-tight line-clamp-2 sm:block">
            {entry.description}
          </span>
        </>
      )}
    </div>
  );
}
