import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendBasicEmail } from "@/lib/email/resend";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";
import { logMessage } from "@/lib/logging/message-logs";

const bodySchema = z.object({
  to: z.string().email("Invalid recipient email."),
  subject: z.string().min(1, "Subject is required.").max(200),
  message: z.string().min(1, "Message is required.").max(5000),
});

export async function POST(req: NextRequest) {
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

    const { to, subject, message } = parsed.data;

  // Resolve workspace so logs are associated
  const workspaceId = await ensureDefaultWorkspace(supabase);

  try {
    const data = await sendBasicEmail({
      to,
      subject,
      text: message,
    });

    await logMessage({
      supabase,
      workspaceId,
      userId: user.id,
      channel: "email",
      provider: "resend",
      status: "sent",
      providerMessageId: (data as any)?.id ?? null,
      campaignId: null,
      contactId: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);

    await logMessage({
      supabase,
      workspaceId,
      userId: user.id,
      channel: "email",
      provider: "resend",
      status: "failed",
      providerMessageId: null,
      campaignId: null,
      contactId: null,
      errorMessage:
        err instanceof Error ? err.message : "Unknown error",
    });

    return NextResponse.json(
      {
        message:
          err instanceof Error
            ? err.message
            : "Failed to send email",
      },
      { status: 500 }
    );
  }
}