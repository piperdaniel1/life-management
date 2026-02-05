interface DownloadReminderRowProps {
  billingMonthLabel: string;
  downloading: boolean;
  compact?: boolean;
  onClick: () => void;
}

export function DownloadReminderRow({
  billingMonthLabel,
  downloading,
  compact,
  onClick,
}: DownloadReminderRowProps) {
  return (
    <li
      onClick={downloading ? undefined : onClick}
      className={`group flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 shadow-sm transition-colors ${
        downloading ? "cursor-wait opacity-70" : "cursor-pointer hover:bg-amber-100"
      } ${compact ? "px-2 py-1.5" : "px-3 py-2.5"}`}
    >
      {downloading ? (
        /* Spinner */
        <svg
          className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        /* Download icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0 text-amber-600"
        >
          <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
        </svg>
      )}

      <span
        className={`min-w-0 flex-1 truncate font-medium text-amber-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {downloading
          ? "Downloading timesheets..."
          : `Download ${billingMonthLabel} Timesheets`}
      </span>
    </li>
  );
}
