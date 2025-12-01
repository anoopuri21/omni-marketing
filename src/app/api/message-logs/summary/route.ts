import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";

type SummaryPoint = {
  date: string;   // YYYY-MM-DD
  emails: number;
  whatsapp: number;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = await ensureDefaultWorkspace(supabase);

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const { data, error } = await supabase
    .from("message_logs")
    .select("created_at, channel")
    .eq("workspace_id", workspaceId)
    .eq("status", "sent")
    .gte("created_at", startIso);

  if (error) {
    console.error("Message logs summary error:", error);
    return NextResponse.json(
      { message: "Failed to load message logs" },
      { status: 500 }
    );
  }

  // Init map for each of the 7 days
  const perDayMap = new Map<string, SummaryPoint>();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start.getTime() + i * dayMs);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    perDayMap.set(dateStr, {
      date: dateStr,
      emails: 0,
      whatsapp: 0,
    });
  }

  for (const row of data ?? []) {
    const d = new Date(row.created_at as string);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = perDayMap.get(dateStr);
    if (!entry) continue;

    if (row.channel === "email") entry.emails++;
    else if (row.channel === "whatsapp") entry.whatsapp++;
  }

  const perDay = Array.from(perDayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return NextResponse.json({
    perDay,
    rangeDays: 7,
  });
}