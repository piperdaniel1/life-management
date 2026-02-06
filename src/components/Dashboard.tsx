import { lazy, Suspense, useState } from "react";
import { dayjs } from "@/lib/dayjs";
import { formatDateISO } from "@/lib/dateUtils";
import { useItems } from "@/hooks/useItems";
import { useLists } from "@/hooks/useLists";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { UnifiedInput } from "./UnifiedInput";
import { ListPanel } from "./ListPanel";
import { WeekView } from "./WeekView";

const TimeTrackingModal = lazy(() =>
  import("./TimeTrackingModal").then((m) => ({ default: m.TimeTrackingModal }))
);
const ListManageModal = lazy(() =>
  import("./ListManageModal").then((m) => ({ default: m.ListManageModal }))
);

const MASTER_TAB = "__master__";

export function Dashboard() {
  const { items, loading, error, addItem, updateItem, deleteItem } =
    useItems();
  const { lists, addList, updateList, deleteList } = useLists();
  const timeTracking = useTimeTracking();
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState(MASTER_TAB);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Determine list_id for new items based on active tab
  const activeListId =
    activeTabId !== MASTER_TAB && activeTabId !== "__completed__"
      ? activeTabId
      : null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Left panel: input + list panel */}
      <div className="w-full shrink-0 space-y-4 lg:w-80 xl:w-96">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2">
          <UnifiedInput
            onAdd={addItem}
            activeListId={activeListId}
            lists={lists}
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <ListPanel
          items={items}
          lists={lists}
          onUpdate={updateItem}
          onDelete={deleteItem}
          timeTracking={timeTracking}
          onTimeTrackingClick={() => setTimeModalOpen(true)}
          onManageLists={() => setListModalOpen(true)}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      </div>

      {/* Right panel: week view */}
      <div className="min-w-0 flex-1">
        <WeekView
          items={items}
          onUpdate={updateItem}
          onDelete={deleteItem}
          timeTracking={timeTracking}
          onTimeTrackingClick={() => setTimeModalOpen(true)}
        />
      </div>

      {timeModalOpen && (
        <Suspense fallback={null}>
          <TimeTrackingModal
            open={timeModalOpen}
            onClose={() => setTimeModalOpen(false)}
            date={formatDateISO(dayjs())}
            entry={timeTracking.todayEntry}
            monthTotal={timeTracking.monthTotal}
            onSave={timeTracking.upsertEntry}
            onDelete={timeTracking.deleteEntry}
          />
        </Suspense>
      )}

      {listModalOpen && (
        <Suspense fallback={null}>
          <ListManageModal
            open={listModalOpen}
            onClose={() => setListModalOpen(false)}
            lists={lists}
            onAdd={addList}
            onUpdate={updateList}
            onDelete={deleteList}
          />
        </Suspense>
      )}
    </div>
  );
}
