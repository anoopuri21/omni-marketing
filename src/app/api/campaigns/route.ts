import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDefaultWorkspace } from "@/lib/supabase/workspaces";
import {
  campaignCreateSchema,
  type CampaignCreateInput,
} from "@/lib/validation/campaigns";

// GET /api/campaigns - list campaigns for the current user
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
    .from("campaigns")
    .select(
      "id, workspace_id, name, channel, status, subject, body, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { message: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaigns: data ?? [] });
}

// POST /api/campaigns - create a new campaign
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

  const parsed = campaignCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const input: CampaignCreateInput = parsed.data;

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

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      channel: input.channel,
      subject: input.subject ?? null,
      body: input.body ?? null,
      // status will default to 'draft'
    })
    .select(
      "id, workspace_id, name, channel, status, subject, body, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { message: "Failed to create campaign" },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaign: data }, { status: 201 });
}