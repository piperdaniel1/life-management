import { getRollingWeekDays } from "@/lib/dateUtils";
import { DayCard } from "./DayCard";
import type { Item, TodoUpdate } from "@/types/models";
import type { TimeTrackingState, TimeTrackingActions } from "@/hooks/useTimeTracking";

interface WeekViewProps {
  items: Item[];
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  timeTracking: TimeTrackingState & TimeTrackingActions;
  onTimeTrackingClick: () => void;
}

export function WeekView({
  items,
  onUpdate,
  onDelete,
  timeTracking,
  onTimeTrackingClick,
}: WeekViewProps) {
  const days = getRollingWeekDays();

  // Mon-Fri are individual cards, Sat+Sun combined
  const weekdays = days.slice(0, 5); // Mon-Fri
  const saturday = days[5]!;
  const sunday = days[6]!;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        This Week
      </h2>

      {/* Desktop: 3-column grid (5 weekday cards + 1 weekend card = 6 cells, 3x2) */}
      {/* Mobile: single-column stack */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {weekdays.map((day) => (
          <DayCard
            key={day.dayLabel}
            day={day}
            items={items}
            onUpdate={onUpdate}
            onDelete={onDelete}
            timeTracking={timeTracking}
            onTimeTrackingClick={onTimeTrackingClick}
          />
        ))}
        <DayCard
          day={saturday}
          secondDay={sunday}
          items={items}
          onUpdate={onUpdate}
          onDelete={onDelete}
          timeTracking={timeTracking}
          onTimeTrackingClick={onTimeTrackingClick}
        />
      </div>
    </div>
  );
}
