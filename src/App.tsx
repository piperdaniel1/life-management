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
            <nav className="flex gap-1">
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={signOut}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[2000px] px-4 py-6">
        <Suspense fallback={LoadingFallback}>
          {page === "dashboard" && <Dashboard />}
          {page === "time-tracking" && <TimeTrackingPage />}
          {page === "calendar" && <CalendarPage />}
        </Suspense>
      </main>
    </div>
  );
}
