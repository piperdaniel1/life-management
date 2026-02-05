import { formatTime } from "@/lib/dateUtils";
import type { CalendarDay } from "@/lib/dateUtils";
import type { Item } from "@/types/models";

interface ItemCalendarDayCellProps {
  day: CalendarDay;
  items: Item[];
  onClick: (dateISO: string) => void;
}

const MAX_VISIBLE = 3;

export function ItemCalendarDayCell({ day, items, onClick }: ItemCalendarDayCellProps) {
  const base = "relative flex flex-col gap-0.5 border border-gray-100 p-1.5 text-left cursor-pointer transition-colors min-h-[4rem] sm:min-h-[5.5rem]";

  const bg = day.isToday
    ? "bg-blue-50 ring-2 ring-blue-400 ring-inset"
    : day.isWeekend && day.isCurrentMonth
      ? "bg-gray-50 hover:bg-gray-100"
      : day.isCurrentMonth
        ? "bg-white hover:bg-gray-50"
        : "bg-gray-50/60 hover:bg-gray-100/60";

  const textColor = day.isCurrentMonth ? "text-gray-900" : "text-gray-400";

  // Sort: events by start_time first, then tasks
  const sorted = [...items].sort((a, b) => {
    if (a.item_type !== b.item_type) return a.item_type === "event" ? -1 : 1;
    if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
    return 0;
  });

  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - MAX_VISIBLE;

  return (
    <div className={`${base} ${bg}`} onClick={() => onClick(day.dateISO)}>
      <span
        className={`text-xs font-medium ${day.isToday ? "text-blue-700" : textColor}`}
      >
        {day.dayOfMonth}
      </span>

      {/* Mobile: colored dots */}
      {sorted.length > 0 && (
        <div className="flex gap-0.5 sm:hidden">
          {sorted.slice(0, 5).map((item) => (
            <span
              key={item.id}
              className={`h-1.5 w-1.5 rounded-full ${
                item.item_type === "event" ? "bg-blue-500" : "bg-gray-400"
              }`}
            />
          ))}
          {sorted.length > 5 && (
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          )}
        </div>
      )}

      {/* Desktop: item previews */}
      <div className="hidden flex-col gap-0.5 sm:flex">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1 truncate text-[10px] leading-tight ${
              item.is_complete ? "text-gray-400 line-through" : "text-gray-700"
            }`}
          >
            {item.item_type === "event" ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            ) : (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full border ${
                  item.is_complete
                    ? "border-gray-400 bg-gray-400"
                    : "border-gray-400 bg-transparent"
                }`}
              />
            )}
            <span className="truncate">
              {item.item_type === "event" && item.start_time
                ? `${formatTime(item.start_time)} ${item.title}`
                : item.title}
            </span>
          </div>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] font-medium text-gray-400">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}
