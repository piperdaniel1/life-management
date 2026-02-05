import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dayjs } from "@/lib/dayjs";
import type { TimeEntry, TimeEntryUpdate } from "@/types/models";

export interface CalendarTimeTrackingReturn {
  entries: TimeEntry[];
  entriesByDate: Map<string, TimeEntry>;
  monthTotal: number;
  loading: boolean;
  error: string | null;
  currentMonth: { year: number; month: number };
  monthLabel: string;
  downloading: boolean;

  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  upsertEntry: (date: string, hours: number, description: string, notes?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  downloadFiles: () => Promise<void>;
}

export function useCalendarTimeTracking(): CalendarTimeTrackingReturn {
  const [currentMonth, setCurrentMonth] = useState(() => ({
    year: dayjs().year(),
    month: dayjs().month(),
  }));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { year, month } = currentMonth;

  const monthLabel = dayjs().year(year).month(month).format("MMMM YYYY");

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    const monthStart = dayjs().year(year).month(month).startOf("month");
    const firstOfMonth = monthStart.format("YYYY-MM-DD");
    const lastOfMonth = monthStart.endOf("month").format("YYYY-MM-DD");

    const { data, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .gte("date", firstOfMonth)
      .lte("date", lastOfMonth)
      .order("date", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEntries((data as TimeEntry[]) ?? []);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel(`calendar-time-entries-${year}-${month}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries" },
        () => {
          fetchEntries();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries, year, month]);

  const entriesByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries],
  );

  const monthTotal = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.hours), 0),
    [entries],
  );

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const d = dayjs().year(prev.year).month(prev.month).subtract(1, "month");
      return { year: d.year(), month: d.month() };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = dayjs().year(prev.year).month(prev.month).add(1, "month");
      return { year: d.year(), month: d.month() };
    });
  };

  const goToToday = () => {
    setCurrentMonth({ year: dayjs().year(), month: dayjs().month() });
  };

  const upsertEntry = async (
    date: string,
    hours: number,
    description: string,
    notes?: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      return;
    }

    const existing = entries.find((e) => e.date === date);

    if (existing) {
      const updates: TimeEntryUpdate = { hours, description, notes: notes ?? null };
      const { error: updateError } = await supabase
        .from("time_entries")
        .update(updates as never)
        .eq("id", existing.id);
      if (updateError) setError(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("time_entries")
        .insert({ user_id: user.id, date, hours, description, notes: notes ?? null });
      if (insertError) setError(insertError.message);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error: deleteError } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", id);
    if (deleteError) setError(deleteError.message);
  };

  const downloadFiles = async () => {
    setDownloading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const [csvRes, invoiceRes, hoursLogRes] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/time-tracking-export?month=${monthStr}`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/time-tracking-generate-docs?type=invoice&month=${monthStr}`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/time-tracking-generate-docs?type=hours-log&month=${monthStr}`, { headers }),
      ]);

      const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      if (csvRes.ok) {
        const disposition = csvRes.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `time-tracking-${monthStr}.csv`;
        triggerDownload(await csvRes.blob(), filename);
      }

      if (invoiceRes.ok) {
        const disposition = invoiceRes.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `Invoice ${monthLabel}.pdf`;
        triggerDownload(await invoiceRes.blob(), filename);
      }

      if (hoursLogRes.ok) {
        const disposition = hoursLogRes.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `Hours Log ${monthLabel}.pdf`;
        triggerDownload(await hoursLogRes.blob(), filename);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return {
    entries,
    entriesByDate,
    monthTotal,
    loading,
    error,
    currentMonth,
    monthLabel,
    downloading,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    upsertEntry,
    deleteEntry,
    downloadFiles,
  };
}
