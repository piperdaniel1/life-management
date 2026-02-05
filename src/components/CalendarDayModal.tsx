import { useEffect } from "react";
import { createPortal } from "react-dom";
import { dayjs } from "@/lib/dayjs";
import { ItemRow } from "./ItemRow";
import { UnifiedInput } from "./UnifiedInput";
import type { Item, TodoInsert, TodoUpdate } from "@/types/models";

interface CalendarDayModalProps {
  open: boolean;
  onClose: () => void;
  dateISO: string;
  items: Item[];
  onAdd: (item: Omit<TodoInsert, "user_id">) => Promise<void>;
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CalendarDayModal({
  open,
  onClose,
  dateISO,
  items,
  onAdd,
  onUpdate,
  onDelete,
}: CalendarDayModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const dateLabel = dayjs(dateISO).format("dddd, MMM D");

  // Sort: events by start_time first, then tasks
  const sorted = [...items].sort((a, b) => {
    if (a.item_type !== b.item_type) return a.item_type === "event" ? -1 : 1;
    if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
    return 0;
  });

  const activeItems = sorted.filter((i) => !i.is_complete);
  const completedItems = sorted.filter((i) => i.is_complete);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 flex w-full max-w-lg flex-col rounded-lg border border-gray-200 bg-white shadow-xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{dateLabel}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeItems.length === 0 && completedItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Nothing scheduled
            </p>
          ) : (
            <>
              <ul className="space-y-1">
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

        {/* Footer: add item form */}
        <div className="border-t border-gray-100 px-4 py-3">
          <UnifiedInput onAdd={onAdd} initialDate={dateISO} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
