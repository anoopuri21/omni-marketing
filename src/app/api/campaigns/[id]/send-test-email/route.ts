import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendBasicEmail } from "@/lib/email/resend";

function getCampaignIdFromUrl(req: NextRequest): string | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // remove empty parts

  // Expect: ["api", "campaigns", "<id>", "send-test-email"]
  const campaignsIndex = segments.indexOf("campaigns");
  if (campaignsIndex === -1 || campaignsIndex + 1 >= segments.length) {
    return null;
  }

  return segments[campaignsIndex + 1] || null;
}

export async function POST(req: NextRequest) {
  const campaignId = getCampaignIdFromUrl(req);

  console.log(
    "send-test-email route called",
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

  // Fetch the campaign; RLS ensures it belongs to this user
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, workspace_id, name, channel, status, subject, body"
    )
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error("Campaign fetch error:", campaignError);
    return NextResponse.json(
      { message: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.channel !== "email") {
    return NextResponse.json(
      {
        message:
          "Test email is only available for email campaigns",
      },
      { status: 400 }
    );
  }

  const to = user.email;
  if (!to) {
    return NextResponse.json(
      { message: "User does not have an email address" },
      { status: 400 }
    );
  }

  const subject =
    campaign.subject || `Test: ${campaign.name}`;
  const body =
    campaign.body ||
    `This is a test email for campaign "${campaign.name}".`;

  try {
    await sendBasicEmail({
      to,
      subject,
      text: body,
    });

    // Optionally mark campaign as sent
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ status: "sent" })
      .eq("id", campaign.id);

    if (updateError) {
      console.error(
        "Failed to update campaign status:",
        updateError
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error sending campaign test email:", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error
            ? err.message
            : "Failed to send test email",
      },
      { status: 500 }
    );
  }
}