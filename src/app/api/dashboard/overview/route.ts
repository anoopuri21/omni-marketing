import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";

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

  // Last 7 days range (inclusive today)
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  // Run queries in parallel
  const [contactsRes, emailCampaignsRes, whatsappCampaignsRes, logsRes] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("channel", "email"),
      supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("channel", "whatsapp"),
      supabase
        .from("message_logs")
        .select("id, channel")
        .eq("workspace_id", workspaceId)
        .eq("status", "sent")
        .gte("created_at", startIso),
    ]);

  if (contactsRes.error) {
    console.error("Overview contacts error:", contactsRes.error);
    return NextResponse.json(
      { message: "Failed to load contacts count" },
      { status: 500 }
    );
  }
  if (emailCampaignsRes.error || whatsappCampaignsRes.error) {
    console.error("Overview campaigns error:", {
      email: emailCampaignsRes.error,
      whatsapp: whatsappCampaignsRes.error,
    });
    return NextResponse.json(
      { message: "Failed to load campaign counts" },
      { status: 500 }
    );
  }
  if (logsRes.error) {
    console.error("Overview logs error:", logsRes.error);
    return NextResponse.json(
      { message: "Failed to load message logs" },
      { status: 500 }
    );
  }

  const contactCount = contactsRes.count ?? 0;
  const emailCampaignCount = emailCampaignsRes.count ?? 0;
  const whatsappCampaignCount = whatsappCampaignsRes.count ?? 0;

  let emailsSentLast7d = 0;
  let whatsappSentLast7d = 0;

  for (const row of logsRes.data ?? []) {
    if (row.channel === "email") emailsSentLast7d++;
    else if (row.channel === "whatsapp") whatsappSentLast7d++;
  }

  return NextResponse.json({
    contactCount,
    emailCampaignCount,
    whatsappCampaignCount,
    emailsSentLast7d,
    whatsappSentLast7d,
  });
}