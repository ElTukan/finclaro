import { createHmac, timingSafeEqual } from "node:crypto";

function secureEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function normalizeWhatsAppId(value) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  return /^[0-9]{8,15}$/.test(digits) ? digits : null;
}

export function verifyWhatsAppWebhookChallenge(url, verifyToken) {
  if (!verifyToken) return { ok: false, status: 503, error: "WHATSAPP_VERIFY_TOKEN_NOT_CONFIGURED" };
  const mode = url.searchParams.get("hub.mode");
  const supplied = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || !secureEqual(verifyToken, supplied) || !challenge) {
    return { ok: false, status: 403, error: "WHATSAPP_WEBHOOK_VERIFICATION_FAILED" };
  }
  return { ok: true, challenge };
}

export function verifyWhatsAppSignature(rawBody, signatureHeader, appSecret) {
  if (!Buffer.isBuffer(rawBody) || !appSecret || typeof signatureHeader !== "string") return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signatureHeader);
  if (!match) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return secureEqual(expected, match[1].toLowerCase());
}

export async function enqueueWhatsAppMessages(db, payload) {
  if (payload?.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) return 0;
  let queued = 0;

  for (const entry of payload.entry) {
    for (const change of entry?.changes || []) {
      if (change?.field !== "messages") continue;
      const value = change.value;
      const configuredPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const incomingPhoneNumberId = value?.metadata?.phone_number_id;
      if (configuredPhoneNumberId && incomingPhoneNumberId !== configuredPhoneNumberId) continue;

      for (const message of value?.messages || []) {
        const waId = normalizeWhatsAppId(message?.from);
        if (!waId || typeof message?.id !== "string" || !message.id || typeof message?.type !== "string") continue;
        const text = message.type === "text" && typeof message.text?.body === "string"
          ? message.text.body.slice(0, 4000)
          : null;
        const result = await db.query(
          `INSERT INTO whatsapp_inbound_messages (wa_message_id, wa_id, message_type, message_text)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (wa_message_id) DO NOTHING
           RETURNING id`,
          [message.id, waId, message.type, text]
        );
        queued += result.rowCount || 0;
      }
    }
  }

  return queued;
}
