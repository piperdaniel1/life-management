// Supabase Edge Function: deletes completed todos older than 30 days.
// Intended to be called via a cron job or manual trigger.
// Uses the service_role key (set via Supabase secrets) so it bypasses RLS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import dayjs from "https://esm.sh/dayjs@1.11.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const thirtyDaysAgo = dayjs().subtract(30, "day");

    const { data, error } = await supabase
      .from("todos")
      .delete()
      .eq("is_complete", true)
      .lt("updated_at", thirtyDaysAgo.toISOString())
      .select("id");

    if (error) throw error;

    return new Response(
      JSON.stringify({ deleted: data?.length ?? 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
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
