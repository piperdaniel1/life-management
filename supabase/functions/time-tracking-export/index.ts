import { createClient } from "npm:@supabase/supabase-js@2";
import dayjs from "npm:dayjs@1.11.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Determine the billing month.
 * Days 1-14: previous month. Days 15+: current month.
 */
function getBillingMonth(now = dayjs()): { year: number; month: number } {
  const day = now.date();
  let year = now.year();
  let month = now.month(); // 0-indexed

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

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");

    let year: number, month: number;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y!;
      month = m! - 1;
    } else {
      ({ year, month } = getBillingMonth(dayjs()));
    }

    const monthStart = dayjs().year(year).month(month).startOf("month");
    const firstOfMonth = monthStart.format("YYYY-MM-DD");
    const lastOfMonth = monthStart.endOf("month").format("YYYY-MM-DD");

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
          dayjs(entry.date).format("M/D/YYYY"),
          dayjs(entry.date).format("dddd"),
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
