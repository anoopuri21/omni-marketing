import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required.")
    .max(100, "Full name is too long."),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const workspaceUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required.")
    .max(100, "Workspace name is too long."),
});

export type WorkspaceUpdateInput = z.infer<
  typeof workspaceUpdateSchema
>;