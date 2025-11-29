import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

function getCampaignIdFromUrl(req: NextRequest): string | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // remove empty parts

  // Expect: ["api", "campaigns", "<id>", "send-whatsapp-broadcast"]
  const campaignsIndex = segments.indexOf("campaigns");
  if (campaignsIndex === -1 || campaignsIndex + 1 >= segments.length) {
    return null;
  }

  return segments[campaignsIndex + 1] || null;
}

export async function POST(req: NextRequest) {
  const campaignId = getCampaignIdFromUrl(req);

  console.log(
    "send-whatsapp-broadcast route called",
    "url:",
    req.url,
    "campaignId:",
    campaignId
  );

  if (!campaignId) {
    return NextResponse.json(
      { message: "Invalid campaign id" },
      { status: 400 }
    );
  }

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

  // Fetch campaign; RLS ensures it belongs to this user
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, workspace_id, name, channel, body")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error("Campaign fetch error:", campaignError);
    return NextResponse.json(
      { message: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.channel !== "whatsapp") {
    return NextResponse.json(
      {
        message:
          "WhatsApp broadcast is only available for WhatsApp campaigns",
      },
      { status: 400 }
    );
  }

  // Get all contacts in this workspace with a phone number
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, phone, first_name, last_name")
    .eq("workspace_id", campaign.workspace_id)
    .not("phone", "is", null);

  if (contactsError) {
    console.error("Contacts fetch error:", contactsError);
    return NextResponse.json(
      { message: "Failed to load contacts" },
      { status: 500 }
    );
  }

  if (!contacts || contacts.length === 0) {
    return NextResponse.json(
      {
        message:
          "No contacts with phone number found for this workspace",
      },
      { status: 400 }
    );
  }

  const baseBody =
    campaign.body ||
    `This is a WhatsApp broadcast for campaign "${campaign.name}".`;

  let sent = 0;
  let failed = 0;
  const errors: { phone: string; message: string }[] = [];

  for (const contact of contacts) {
    const to = contact.phone;
    if (!to) continue;

    const name = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(" ");

    const body =
      name
        ? `Hi ${name},\n\n${baseBody}`
        : baseBody;

    try {
      await sendWhatsAppMessage({ to, body });
      sent++;
    } catch (err) {
      failed++;
      console.error(
        "Error sending WhatsApp to contact",
        contact.id,
        to,
        err
      );
      errors.push({
        phone: to,
        message:
          err instanceof Error
            ? err.message
            : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    success: failed === 0,
    total: contacts.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}