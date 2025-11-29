import twilio from "twilio";
import { serverEnv } from "@/lib/validation/env";

const client = twilio(
  serverEnv.TWILIO_ACCOUNT_SID,
  serverEnv.TWILIO_AUTH_TOKEN
);

type SendWhatsAppArgs = {
  to: string;   // in E.164, e.g. +49123456789
  body: string;
};

export async function sendWhatsAppMessage({ to, body }: SendWhatsAppArgs) {
  // Twilio requires the whatsapp: prefix on both from and to
  const from = serverEnv.TWILIO_WHATSAPP_FROM;

  const toWithPrefix = to.startsWith("whatsapp:")
    ? to
    : `whatsapp:${to}`;

  const message = await client.messages.create({
    from,
    to: toWithPrefix,
    body,
  });

  return message.sid;
}