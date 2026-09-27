import { handleFinClaroMessage } from "./assistant.js";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 5;
export async function sendWhatsAppText(to, body) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  if (!accessToken || !phoneNumberId || !/^v\d+\.\d+$/.test(apiVersion || "")) {
    throw new Error("WHATSAPP_SEND_CONFIGURATION_INCOMPLETE");
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: String(body).slice(0, 4000) }
    })
  });

  if (!response.ok) throw new Error(`WHATSAPP_SEND_FAILED_${response.status}`);
  return true;
}

async function claimWhatsAppMessages(db) {
  await db.query(
    `UPDATE whatsapp_inbound_messages
     SET status = 'pending', processing_started_at = NULL
     WHERE status = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes'`
  );

  const result = await db.query(
    `WITH batch AS (
       SELECT id
       FROM whatsapp_inbound_messages
       WHERE status = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
       ORDER BY received_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE whatsapp_inbound_messages AS message
     SET status = 'processing',
         attempts = message.attempts + 1,
         processing_started_at = NOW()
     FROM batch
     WHERE message.id = batch.id
     RETURNING message.id, message.wa_message_id, message.wa_id,
               message.message_type, message.message_text, message.attempts`,
    [BATCH_SIZE]
  );
  return result.rows;
}

async function completeMessage(db, id, status) {
  await db.query(
    `UPDATE whatsapp_inbound_messages
     SET status = $2, wa_id = NULL, message_text = NULL,
         processing_started_at = NULL, next_attempt_at = NULL,
         last_error = NULL, processed_at = NOW()
     WHERE id = $1`,
    [id, status]
  );
}

async function handleQueuedMessage(db, message) {
  if (!message.wa_id) return completeMessage(db, message.id, "ignored");

  const lookup = await db.query(
    `SELECT contact.user_id, contact.opted_in_at, contact.opted_out_at, users.timezone
     FROM whatsapp_contacts AS contact
     JOIN users ON users.id = contact.user_id
     WHERE contact.wa_id = $1
     LIMIT 1`,
    [message.wa_id]
  );
  const contact = lookup.rows[0];
  if (!contact) return completeMessage(db, message.id, "ignored");

  const normalized = String(message.message_text || "")
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (["baja", "stop", "detener", "unsubscribe"].includes(normalized)) {
    await db.query(
      "UPDATE whatsapp_contacts SET opted_out_at = NOW(), updated_at = NOW() WHERE wa_id = $1",
      [message.wa_id]
    );
    await db.query(
      "UPDATE reminders SET status = 'cancelled' WHERE status IN ('pending','processing') AND event_id IN (SELECT id FROM events WHERE user_id = $1)",
      [contact.user_id]
    );
    await sendWhatsAppText(message.wa_id, "De acuerdo. He desactivado los mensajes de FinClaro para este número.");
    return completeMessage(db, message.id, "processed");
  }

  if (["acepto", "activar", "start"].includes(normalized)) {
    if (!/^https:\/\//i.test(process.env.FINCLARO_PRIVACY_URL || "")) {
      await sendWhatsAppText(message.wa_id, "El alta de FinClaro por WhatsApp todavía no está habilitada para este número.");
      return completeMessage(db, message.id, "processed");
    }
    await db.query(
      "UPDATE whatsapp_contacts SET opted_in_at = NOW(), opted_out_at = NULL, updated_at = NOW() WHERE wa_id = $1",
      [message.wa_id]
    );
    await sendWhatsAppText(message.wa_id, "FinClaro está activado. Puedes escribirme para añadir, consultar, cambiar o cancelar eventos. Para darte de baja, escribe BAJA.");
    return completeMessage(db, message.id, "processed");
  }

  if (contact.opted_out_at) return completeMessage(db, message.id, "ignored");

  if (!contact.opted_in_at) {
    const privacyUrl = process.env.FINCLARO_PRIVACY_URL;
    if (!/^https:\/\//i.test(privacyUrl || "")) {
      await sendWhatsAppText(message.wa_id, "El alta de FinClaro por WhatsApp todavía no está habilitada para este número.");
      return completeMessage(db, message.id, "processed");
    }
    await sendWhatsAppText(
      message.wa_id,
      `Para activar FinClaro y recibir respuestas por WhatsApp, responde ACEPTO. Puedes darte de baja en cualquier momento escribiendo BAJA. Consulta la política de privacidad: ${privacyUrl}`
    );
    return completeMessage(db, message.id, "processed");
  }

  if (message.message_type !== "text" || !message.message_text?.trim()) {
    await sendWhatsAppText(message.wa_id, "Por ahora solo puedo entender mensajes de texto.");
    return completeMessage(db, message.id, "processed");
  }

  const result = await handleFinClaroMessage({
    db,
    userId: contact.user_id,
    message: message.message_text,
    timezone: contact.timezone || "Europe/Madrid",
    idempotencyKey: message.wa_message_id
  });
  const reply = result.result?.message || "No he podido completar esa acción. ¿Puedes intentarlo de otra manera?";
  await sendWhatsAppText(message.wa_id, reply);
  return completeMessage(db, message.id, "processed");
}

export async function processWhatsAppInbox(db) {
  if (!db) return;
  if (!process.env.WHATSAPP_ACCESS_TOKEN ||
      !process.env.WHATSAPP_PHONE_NUMBER_ID ||
      !/^v\d+\.\d+$/.test(process.env.WHATSAPP_GRAPH_API_VERSION || "")) return;
  let messages;
  try {
    messages = await claimWhatsAppMessages(db);
  } catch {
    console.error("[whatsapp] unable to claim inbox messages");
    return;
  }

  for (const message of messages) {
    try {
      await handleQueuedMessage(db, message);
    } catch (error) {
      const errorMessage = String(error?.message || "");
      const safeError = /^WHATSAPP_[A-Z0-9_]+$/.test(errorMessage)
        ? errorMessage
        : (typeof error?.code === "string" ? `DATABASE_${error.code}` : "WHATSAPP_PROCESSING_FAILED");
      const terminal = message.attempts >= MAX_ATTEMPTS;
      await db.query(
        `UPDATE whatsapp_inbound_messages
         SET status = $2,
             processing_started_at = NULL,
             next_attempt_at = CASE WHEN $2 = 'pending' THEN NOW() + ($3 * INTERVAL '30 seconds') ELSE NULL END,
             last_error = $4,
             wa_id = CASE WHEN $2 = 'failed' THEN NULL ELSE wa_id END,
             message_text = CASE WHEN $2 = 'failed' THEN NULL ELSE message_text END,
             processed_at = CASE WHEN $2 = 'failed' THEN NOW() ELSE processed_at END
         WHERE id = $1`,
        [message.id, terminal ? "failed" : "pending", message.attempts, safeError]
      );
      console.error("[whatsapp] message processing failed:", safeError);
    }
  }
}
