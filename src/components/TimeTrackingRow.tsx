interface TimeTrackingRowProps {
  todayHours: number;
  compact?: boolean;
  onClick: () => void;
}

export function TimeTrackingRow({
  todayHours,
  compact,
  onClick,
}: TimeTrackingRowProps) {
  const label =
    todayHours > 0
      ? `Time Tracking — ${todayHours.toFixed(2)} hrs`
      : "Time Tracking — No time logged";

  return (
    <li
      onClick={onClick}
      className={`group flex cursor-pointer items-center gap-2 rounded-md border border-teal-200 bg-teal-50 shadow-sm transition-colors hover:bg-teal-100 ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      }`}
    >
      {/* Clock icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5 shrink-0 text-teal-600"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
          clipRule="evenodd"
        />
      </svg>

      <span
        className={`min-w-0 flex-1 truncate font-medium text-teal-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {label}
      </span>
    </li>
  );
}
