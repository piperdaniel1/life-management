import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TimeEntry } from "@/types/models";

interface TimeTrackingModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  entry: TimeEntry | null;
  monthTotal: number;
  onSave: (date: string, hours: number, description: string, notes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TimeTrackingModal({
  open,
  onClose,
  date,
  entry,
  monthTotal,
  onSave,
  onDelete,
}: TimeTrackingModalProps) {

  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-populate when editing existing entry
  useEffect(() => {
    if (open) {
      if (entry) {
        setHours(String(entry.hours));
        setDescription(entry.description);
        setNotes(entry.notes ?? "");
      } else {
        setHours("");
        setDescription("");
        setNotes("");
      }
    }
  }, [open, entry]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0 || !description.trim()) return;

    setSaving(true);
    await onSave(date, h, description.trim(), notes.trim() || undefined);
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!entry) return;
    setSaving(true);
    await onDelete(entry.id);
    setSaving(false);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {entry ? "Edit Time Entry" : "Log Time"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date (readonly) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="text"
              value={date}
              readOnly
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          {/* Hours */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hours
            </label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 8.00"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              required
              rows={3}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Month total */}
          <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Month total:{" "}
            <span className="font-semibold text-gray-900">
              {monthTotal.toFixed(2)} hrs
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              {entry && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : entry ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
