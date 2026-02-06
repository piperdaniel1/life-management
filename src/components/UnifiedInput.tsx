import { FormEvent, useEffect, useState } from "react";
import { dayjs } from "@/lib/dayjs";
import { formatDateISO } from "@/lib/dateUtils";
import type { ItemType, TodoInsert, List } from "@/types/models";

interface UnifiedInputProps {
  onAdd: (item: Omit<TodoInsert, "user_id">) => Promise<void>;
  initialDate?: string;
  /** When provided, newly created items are assigned to this list */
  activeListId?: string | null;
  lists?: List[];
}

export function UnifiedInput({ onAdd, initialDate, activeListId, lists }: UnifiedInputProps) {
  const todayISO = formatDateISO(dayjs());
  const tomorrowISO = formatDateISO(dayjs().add(1, "day"));

  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState<ItemType>("task");
  // Default: no date for tasks (null), unless initialDate is provided
  const [date, setDate] = useState(initialDate ?? "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (itemType === "event" && !date) return;

    await onAdd({
      title: trimmed,
      item_type: itemType,
      scheduled_date: date || null,
      start_time: startTime || null,
      end_time: endTime || null,
      list_id: activeListId || null,
    });

    setTitle("");
    // Reset to no date unless we have an initialDate
    setDate(initialDate ?? "");
    setStartTime("");
    setEndTime("");
  };

  const isEvent = itemType === "event";
  const isToday = date === todayISO;
  const isTomorrow = date === tomorrowISO;
  const isNoDate = !date;

  // Find the active list name for display
  const activeListName = activeListId && lists
    ? lists.find((l) => l.id === activeListId)?.name
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isEvent ? "Event title..." : "Task title..."}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim() || (isEvent && !date)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex items-center justify-evenly">
        {/* Type toggle */}
        <div className="flex rounded-md border border-gray-300 text-xs">
          <button
            type="button"
            onClick={() => setItemType("task")}
            className={`rounded-l-md px-2 py-1.5 font-medium ${
              !isEvent
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Task
          </button>
          <button
            type="button"
            onClick={() => setItemType("event")}
            className={`rounded-r-md border-l border-gray-300 px-2 py-1.5 font-medium ${
              isEvent
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Event
          </button>
        </div>

        {/* Date selection: No Date / Today / Tomorrow */}
        <div className="flex rounded-md border border-gray-300 text-xs">
          {!initialDate && (
            <button
              type="button"
              onClick={() => setDate("")}
              className={`rounded-l-md px-2 py-1.5 font-medium ${
                isNoDate
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              No date
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate(todayISO)}
            className={`${initialDate ? "rounded-l-md" : "border-l border-gray-300"} px-2 py-1.5 font-medium ${
              isToday
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDate(tomorrowISO)}
            className={`rounded-r-md border-l border-gray-300 px-2 py-1.5 font-medium ${
              isTomorrow
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tomorrow
          </button>
        </div>

        {/* Date picker (for other dates) */}
        <input
          type="date"
          value={date}
          min={todayISO}
          onChange={(e) => setDate(e.target.value)}
          className={`rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
            isEvent && !date ? "border-red-300" : ""
          }`}
        />
      </div>

      {activeListName && (
        <p className="text-xs text-gray-400">
          Adding to <span className="font-medium text-gray-600">{activeListName}</span>
        </p>
      )}

      {/* Time inputs (shown when Event is selected, both optional for full-day) */}
      {isEvent && (
        <div className="flex items-center justify-evenly">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}
    </form>
  );
}
