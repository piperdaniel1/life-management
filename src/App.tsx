import { lazy, Suspense, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Page = "dashboard" | "time-tracking" | "calendar";

const Auth = lazy(() =>
  import("@/components/Auth").then((m) => ({ default: m.Auth }))
);
const Dashboard = lazy(() =>
  import("@/components/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const TimeTrackingPage = lazy(() =>
  import("@/components/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  }))
);
const CalendarPage = lazy(() =>
  import("@/components/CalendarPage").then((m) => ({
    default: m.CalendarPage,
  }))
);

const LoadingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <p className="text-sm text-gray-500">Loading...</p>
  </div>
);

export function App() {
  const { user, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");

  if (loading) {
    return LoadingFallback;
  }

  if (!user) {
    return <Suspense fallback={LoadingFallback}><Auth /></Suspense>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[2000px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-gray-900">
              Life Management
            </h1>
            {/* Desktop nav — keep in sync with mobile bottom nav below */}
            <nav className="hidden gap-1 md:flex">
              <button
                onClick={() => setPage("dashboard")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === "dashboard"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setPage("time-tracking")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === "time-tracking"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                Time Tracking
              </button>
              <button
                onClick={() => setPage("calendar")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === "calendar"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                Calendar
              </button>
            </nav>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={signOut}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
          <button
            onClick={signOut}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 md:hidden"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[2000px] px-4 py-6 pb-24 md:pb-6">
        <Suspense fallback={LoadingFallback}>
          {page === "dashboard" && <Dashboard />}
          {page === "time-tracking" && <TimeTrackingPage />}
          {page === "calendar" && <CalendarPage />}
        </Suspense>
      </main>

      {/* Mobile bottom nav — keep in sync with desktop nav above */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="flex">
          <button
            onClick={() => setPage("dashboard")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              page === "dashboard"
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setPage("calendar")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              page === "calendar"
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-medium">Calendar</span>
          </button>
          <button
            onClick={() => setPage("time-tracking")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              page === "time-tracking"
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs font-medium">Time Tracking</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
