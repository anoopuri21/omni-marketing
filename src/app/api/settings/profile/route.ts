import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validation/settings";

// GET /api/settings/profile
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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ profile: data });
}

// PATCH /api/settings/profile
export async function PATCH(req: NextRequest) {
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

  const parsed = profileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const input: ProfileUpdateInput = parsed.data;

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name })
    .eq("id", user.id)
    .select("id, email, full_name, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: data });
}