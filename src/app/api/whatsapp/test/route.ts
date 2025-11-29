import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

const bodySchema = z.object({
  to: z
    .string()
    .min(5, "Phone number is too short.")
    .max(20, "Phone number is too long."),
  message: z
    .string()
    .min(1, "Message is required.")
    .max(1000, "Message is too long."),
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

  const { to, message } = parsed.data;

  try {
    const sid = await sendWhatsAppMessage({ to, body: message });
    return NextResponse.json({ success: true, sid });
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error
            ? err.message
            : "Failed to send WhatsApp message",
      },
      { status: 500 }
    );
  }
}