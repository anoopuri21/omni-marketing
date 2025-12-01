import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";
import {
  workspaceUpdateSchema,
  type WorkspaceUpdateInput,
} from "@/lib/validation/settings";

// GET /api/settings/workspace
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

  // Ensure we have a default workspace and fetch it
  const workspaceId = await ensureDefaultWorkspace(supabase);

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, created_at, updated_at")
    .eq("id", workspaceId)
    .single();

  if (error || !data) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { message: "Workspace not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ workspace: data });
}

// PATCH /api/settings/workspace
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

  const parsed = workspaceUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const input: WorkspaceUpdateInput = parsed.data;

  const workspaceId = await ensureDefaultWorkspace(supabase);

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name: input.name })
    .eq("id", workspaceId)
    .select("id, owner_id, name, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Workspace update error:", error);
    return NextResponse.json(
      { message: "Failed to update workspace" },
      { status: 500 }
    );
  }

  return NextResponse.json({ workspace: data });
}