import { logger } from "./logger";

let atClient: any = null;

function getClient() {
  if (atClient) return atClient;
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!apiKey || !username) return null;
  try {
    const AT = require("africastalking");
    const at = AT({ apiKey, username });
    atClient = at.SMS;
    return atClient;
  } catch {
    return null;
  }
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const sms = getClient();
  if (!sms) {
    logger.info({ to, message }, "[SMS] Africa's Talking not configured — SMS not sent");
    return false;
  }
  // Ensure Ghana country code
  const phone = to.startsWith("+") ? to : `+233${to.replace(/^0/, "")}`;
  try {
    await sms.send({ to: [phone], message, from: process.env.AT_SENDER_ID ?? "" });
    logger.info({ to: phone }, "[SMS] Sent successfully");
    return true;
  } catch (err: any) {
    logger.error({ err: err?.message, to: phone }, "[SMS] Failed to send");
    return false;
  }
}
