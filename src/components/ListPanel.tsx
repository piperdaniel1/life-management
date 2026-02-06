import { useRef, useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { dayjs } from "@/lib/dayjs";
import { getEffectiveDate, formatDateISO } from "@/lib/dateUtils";
import { DraggableItemRow } from "./DraggableItemRow";
import { ItemRow } from "./ItemRow";
import { TimeTrackingRow } from "./TimeTrackingRow";
import { DownloadReminderRow } from "./DownloadReminderRow";
import type { Item, List, TodoUpdate } from "@/types/models";
import type { TimeTrackingState, TimeTrackingActions } from "@/hooks/useTimeTracking";

// Tab IDs
const MASTER_TAB = "__master__";
const COMPLETED_TAB = "__completed__";

interface Tab {
  id: string;
  label: string;
  color: string | null;
}

function DroppableArea({
  id,
  children,
  isOver,
}: {
  id: string;
  children: React.ReactNode;
  isOver?: boolean;
}) {
  const { setNodeRef, isOver: droppableIsOver } = useDroppable({ id });
  const active = isOver ?? droppableIsOver;
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-lg transition-colors ${
        active ? "bg-blue-50 ring-2 ring-blue-200" : ""
      }`}
    >
      {children}
    </div>
  );
}

interface ListPanelProps {
  items: Item[];
  lists: List[];
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  timeTracking: TimeTrackingState & TimeTrackingActions;
  onTimeTrackingClick: () => void;
  onManageLists: () => void;
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export function ListPanel({
  items,
  lists,
  onUpdate,
  onDelete,
  timeTracking,
  onTimeTrackingClick,
  onManageLists,
  activeTabId,
  onTabChange,
}: ListPanelProps) {
  const todayISO = formatDateISO(dayjs());
  const [dragItem, setDragItem] = useState<Item | null>(null);

  // Build tabs: MASTER + custom lists + COMPLETED
  const tabs: Tab[] = [
    { id: MASTER_TAB, label: "Master", color: null },
    ...lists.map((l) => ({ id: l.id, label: l.name, color: l.color })),
    { id: COMPLETED_TAB, label: "Completed", color: null },
  ];

  // Make sure active tab is valid
  const activeTab: Tab =
    tabs.find((t) => t.id === activeTabId) ?? tabs[0]!;

  // ─── Item filtering ────────────────────────────────────────
  // MASTER: All items scheduled for today + unscheduled uncategorized items
  const masterItems = items
    .filter((i) => {
      if (i.is_complete) return false;
      const effective = getEffectiveDate(i);
      // Scheduled for today (or overdue tasks pulled to today)
      if (effective === todayISO) return true;
      // Unscheduled AND not assigned to any list
      if (!effective && !i.list_id) return true;
      return false;
    })
    .sort((a, b) => {
      const dateA = getEffectiveDate(a);
      const dateB = getEffectiveDate(b);
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      if (a.item_type !== b.item_type)
        return a.item_type === "event" ? -1 : 1;
      if (a.start_time && b.start_time)
        return a.start_time.localeCompare(b.start_time);
      return 0;
    });

  // Custom list items
  const getListItems = (listId: string) =>
    items
      .filter((i) => !i.is_complete && i.list_id === listId)
      .sort((a, b) => {
        if (a.item_type !== b.item_type)
          return a.item_type === "event" ? -1 : 1;
        if (a.start_time && b.start_time)
          return a.start_time.localeCompare(b.start_time);
        return 0;
      });

  // COMPLETED: all completed items
  const completedItems = items.filter((i) => i.is_complete);

  const getActiveItems = (): Item[] => {
    if (activeTab.id === MASTER_TAB) return masterItems;
    if (activeTab.id === COMPLETED_TAB) return completedItems;
    return getListItems(activeTab.id);
  };

  const activeItems = getActiveItems();

  // ─── Drag and drop ────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as Item | undefined;
    if (item) setDragItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = active.data.current?.item as Item | undefined;
    if (!item) return;

    const targetId = over.id as string;
    if (targetId === MASTER_TAB) {
      // Move to master = remove from list
      if (item.list_id) {
        onUpdate(item.id, { list_id: null });
      }
    } else if (targetId === COMPLETED_TAB) {
      // Drop on completed = mark complete
      if (!item.is_complete) {
        onUpdate(item.id, { is_complete: true });
      }
    } else {
      // Drop on a custom list
      if (item.list_id !== targetId) {
        onUpdate(item.id, { list_id: targetId });
      }
    }
  };

  // ─── Mobile swipe ─────────────────────────────────────────
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't capture swipe if a drag is in progress
    if (dragItem) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, [dragItem]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || dragItem) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only register horizontal swipes (ignore vertical scrolling)
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

      const currentIdx = tabs.findIndex((t) => t.id === activeTab.id);
      const nextTab = dx < 0 ? tabs[currentIdx + 1] : tabs[currentIdx - 1];
      if (nextTab) onTabChange(nextTab.id);
    },
    [tabs, activeTab.id, onTabChange, dragItem],
  );

  // ─── Tab scroll into view ────────────────────────────────
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = tabRefs.current.get(activeTab.id);
    if (btn && tabBarRef.current) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab.id]);

  const isMaster = activeTab.id === MASTER_TAB;
  const isCompleted = activeTab.id === COMPLETED_TAB;
  const currentList = lists.find((l) => l.id === activeTab.id);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          <div
            ref={tabBarRef}
            className="flex flex-1 gap-1 overflow-x-auto px-1 py-1.5 scrollbar-hide"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab.id === tab.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
                {tab.label}
                {tab.id === COMPLETED_TAB && (
                  <span className="text-[10px] opacity-60">
                    {completedItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* Settings button */}
          <button
            onClick={onManageLists}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Manage lists"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content area */}
        <div
          ref={swipeContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="pt-3"
        >
          <DroppableArea id={activeTab.id}>
            {/* Time tracking rows (only on master) */}
            {isMaster && (
              <ul className="space-y-1.5 mb-2">
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
              </ul>
            )}

            {activeItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {isCompleted
                  ? "No completed items."
                  : isMaster
                    ? "No items for today. Add one above."
                    : `No items in ${currentList?.name ?? "this list"}.`}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {activeItems.map((item) =>
                  isCompleted ? (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ) : (
                    <DraggableItemRow
                      key={item.id}
                      item={item}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ),
                )}
              </ul>
            )}
          </DroppableArea>

          {/* Drop zones for other lists (shown during drag) */}
          {dragItem && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase">
                Drop to move
              </p>
              <div className="grid grid-cols-2 gap-2">
                {tabs
                  .filter((t) => t.id !== activeTab.id)
                  .map((tab) => (
                    <DropTarget
                      key={tab.id}
                      id={tab.id}
                      label={tab.label}
                      color={tab.color}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {dragItem && (
          <div className="flex items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-2.5 shadow-lg">
            <span className="truncate text-sm text-gray-900">
              {dragItem.title}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DropTarget({
  id,
  label,
  color,
}: {
  id: string;
  label: string;
  color: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-3 text-xs font-medium transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50 text-blue-700"
          : "border-gray-300 text-gray-500"
      }`}
    >
      {color && (
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </div>
  );
}
