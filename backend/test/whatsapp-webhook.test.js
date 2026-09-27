import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  enqueueWhatsAppMessages,
  normalizeWhatsAppId,
  verifyWhatsAppSignature,
  verifyWhatsAppWebhookChallenge
} from "../src/services/whatsapp-webhook.js";

test("normalizes and validates WhatsApp sender IDs", () => {
  assert.equal(normalizeWhatsAppId("+34 600 123 456"), "34600123456");
  assert.equal(normalizeWhatsAppId("123"), null);
  assert.equal(normalizeWhatsAppId(34600123456), null);
});

test("verifies the webhook challenge only for the configured token", () => {
  const url = new URL("https://example.test/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=secret&hub.challenge=abc123");
  assert.deepEqual(verifyWhatsAppWebhookChallenge(url, "secret"), { ok: true, challenge: "abc123" });
  assert.equal(verifyWhatsAppWebhookChallenge(url, "wrong").status, 403);
  assert.equal(verifyWhatsAppWebhookChallenge(url, undefined).status, 503);
});

test("checks the raw body signature and rejects tampering", () => {
  const secret = "app-secret";
  const body = Buffer.from('{"object":"whatsapp_business_account"}');
  const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWhatsAppSignature(body, signature, secret), true);
  assert.equal(verifyWhatsAppSignature(Buffer.from("tampered"), signature, secret), false);
  assert.equal(verifyWhatsAppSignature(body, "", secret), false);
});

test("queues inbound text once and ignores status events and other phone numbers", async (t) => {
  const previousPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  process.env.WHATSAPP_PHONE_NUMBER_ID = "phone-id-1";
  t.after(() => {
    if (previousPhoneNumberId === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = previousPhoneNumberId;
  });

  const seen = new Set();
  const inserted = [];
  const db = {
    async query(_sql, params) {
      const duplicate = seen.has(params[0]);
      if (!duplicate) {
        seen.add(params[0]);
        inserted.push(params);
      }
      return { rowCount: duplicate ? 0 : 1 };
    }
  };
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      changes: [
        { field: "messages", value: { metadata: { phone_number_id: "phone-id-1" }, messages: [
          { id: "wamid.1", from: "34600123456", type: "text", text: { body: "Cita manana" } }
        ] } },
        { field: "messages", value: { metadata: { phone_number_id: "phone-id-1" }, messages: [
          { id: "wamid.1", from: "34600123456", type: "text", text: { body: "Cita manana" } }
        ] } },
        { field: "messages", value: { metadata: { phone_number_id: "wrong-phone" }, messages: [
          { id: "wamid.2", from: "34600123456", type: "text", text: { body: "No debe entrar" } }
        ] } },
        { field: "messages", value: { messages: [
          { id: "wamid.3", from: "34600123456", type: "text", text: { body: "Missing metadata" } }
        ] } },
        { field: "messages", value: { metadata: { phone_number_id: "phone-id-1" }, statuses: [
          { id: "wamid.status", status: "delivered" }
        ] } }
      ]
    }]
  };

  assert.equal(await enqueueWhatsAppMessages(db, payload), 1);
  assert.equal(await enqueueWhatsAppMessages(db, payload), 0);
  assert.equal(inserted.length, 1);
  assert.deepEqual(inserted[0], ["wamid.1", "34600123456", "text", "Cita manana"]);
});
