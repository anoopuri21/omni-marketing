import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Supabase connection failed",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "ok",
    hasSession: !!data.session,
  });
}