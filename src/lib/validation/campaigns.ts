import { z } from "zod";

export const campaignCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(200, "Name is too long."),
  channel: z.enum(["email", "whatsapp"] as const),
  subject: z
    .string()
    .max(200, "Subject is too long.")
    .optional(),
  body: z
    .string()
    .max(10000, "Body is too long.")
    .optional(),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;