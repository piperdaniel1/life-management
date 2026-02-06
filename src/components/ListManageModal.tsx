import { useState } from "react";
import { createPortal } from "react-dom";
import type { List, ListUpdate } from "@/types/models";

const PRESET_COLORS: readonly string[] = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

const DEFAULT_COLOR = "#3b82f6";

interface ListManageModalProps {
  open: boolean;
  onClose: () => void;
  lists: List[];
  onAdd: (list: { name: string; color: string; position: number }) => Promise<void>;
  onUpdate: (id: string, updates: ListUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ListManageModal({
  open,
  onClose,
  lists,
  onAdd,
  onUpdate,
  onDelete,
}: ListManageModalProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!open) return null;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await onAdd({ name: trimmed, color: newColor, position: lists.length });
    setNewName("");
    setNewColor(DEFAULT_COLOR);
  };

  const handleStartEdit = (list: List) => {
    setEditingId(list.id);
    setEditName(list.name);
    setEditColor(list.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    await onUpdate(editingId, { name: trimmed, color: editColor });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            Manage Lists
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-4">
          {/* Existing lists */}
          {lists.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              No custom lists yet.
            </p>
          )}
          <ul className="space-y-2">
            {lists.map((list) => (
              <li
                key={list.id}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2"
              >
                {editingId === list.id ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`h-5 w-5 rounded-full border-2 ${
                            editColor === c
                              ? "border-gray-900"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                      {list.name}
                    </span>
                    <button
                      onClick={() => handleStartEdit(list)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === list.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(list.id)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add new list */}
        <div className="border-t border-gray-200 p-4">
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase">
            New list
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`h-6 w-6 rounded-full border-2 ${
                  newColor === c
                    ? "border-gray-900"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="List name..."
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
