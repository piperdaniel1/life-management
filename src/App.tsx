import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";

export function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[2000px] items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Life Management
          </h1>
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
        <Dashboard />
      </main>
    </div>
  );
}
