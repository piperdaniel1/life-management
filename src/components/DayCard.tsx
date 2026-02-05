import type { DayInfo } from "@/lib/dateUtils";
import { getTimeOfDayGradient, formatDateISO, getEffectiveDate } from "@/lib/dateUtils";
import { ItemRow } from "./ItemRow";
import { TimeTrackingRow } from "./TimeTrackingRow";
import { DownloadReminderRow } from "./DownloadReminderRow";
import type { Item, TodoUpdate } from "@/types/models";
import type { TimeTrackingState, TimeTrackingActions } from "@/hooks/useTimeTracking";

interface DayCardProps {
  day: DayInfo;
  /** For combined Sat/Sun card */
  secondDay?: DayInfo;
  items: Item[];
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  timeTracking: TimeTrackingState & TimeTrackingActions;
  onTimeTrackingClick: () => void;
}

export function DayCard({
  day,
  secondDay,
  items,
  onUpdate,
  onDelete,
  timeTracking,
  onTimeTrackingClick,
}: DayCardProps) {
  const isToday = day.isToday || (secondDay?.isToday ?? false);
  const displayDateStr = formatDateISO(day.displayDate);
  const secondDateStr = secondDay
    ? formatDateISO(secondDay.displayDate)
    : null;

  // Filter items for this day card
  const dayItems = items.filter((item) => {
    const effectiveDate =
      item.item_type === "task" ? getEffectiveDate(item) : item.scheduled_date;
    if (!effectiveDate) return false;
    return (
      effectiveDate === displayDateStr ||
      (secondDateStr && effectiveDate === secondDateStr)
    );
  });

  // Sort: incomplete first, events by start_time, then tasks
  const activeItems = dayItems
    .filter((i) => !i.is_complete)
    .sort((a, b) => {
      // Events before tasks
      if (a.item_type !== b.item_type) {
        return a.item_type === "event" ? -1 : 1;
      }
      // Events sorted by start_time
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }
      return 0;
    });

  const completedItems = dayItems.filter((i) => i.is_complete);

  const label = secondDay
    ? `${day.dayLabel.slice(0, 3)}/${secondDay.dayLabel.slice(0, 3)}`
    : day.dayLabel;

  const dateLabel = secondDay
    ? `${day.dateLabel} – ${secondDay.dateLabel}`
    : day.dateLabel;

  const gradientClass = isToday ? getTimeOfDayGradient() : "bg-white";

  // Show time tracking only on today's card if it's a workday
  const showTimeTracking = isToday && timeTracking.isWorkday;
  const showDownloadReminder = isToday && timeTracking.showDownloadReminder;

  return (
    <div
      className={`flex flex-col rounded-lg border shadow-sm ${
        isToday
          ? `${gradientClass} border-blue-200 ring-2 ring-blue-300`
          : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`flex items-baseline justify-between border-b px-3 py-2 ${
          isToday ? "border-blue-200/50" : "border-gray-100"
        }`}
      >
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{dateLabel}</span>
          {day.isNextWeek && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
              next wk
            </span>
          )}
          {isToday && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              today
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {activeItems.length === 0 &&
        completedItems.length === 0 &&
        !showTimeTracking &&
        !showDownloadReminder ? (
          <p className="py-3 text-center text-xs text-gray-400">
            Nothing scheduled
          </p>
        ) : (
          <>
            <ul className="space-y-1">
              {showDownloadReminder && (
                <DownloadReminderRow
                  billingMonthLabel={timeTracking.billingMonthLabel}
                  downloading={timeTracking.downloading}
                  compact
                  onClick={timeTracking.downloadFiles}
                />
              )}
              {showTimeTracking && (
                <TimeTrackingRow
                  todayHours={timeTracking.todayHours}
                  compact
                  onClick={onTimeTrackingClick}
                />
              )}
              {activeItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </ul>
            {completedItems.length > 0 && (
              <div className="pt-1">
                <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Done ({completedItems.length})
                </p>
                <ul className="mt-1 space-y-1">
                  {completedItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      compact
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
