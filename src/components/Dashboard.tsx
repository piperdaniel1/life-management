import { useState } from "react";
import { useItems } from "@/hooks/useItems";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { UnifiedInput } from "./UnifiedInput";
import { MasterList } from "./MasterList";
import { WeekView } from "./WeekView";
import { TimeTrackingModal } from "./TimeTrackingModal";

export function Dashboard() {
  const { items, loading, error, addItem, updateItem, deleteItem } =
    useItems();
  const timeTracking = useTimeTracking();
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Left panel: input + master list */}
      <div className="w-full shrink-0 space-y-4 lg:w-80 xl:w-96">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2">
          <UnifiedInput onAdd={addItem} />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <MasterList
          items={items}
          onUpdate={updateItem}
          onDelete={deleteItem}
          timeTracking={timeTracking}
          onTimeTrackingClick={() => setTimeModalOpen(true)}
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

      <TimeTrackingModal
        open={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        todayEntry={timeTracking.todayEntry}
        monthTotal={timeTracking.monthTotal}
        onSave={timeTracking.upsertEntry}
        onDelete={timeTracking.deleteEntry}
      />
    </div>
  );
}
