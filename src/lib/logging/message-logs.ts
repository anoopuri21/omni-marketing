import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MessageChannel,
  MessageProvider,
  MessageStatus,
} from "@/types/models";

type LogMessageArgs = {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string;
  channel: MessageChannel;
  provider: MessageProvider;
  status: MessageStatus;
  campaignId?: string | null;
  contactId?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
};

/**
 * Best-effort insert into message_logs.
 * Never throws; logs to console on failure.
 */
export async function logMessage({
  supabase,
  workspaceId,
  userId,
  channel,
  provider,
  status,
  campaignId,
  contactId,
  providerMessageId,
  errorMessage,
}: LogMessageArgs) {
  const { error } = await supabase.from("message_logs").insert({
    workspace_id: workspaceId,
    user_id: userId,
    channel,
    provider,
    status,
    campaign_id: campaignId ?? null,
    contact_id: contactId ?? null,
    provider_message_id: providerMessageId ?? null,
    error_message: errorMessage ?? null,
  });

  if (error) {
    console.error("Failed to log message:", error);
  }
}