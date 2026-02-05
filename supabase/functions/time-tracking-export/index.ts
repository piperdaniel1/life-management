import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatDateMDY(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(m!)}/${parseInt(d!)}/${y}`;
}

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return DAYS_OF_WEEK[date.getDay()]!;
}

/**
 * Determine the billing month.
 * Days 1-14: previous month. Days 15+: current month.
 */
function getBillingMonth(now: Date): { year: number; month: number } {
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (day < 15) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  return { year, month };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response("Missing authorization header", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create client with the user's JWT to respect RLS
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const now = new Date();
    const { year, month } = getBillingMonth(now);

    const firstOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const lastOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("*")
      .gte("date", firstOfMonth)
      .lte("date", lastOfMonth)
      .order("date", { ascending: true });

    if (error) throw error;

    const csvLines: string[] = [];
    csvLines.push("Date,Day of Week,Hours,Description,Notes");

    for (const entry of entries ?? []) {
      csvLines.push(
        [
          formatDateMDY(entry.date),
          getDayOfWeek(entry.date),
          entry.hours.toString(),
          escapeCsvField(entry.description),
          escapeCsvField(entry.notes ?? ""),
        ].join(","),
      );
    }

    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const filename = `time-tracking-${monthStr}.csv`;

    return new Response(csvLines.join("\n"), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
