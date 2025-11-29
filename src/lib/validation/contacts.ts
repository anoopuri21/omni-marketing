import { z } from "zod";

export const contactCreateSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address.")
      .optional(),
    phone: z
      .string()
      .min(3, "Phone number is too short.")
      .optional(),
    first_name: z
      .string()
      .max(100, "First name is too long.")
      .optional(),
    last_name: z
      .string()
      .max(100, "Last name is too long.")
      .optional(),
  })
  .refine(
    (data) => data.email || data.phone,
    {
      message: "Either email or phone is required.",
      path: ["email"], // attach error to email field by default
    }
  );

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;