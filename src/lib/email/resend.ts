import { Resend } from "resend";
import { serverEnv } from "@/lib/validation/env";

const resend = new Resend(serverEnv.RESEND_API_KEY);

type SendBasicEmailArgs = {
  to: string;
  subject: string;
  text: string;
};

export async function sendBasicEmail({
  to,
  subject,
  text,
}: SendBasicEmailArgs) {
  const { data, error } = await resend.emails.send({
    from: serverEnv.RESEND_FROM_EMAIL,
    to,
    subject,
    text,
  });

  console.log("Resend send result:", { data, error });

  if (error) {
    // Include as much info as possible for development
    throw new Error(
      typeof error === "string"
        ? error
        : (error as any)?.message || "Failed to send email"
    );
  }

  return data;
}