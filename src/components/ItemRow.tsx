import { useState } from "react";
import { formatTime } from "@/lib/dateUtils";
import type { Item, TodoUpdate } from "@/types/models";

interface ItemRowProps {
  item: Item;
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  compact?: boolean;
}

export function ItemRow({ item, onUpdate, onDelete, compact }: ItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);

  const handleToggle = () => {
    onUpdate(item.id, { is_complete: !item.is_complete });
  };

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== item.title) {
      onUpdate(item.id, { title: trimmed });
    } else {
      setEditTitle(item.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(item.title);
      setIsEditing(false);
    }
  };

  const isEvent = item.item_type === "event";
  const timeBadge = isEvent
    ? item.start_time
      ? item.end_time
        ? `${formatTime(item.start_time)}–${formatTime(item.end_time)}`
        : formatTime(item.start_time)
      : "All day"
    : null;

  return (
    <li
      className={`group flex items-center gap-2 rounded-md border border-gray-200 bg-white shadow-sm ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      }`}
    >
      <input
        type="checkbox"
        checked={item.is_complete}
        onChange={handleToggle}
        className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      {isEvent && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0 text-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`min-w-0 flex-1 rounded border border-gray-300 px-2 py-0.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
            compact ? "text-xs" : "text-sm"
          }`}
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={`min-w-0 flex-1 cursor-pointer truncate ${
            compact ? "text-xs" : "text-sm"
          } ${item.is_complete ? "text-gray-400 line-through" : "text-gray-900"}`}
        >
          {item.title}
        </span>
      )}

      {timeBadge && (
        <span
          className={`shrink-0 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          {timeBadge}
        </span>
      )}

      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </li>
  );
}
