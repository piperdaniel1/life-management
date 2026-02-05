import { lazy, Suspense, useMemo, useState } from "react";
import { dayjs } from "@/lib/dayjs";
import { getCalendarGrid } from "@/lib/dateUtils";
import { useCalendarTimeTracking } from "@/hooks/useCalendarTimeTracking";
import { CalendarMonthView } from "./CalendarMonthView";

const TimeTrackingModal = lazy(() =>
  import("./TimeTrackingModal").then((m) => ({ default: m.TimeTrackingModal }))
);

export function TimeTrackingPage() {
  const cal = useCalendarTimeTracking();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const grid = useMemo(
    () => getCalendarGrid(cal.currentMonth.year, cal.currentMonth.month),
    [cal.currentMonth.year, cal.currentMonth.month],
  );

  const isCurrentMonth =
    cal.currentMonth.year === dayjs().year() &&
    cal.currentMonth.month === dayjs().month();

  const selectedEntry = selectedDate
    ? cal.entriesByDate.get(selectedDate) ?? null
    : null;

  if (cal.loading && cal.entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {cal.error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {cal.error}
        </p>
      )}

      <CalendarMonthView
        grid={grid}
        entriesByDate={cal.entriesByDate}
        monthLabel={cal.monthLabel}
        monthTotal={cal.monthTotal}
        downloading={cal.downloading}
        isCurrentMonth={isCurrentMonth}
        onPrevMonth={cal.goToPreviousMonth}
        onNextMonth={cal.goToNextMonth}
        onToday={cal.goToToday}
        onDownload={cal.downloadFiles}
        onDayClick={setSelectedDate}
      />

      {selectedDate && (
        <Suspense fallback={null}>
          <TimeTrackingModal
            open={!!selectedDate}
            onClose={() => setSelectedDate(null)}
            date={selectedDate}
            entry={selectedEntry}
            monthTotal={cal.monthTotal}
            onSave={cal.upsertEntry}
            onDelete={cal.deleteEntry}
          />
        </Suspense>
      )}
    </>
  );
}
