export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}
export interface Contact {
  id: string;
  workspace_id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignChannel = "email" | "whatsapp";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "cancelled";

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  subject: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageChannel = "email" | "whatsapp";
export type MessageProvider = "resend" | "twilio";
export type MessageStatus = "queued" | "sent" | "delivered" | "failed";

export interface MessageLog {
  id: string;
  workspace_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  user_id: string;
  channel: MessageChannel;
  provider: MessageProvider;
  provider_message_id: string | null;
  status: MessageStatus;
  error_message: string | null;
  created_at: string;
}