import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dayjs } from "@/lib/dayjs";
import { formatDateISO } from "@/lib/dateUtils";
import type { TimeEntry, TimeEntryUpdate } from "@/types/models";

function isWorkday(date = dayjs()): boolean {
  const day = date.day();
  return day >= 1 && day <= 5;
}

/** Get the last Mon-Fri of a given month. */
function getLastWorkday(year: number, month: number): number {
  let d = dayjs().year(year).month(month).endOf("month");
  while (d.day() === 0 || d.day() === 6) {
    d = d.subtract(1, "day");
  }
  return d.date();
}

/**
 * Determine the billing month.
 * Day 1-14: billing month = previous month.
 * Day 15+: billing month = current month.
 */
function getBillingMonth(now = dayjs()): { year: number; month: number; str: string } {
  let year = now.year();
  let month = now.month();

  if (now.date() < 15) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  const str = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { year, month, str };
}

function getCurrentMonth(now = dayjs()): { year: number; month: number; str: string } {
  const year = now.year();
  const month = now.month();
  const str = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { year, month, str };
}

/**
 * Should we show the download reminder?
 * True when:
 *  - Day 1-14 (always in download window for previous month's billing)
 *  - Day >= last workday of current billing month
 * AND no download record exists for the billing month.
 */
function isInDownloadWindow(now = dayjs()): boolean {
  const day = now.date();
  if (day < 15) return true;

  const lastWd = getLastWorkday(now.year(), now.month());
  return day >= lastWd;
}

export interface TimeTrackingState {
  entries: TimeEntry[];
  todayEntry: TimeEntry | null;
  todayHours: number;
  monthTotal: number;
  isWorkday: boolean;
  billingMonth: string;
  billingMonthLabel: string;
  showDownloadReminder: boolean;
  downloading: boolean;
  loading: boolean;
  error: string | null;
}

export interface TimeTrackingActions {
  upsertEntry: (date: string, hours: number, description: string, notes?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  downloadFiles: () => Promise<void>;
}

export function useTimeTracking(): TimeTrackingState & TimeTrackingActions {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const now = dayjs();
  const todayISO = formatDateISO(now);
  const { year, month } = getCurrentMonth(now);
  const { str: billingMonthStr } = getBillingMonth(now);
  const workday = isWorkday(now);
  const inDownloadWindow = isInDownloadWindow(now);

  const billingMonthLabel = dayjs().month(month).format("MMMM");

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

  const fetchDownloadStatus = useCallback(async () => {
    const { data } = await supabase
      .from("time_tracking_downloads")
      .select("id")
      .eq("billing_month", billingMonthStr)
      .maybeSingle();

    setDownloaded(!!data);
  }, [billingMonthStr]);

  useEffect(() => {
    fetchEntries();
    fetchDownloadStatus();

    const channel = supabase
      .channel("time-entries-changes")
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
  }, [fetchEntries, fetchDownloadStatus]);

  const todayEntry = useMemo(
    () => entries.find((e) => e.date === todayISO) ?? null,
    [entries, todayISO],
  );

  const todayHours = todayEntry?.hours ?? 0;

  const monthTotal = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.hours), 0),
    [entries],
  );

  const showDownloadReminder = inDownloadWindow && !downloaded;

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

    // Check if entry exists for this date
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

  const markDownloaded = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("time_tracking_downloads")
      .upsert(
        { user_id: user.id, billing_month: billingMonthStr },
        { onConflict: "user_id,billing_month" },
      );
    setDownloaded(true);
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

      // Download all 3 files in parallel
      const [csvRes, invoiceRes, hoursLogRes] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/time-tracking-export`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/time-tracking-generate-docs?type=invoice`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/time-tracking-generate-docs?type=hours-log`, { headers }),
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
        const filename = match?.[1] ?? `time-tracking-${billingMonthStr}.csv`;
        triggerDownload(await csvRes.blob(), filename);
      }

      if (invoiceRes.ok) {
        const disposition = invoiceRes.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `Invoice ${billingMonthLabel}.pdf`;
        triggerDownload(await invoiceRes.blob(), filename);
      }

      if (hoursLogRes.ok) {
        const disposition = hoursLogRes.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `Hours Log ${billingMonthLabel}.pdf`;
        triggerDownload(await hoursLogRes.blob(), filename);
      }

      await markDownloaded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return {
    entries,
    todayEntry,
    todayHours,
    monthTotal,
    isWorkday: workday,
    billingMonth: billingMonthStr,
    billingMonthLabel,
    showDownloadReminder,
    downloading,
    loading,
    error,
    upsertEntry,
    deleteEntry,
    downloadFiles,
  };
}
