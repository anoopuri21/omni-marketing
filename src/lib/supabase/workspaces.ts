import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures that the current authenticated user has at least one workspace.
 * Returns the ID of an existing (or newly created) workspace.
 */
export async function ensureDefaultWorkspace(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Try to find an existing workspace for this user
  const { data: workspaces, error: fetchError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching workspaces:", fetchError);
    throw new Error("Could not fetch workspaces");
  }

  if (workspaces && workspaces.length > 0) {
    return workspaces[0].id;
  }

  // No workspace found → create a default one
  const { data: inserted, error: insertError } = await supabase
    .from("workspaces")
    .insert({
      owner_id: user.id,
      name: "Default Workspace",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Error creating default workspace:", insertError);
    throw new Error("Could not create workspace");
  }

  return inserted.id;
}