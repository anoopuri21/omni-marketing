import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendBasicEmail } from "@/lib/email/resend";

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

  try {
    await sendBasicEmail({ to, subject, text: message });
    return NextResponse.json({ success: true });
    } catch (err) {
    console.error("Error sending email:", err);
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