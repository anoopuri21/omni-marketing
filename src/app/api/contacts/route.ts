import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";
import {
  contactCreateSchema,
  type ContactCreateInput,
} from "@/lib/validation/contacts";

// GET /api/contacts - list current user's contacts
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
    .from("contacts")
    .select(
      "id, workspace_id, email, phone, first_name, last_name, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { message: "Failed to fetch contacts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ contacts: data ?? [] });
}

// POST /api/contacts - create a new contact
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

  const parsed = contactCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const input: ContactCreateInput = parsed.data;

  // Ensure user has a workspace and get its ID
  let workspaceId: string;
  try {
    workspaceId = await ensureDefaultWorkspace(supabase);
  } catch (err) {
    console.error("Workspace error:", err);
    return NextResponse.json(
      { message: "Could not resolve workspace" },
      { status: 500 }
    );
  }

  const { email = null, phone = null, first_name = null, last_name = null } =
    input;

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      email,
      phone,
      first_name,
      last_name,
    })
    .select(
      "id, workspace_id, email, phone, first_name, last_name, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { message: "Failed to create contact" },
      { status: 500 }
    );
  }

  return NextResponse.json({ contact: data }, { status: 201 });
}