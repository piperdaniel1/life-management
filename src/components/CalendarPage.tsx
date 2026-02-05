import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { dayjs } from "@/lib/dayjs";
import { getCalendarGrid, getEffectiveDate } from "@/lib/dateUtils";
import { useItems } from "@/hooks/useItems";
import { ItemCalendarMonthView } from "./ItemCalendarMonthView";
import type { Item } from "@/types/models";

const CalendarDayModal = lazy(() =>
  import("./CalendarDayModal").then((m) => ({ default: m.CalendarDayModal }))
);

export function CalendarPage() {
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { items, addItem, updateItem, deleteItem } = useItems();

  const grid = useMemo(() => getCalendarGrid(year, month), [year, month]);

  // Group items by their effective display date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const date =
        item.item_type === "task" ? getEffectiveDate(item) : item.scheduled_date;
      if (!date) continue;
      const existing = map.get(date);
      if (existing) {
        existing.push(item);
      } else {
        map.set(date, [item]);
      }
    }
    return map;
  }, [items]);

  const isCurrentMonth =
    year === now.year() && month === now.month();

  const monthLabel = dayjs().year(year).month(month).format("MMMM YYYY");

  const onPrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const onNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const onToday = useCallback(() => {
    const today = dayjs();
    setYear(today.year());
    setMonth(today.month());
  }, []);

  return (
    <div>
      <ItemCalendarMonthView
        grid={grid}
        itemsByDate={itemsByDate}
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
        onDayClick={setSelectedDate}
      />

      <Suspense fallback={null}>
        <CalendarDayModal
          open={selectedDate !== null}
          onClose={() => setSelectedDate(null)}
          dateISO={selectedDate ?? ""}
          items={selectedDate ? (itemsByDate.get(selectedDate) ?? []) : []}
          onAdd={addItem}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      </Suspense>
    </div>
  );
}
