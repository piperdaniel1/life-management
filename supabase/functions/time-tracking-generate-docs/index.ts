import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================
// CONFIGURATION
// ============================================
const HOURLY_RATE = 55.0;
const CLIENT_NAME = "Merging Solutions, LLC";
const CONTACT_NAME = "Daniel Piper";
const CONTACT_PHONE = "(541) 363-9921";
const CONTACT_EMAIL = "daniel@danielpiper.dev";
// ============================================

interface TimeEntry {
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
}

interface WeekGroup {
  [weekNum: number]: TimeEntry[];
}

interface BillingEntry {
  date: string;
  description: string;
  amount: number;
}

/**
 * Determine the billing month.
 * Days 1-14: previous month. Days 15+: current month.
 */
function getBillingMonth(now: Date): { year: number; month: number } {
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (day < 15) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  return { year, month };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

function formatMD(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMMDDYY(dateStr: string): string {
  const d = parseDate(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

function formatFullDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Get week number within month (1-indexed, weeks start on Sunday).
 */
function getWeekNumber(dateStr: string): number {
  const date = parseDate(dateStr);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysUntilSunday = (7 - firstDay.getDay()) % 7;
  const firstSun = new Date(firstDay);
  firstSun.setDate(firstDay.getDate() + daysUntilSunday);

  if (date < firstSun) return 1;

  const isSameDay = firstSun.getTime() === firstDay.getTime();
  const base = isSameDay ? 1 : 2;
  const diffDays = Math.floor((date.getTime() - firstSun.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + base;
}

function groupEntriesByWeek(entries: TimeEntry[]): WeekGroup {
  const weeks: WeekGroup = {};
  for (const entry of entries) {
    const weekNum = getWeekNumber(entry.date);
    if (!weeks[weekNum]) weeks[weekNum] = [];
    weeks[weekNum]!.push(entry);
  }
  return weeks;
}

/**
 * Generate Invoice PDF
 */
async function generateInvoicePdf(
  year: number,
  month: number,
  weeks: WeekGroup,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const monthYear = formatMonthYear(year, month);
  const billingEntries: BillingEntry[] = [];
  let totalAmount = 0;

  const lastDay = new Date(year, month + 1, 0);
  const invoiceDateStr = `${MONTH_NAMES[month]} ${lastDay.getDate()}${getOrdinalSuffix(lastDay.getDate())}, ${year}`;

  // Payment due: 45 days after end of month, snapped to the 15th
  const dueDate = new Date(lastDay);
  dueDate.setDate(dueDate.getDate() + 45);
  dueDate.setDate(15);
  const paymentDueDateStr = `${MONTH_NAMES[dueDate.getMonth()]} ${dueDate.getDate()}${getOrdinalSuffix(dueDate.getDate())}`;

  const sortedWeeks = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  for (const weekNum of sortedWeeks) {
    const weekEntries = weeks[weekNum]!;
    const weekHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);
    const weekAmount = weekHours * HOURLY_RATE;
    totalAmount += weekAmount;

    const dates = weekEntries.map((e) => e.date).sort();
    const weekStart = dates[0]!;
    const weekEnd = dates[dates.length - 1]!;

    const weekLabel = `${monthYear} Week ${weekNum} (${formatMD(weekStart)} - ${formatMD(weekEnd)})`;

    billingEntries.push({
      date: formatMMDDYY(weekEnd),
      description: weekLabel,
      amount: weekAmount,
    });
  }

  let y = height - 50;
  const leftMargin = 50;
  const rightMargin = 562;

  // Header
  page.drawText("Invoice", { x: leftMargin, y, size: 28, font: helveticaBold });
  y -= 25;

  page.drawText(invoiceDateStr, { x: leftMargin, y, size: 14, font: helvetica });
  y -= 20;

  page.drawText(`${CONTACT_NAME} - ${CONTACT_PHONE} - ${CONTACT_EMAIL}`, {
    x: leftMargin, y, size: 11, font: helvetica, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 25;

  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 25;

  page.drawText(`The following is billed to ${CLIENT_NAME} for ${monthYear}`, {
    x: leftMargin, y, size: 12, font: helveticaBold,
  });
  y -= 25;

  // Table
  const col1X = leftMargin;
  const col2X = leftMargin + 80;
  const col3X = rightMargin - 70;
  const tableTop = y;

  page.drawRectangle({
    x: leftMargin, y: y - 5, width: rightMargin - leftMargin, height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });

  page.drawText("Date", { x: col1X + 5, y, size: 10, font: helveticaBold });
  page.drawText("Description", { x: col2X + 5, y, size: 10, font: helveticaBold });
  page.drawText("Amount", { x: col3X + 5, y, size: 10, font: helveticaBold });
  y -= 20;

  for (const entry of billingEntries) {
    page.drawText(entry.date, { x: col1X + 5, y, size: 10, font: helvetica });
    page.drawText(entry.description, { x: col2X + 5, y, size: 10, font: helvetica });
    page.drawText(`$${entry.amount.toFixed(2)}`, { x: col3X + 5, y, size: 10, font: helvetica });
    y -= 18;
  }

  const tableBottom = y + 13;

  page.drawRectangle({
    x: leftMargin, y: tableBottom,
    width: rightMargin - leftMargin, height: tableTop - tableBottom + 15,
    borderColor: rgb(0, 0, 0), borderWidth: 1,
  });

  page.drawLine({ start: { x: col2X, y: tableTop + 15 }, end: { x: col2X, y: tableBottom }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: col3X, y: tableTop + 15 }, end: { x: col3X, y: tableBottom }, thickness: 1, color: rgb(0, 0, 0) });
  page.drawLine({ start: { x: leftMargin, y: tableTop - 5 }, end: { x: rightMargin, y: tableTop - 5 }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 15;

  const totalStr = `Total: $${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 14);
  page.drawText(totalStr, { x: rightMargin - totalWidth, y, size: 14, font: helveticaBold });
  y -= 25;

  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 25;

  page.drawText("Payment Notes:", { x: leftMargin, y, size: 12, font: helveticaBold });
  y -= 18;
  page.drawText("• Payment via direct deposit", { x: leftMargin + 10, y, size: 11, font: helvetica });
  y -= 16;
  page.drawText(`• Payment expected by ${paymentDueDateStr}`, { x: leftMargin + 10, y, size: 11, font: helvetica });

  return pdfDoc.save();
}

/**
 * Generate Hours Log PDF
 */
async function generateHoursLogPdf(
  year: number,
  month: number,
  weeks: WeekGroup,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const monthYear = formatMonthYear(year, month);

  let y = height - 50;
  const leftMargin = 50;
  const rightMargin = 562;

  page.drawText(`PG&E ${monthYear} Hours Log`, { x: leftMargin, y, size: 20, font: helveticaBold });
  y -= 30;

  const sortedWeeks = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  let totalHours = 0;

  for (const weekNum of sortedWeeks) {
    const weekEntries = weeks[weekNum]!;

    if (y < 100) {
      page = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }

    page.drawText(`Week ${weekNum}`, { x: leftMargin, y, size: 16, font: helveticaBold });
    const weekHeaderWidth = helveticaBold.widthOfTextAtSize(`Week ${weekNum}`, 16);
    page.drawLine({
      start: { x: leftMargin, y: y - 2 },
      end: { x: leftMargin + weekHeaderWidth, y: y - 2 },
      thickness: 1, color: rgb(0, 0, 0),
    });
    y -= 25;

    const sortedEntries = [...weekEntries].sort((a, b) => a.date.localeCompare(b.date));

    for (const entry of sortedEntries) {
      if (y < 80) {
        page = pdfDoc.addPage([612, 792]);
        y = height - 50;
      }

      totalHours += entry.hours;
      const dateStr = formatFullDate(entry.date);

      page.drawText(dateStr, { x: leftMargin, y, size: 13, font: helveticaBold });
      const dateWidth = helveticaBold.widthOfTextAtSize(dateStr, 13);
      page.drawLine({
        start: { x: leftMargin, y: y - 2 },
        end: { x: leftMargin + dateWidth, y: y - 2 },
        thickness: 0.5, color: rgb(0, 0, 0),
      });
      y -= 18;

      page.drawText("Total Hours: ", { x: leftMargin, y, size: 11, font: helveticaBold });
      const hoursLabelWidth = helveticaBold.widthOfTextAtSize("Total Hours: ", 11);
      page.drawText(`${entry.hours}`, { x: leftMargin + hoursLabelWidth, y, size: 11, font: helvetica });
      y -= 16;

      page.drawText("Description: ", { x: leftMargin, y, size: 11, font: helveticaOblique });
      const descLabelWidth = helveticaOblique.widthOfTextAtSize("Description: ", 11);

      const maxDescWidth = rightMargin - leftMargin - descLabelWidth;
      let descX = leftMargin + descLabelWidth;

      const words = entry.description.split(" ");
      let currentLine = "";
      let firstLine = true;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = helvetica.widthOfTextAtSize(testLine, 11);

        if (testWidth > maxDescWidth && currentLine) {
          page.drawText(currentLine, { x: descX, y, size: 11, font: helvetica });
          y -= 14;
          currentLine = word;
          if (firstLine) {
            descX = leftMargin;
            firstLine = false;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, { x: descX, y, size: 11, font: helvetica });
        y -= 20;
      }
    }

    y -= 10;
  }

  y -= 10;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 20;

  page.drawText(`Total Hours for ${monthYear}: ${totalHours}`, {
    x: leftMargin, y, size: 12, font: helveticaBold,
  });

  return pdfDoc.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const docType = url.searchParams.get("type");

  if (docType !== "invoice" && docType !== "hours-log") {
    return new Response("Invalid type parameter. Use ?type=invoice or ?type=hours-log", {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
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

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const now = new Date();
    const { year, month } = getBillingMonth(now);
    const monthYear = formatMonthYear(year, month);

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

    const timeEntries: TimeEntry[] = (entries ?? []).map((e: { date: string; hours: number; description: string }) => ({
      date: e.date,
      hours: e.hours,
      description: e.description,
    }));

    const weeks = groupEntriesByWeek(timeEntries);

    if (Object.keys(weeks).length === 0) {
      return new Response(`No entries found for ${monthYear}`, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    let pdfBytes: Uint8Array;
    let filename: string;

    if (docType === "invoice") {
      pdfBytes = await generateInvoicePdf(year, month, weeks);
      filename = `${CLIENT_NAME} ${monthYear} Invoice.pdf`;
    } else {
      pdfBytes = await generateHoursLogPdf(year, month, weeks);
      filename = `PG&E ${monthYear} Hours Log.pdf`;
    }

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
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
