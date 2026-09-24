export const FINCLARO_INTENTS = [
  "CREATE_EVENT",
  "UPDATE_EVENT",
  "CANCEL_EVENT",
  "LIST_EVENTS",
  "GET_EVENT",
  "CREATE_REMINDER",
  "HELP",
  "UNKNOWN"
];

export const FINCLARO_INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: FINCLARO_INTENTS
    },
    title: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    start_at: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    new_start_time: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    new_end_time: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    end_at: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    range_from: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    range_to: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    timezone: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    location: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    notes: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    remind_at: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    reminder_offset_minutes: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    event_reference: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    confidence: {
      type: "number"
    },
    needs_clarification: {
      type: "boolean"
    },
    clarification_question: {
      anyOf: [{ type: "string" }, { type: "null" }]
    }
  },
  required: [
    "intent",
    "title",
    "start_at",
    "new_start_time",
    "new_end_time",
    "end_at",
    "range_from",
    "range_to",
    "timezone",
    "location",
    "notes",
    "remind_at",
    "reminder_offset_minutes",
    "event_reference",
    "confidence",
    "needs_clarification",
    "clarification_question"
  ]
};
