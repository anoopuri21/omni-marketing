import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateCampaignContent,
  type GeneratedCampaignContent,
} from "@/lib/ai/openai";

const bodySchema = z.object({
  brief: z
    .string()
    .min(5, "Brief is too short.")
    .max(500, "Brief is too long."),
  channel: z.enum(["email", "whatsapp"]),
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

  const { brief, channel } = parsed.data;

  try {
    const result: GeneratedCampaignContent =
      await generateCampaignContent({
        productOrOffer: brief,
        channel,
      });

    return NextResponse.json(result);
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error
            ? err.message
            : "Failed to generate content",
      },
      { status: 500 }
    );
  }
}