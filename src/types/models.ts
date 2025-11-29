export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
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