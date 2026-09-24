import OpenAI from "openai";
import { FINCLARO_INTENT_SCHEMA, FINCLARO_INTENTS } from "./schema.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = "gpt-5.6-luna";

function validateParsedIntent(parsed) {
  if (!parsed || typeof parsed !== "object") throw new Error("AI_INVALID_RESPONSE");
  if (!FINCLARO_INTENTS.includes(parsed.intent)) throw new Error("AI_INVALID_INTENT");
  if (typeof parsed.confidence !== "number" || !Number.isFinite(parsed.confidence) || parsed.confidence < 0 || parsed.confidence > 1) {
    throw new Error("AI_INVALID_CONFIDENCE");
  }
  for (const field of ["start_at", "end_at", "range_from", "range_to", "remind_at"]) {
    if (parsed[field] !== null && Number.isNaN(new Date(parsed[field]).getTime())) {
      throw new Error("AI_INVALID_" + field.toUpperCase());
    }
  }
  if (parsed.start_at && parsed.end_at && new Date(parsed.end_at) <= new Date(parsed.start_at)) {
    throw new Error("AI_END_BEFORE_START");
  }
  if (parsed.reminder_offset_minutes !== null &&
      (!Number.isInteger(parsed.reminder_offset_minutes) || parsed.reminder_offset_minutes <= 0)) {
    throw new Error("AI_INVALID_REMINDER_OFFSET");
  }
  if (parsed.needs_clarification && !parsed.clarification_question) {
    throw new Error("AI_CLARIFICATION_QUESTION_REQUIRED");
  }
  return parsed;
}

export async function parseFinClaroMessage({
  message,
  now = new Date().toISOString(),
  timezone = "Europe/Madrid",
  model = process.env.OPENAI_MODEL || DEFAULT_MODEL
}) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY_NOT_CONFIGURED");
    error.statusCode = 503;
    throw error;
  }

  if (typeof message !== "string" || !message.trim()) {
    const error = new Error("MESSAGE_REQUIRED");
    error.statusCode = 400;
    throw error;
  }

  const instructions = [
    "Eres el motor de comprensión de lenguaje natural de FinClaro.",
    "Convierte mensajes del usuario en una intención estructurada para que el backend pueda ejecutar acciones.",
    "No ejecutes acciones, no inventes datos y no generes identificadores de base de datos.",
    "FinClaro gestiona agenda, recordatorios y vida familiar.",
    "Resuelve fechas relativas usando la fecha y zona horaria de referencia.",
    "Si falta un dato necesario o existe una ambigüedad relevante, usa needs_clarification=true y formula una pregunta breve.",
    "No inventes una hora concreta que el usuario no haya indicado.",
    "Para UPDATE_EVENT o CANCEL_EVENT conserva la referencia humana en event_reference; nunca pongas un UUID.",
    "Para LIST_EVENTS usa range_from y range_to cuando se solicite un periodo.",
    "Para recordatorios usa remind_at cuando haya una hora concreta y reminder_offset_minutes cuando haya un desplazamiento explícito.",
    "Devuelve exclusivamente el objeto que cumple el JSON Schema."
  ].join("\n");

  const input = [
    "Fecha y hora de referencia: " + now,
    "Zona horaria del usuario: " + timezone,
    "Idioma: español.",
    "",
    "Mensaje del usuario:",
    message.trim()
  ].join("\n");

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: instructions },
      { role: "user", content: input }
    ],
    max_output_tokens: 700,
    text: {
      format: {
        type: "json_schema",
        name: "finclaro_intent",
        strict: true,
        schema: FINCLARO_INTENT_SCHEMA
      }
    }
  });

  if (response.status !== "completed") {
    const error = new Error("OPENAI_INCOMPLETE_" + (response.incomplete_details?.reason || response.status));
    error.statusCode = 502;
    throw error;
  }

  if (!response.output_text) {
    const error = new Error("AI_EMPTY_RESPONSE");
    error.statusCode = 502;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    const error = new Error("AI_INVALID_JSON");
    error.statusCode = 502;
    throw error;
  }

  return validateParsedIntent(parsed);
}
