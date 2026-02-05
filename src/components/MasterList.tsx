import { dayjs } from "@/lib/dayjs";
import { getEffectiveDate, formatDateISO } from "@/lib/dateUtils";
import { ItemRow } from "./ItemRow";
import { TimeTrackingRow } from "./TimeTrackingRow";
import { DownloadReminderRow } from "./DownloadReminderRow";
import type { Item, TodoUpdate } from "@/types/models";
import type { TimeTrackingState, TimeTrackingActions } from "@/hooks/useTimeTracking";

interface MasterListProps {
  items: Item[];
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  timeTracking: TimeTrackingState & TimeTrackingActions;
  onTimeTrackingClick: () => void;
}

export function MasterList({
  items,
  onUpdate,
  onDelete,
  timeTracking,
  onTimeTrackingClick,
}: MasterListProps) {
  const todayISO = formatDateISO(dayjs());

  // Active (incomplete) items sorted: today first, then by date, events by start_time
  const activeItems = items
    .filter((i) => !i.is_complete)
    .sort((a, b) => {
      const dateA = getEffectiveDate(a);
      const dateB = getEffectiveDate(b);

      // Items dated today come first
      const aIsToday = dateA === todayISO;
      const bIsToday = dateB === todayISO;
      if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;

      // Unscheduled items after scheduled ones
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      // Sort by date
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // Events before tasks on same date
      if (a.item_type !== b.item_type) {
        return a.item_type === "event" ? -1 : 1;
      }

      // Events by start_time
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }

      return 0;
    });

  const completedItems = items.filter((i) => i.is_complete);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        Master List
      </h2>

      {activeItems.length === 0 &&
      completedItems.length === 0 &&
      !timeTracking.isWorkday &&
      !timeTracking.showDownloadReminder ? (
        <p className="py-6 text-center text-sm text-gray-400">
          No items yet. Add one above.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {timeTracking.showDownloadReminder && (
              <DownloadReminderRow
                billingMonthLabel={timeTracking.billingMonthLabel}
                downloading={timeTracking.downloading}
                onClick={timeTracking.downloadFiles}
              />
            )}
            {timeTracking.isWorkday && (
              <TimeTrackingRow
                todayHours={timeTracking.todayHours}
                onClick={onTimeTrackingClick}
              />
            )}
            {activeItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </ul>

          {completedItems.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Completed ({completedItems.length})
              </h3>
              <ul className="space-y-1.5">
                {completedItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
