import { DateTime, IANAZone } from "luxon";
import { parseFinClaroMessage } from "../ai/parser.js";

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulTokens(value) {
  const stop = new Set([
    "el","la","los","las","un","una","unos","unas","de","del","al","a",
    "en","y","o","que","mi","mis","me","te","se","para","por","con",
    "este","esta","ese","esa","evento","cita","hoy","manana"
  ]);
  return normalizeText(value).split(" ").filter((token) => token.length >= 3 && !stop.has(token));
}

function scoreCandidate(event, reference, parsed) {
  const referenceTokens = new Set(meaningfulTokens(reference));
  const titleTokens = meaningfulTokens(event.title);
  const locationTokens = meaningfulTokens(event.location);
  const referenceText = normalizeText(reference);
  const titleText = normalizeText(event.title);
  const locationText = normalizeText(event.location);
  let score = 0;

  for (const token of titleTokens) {
    if (referenceTokens.has(token)) score += 3;
  }

  for (const token of locationTokens) {
    if (referenceTokens.has(token)) score += 4;
  }

  if (referenceText && titleText && (referenceText.includes(titleText) || titleText.includes(referenceText))) {
    score += 4;
  }

  if (referenceText && locationText && (referenceText.includes(locationText) || locationText.includes(referenceText))) {
    score += 5;
  }

  if (parsed.start_at) {
    const diff = Math.abs(new Date(event.start_at).getTime() - new Date(parsed.start_at).getTime());
    if (diff <= 30 * 60 * 1000) score += 5;
    else if (diff <= 24 * 60 * 60 * 1000) score += 2;
  }

  return score;
}

async function getUser(db, userId) {
  const result = await db.query(
    "SELECT id, name, phone, timezone FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );
  return result.rows[0] || null;
}

async function insertEvent(db, userId, parsed) {
  const startAt = new Date(parsed.start_at);
  const endAt = parsed.end_at ? new Date(parsed.end_at) : null;
  if (Number.isNaN(startAt.getTime())) throw new Error("INVALID_START_AT");
  if (endAt && Number.isNaN(endAt.getTime())) throw new Error("INVALID_END_AT");
  if (endAt && endAt <= startAt) throw new Error("END_AT_MUST_BE_AFTER_START_AT");

  const result = await db.query(
    "INSERT INTO events (user_id, title, start_at, end_at, location, notes, status) " +
    "VALUES ($1, $2, $3, $4, $5, $6, 'active') " +
    "RETURNING id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at",
    [userId, parsed.title.trim(), startAt.toISOString(), endAt ? endAt.toISOString() : null, parsed.location, parsed.notes]
  );
  return result.rows[0];
}

async function insertReminder(db, eventId, parsed, now) {
  let remindAt = null;
  if (parsed.remind_at) remindAt = new Date(parsed.remind_at);
  else if (parsed.reminder_offset_minutes !== null) {
    remindAt = new Date(new Date(parsed.start_at).getTime() - parsed.reminder_offset_minutes * 60000);
  }
  if (!remindAt) return null;
  if (Number.isNaN(remindAt.getTime())) throw new Error("INVALID_REMINDER_TIME");
  if (remindAt <= new Date(now)) throw new Error("REMINDER_TIME_IN_PAST");

  const result = await db.query(
    "INSERT INTO reminders (event_id, remind_at, channel, status) " +
    "VALUES ($1, $2, 'whatsapp', 'pending') " +
    "RETURNING id, event_id, remind_at, channel, status, attempts, created_at",
    [eventId, remindAt.toISOString()]
  );
  return result.rows[0];
}

async function resolveEvent(db, userId, reference, parsed) {
  if (!reference || !reference.trim()) return { status: "ambiguous", candidates: [] };
  const result = await db.query(
    "SELECT id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at " +
    "FROM events WHERE user_id = $1 AND status = 'active' " +
    "AND start_at >= NOW() - INTERVAL '30 days' " +
    "AND start_at <= NOW() + INTERVAL '180 days' ORDER BY start_at ASC",
    [userId]
  );
  const rawCandidates = result.rows
    .map((event) => ({ event, score: scoreCandidate(event, reference, parsed) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.event.created_at).getTime() - new Date(a.event.created_at).getTime();
    });

  // During testing the same event may have been created more than once.
  // Treat exact duplicates as one logical candidate instead of asking the user
  // to choose between identical copies.
  const seen = new Set();
  const candidates = rawCandidates.filter((item) => {
    const event = item.event;
    const key = [
      event.title,
      event.start_at,
      event.end_at || "",
      event.location || "",
      event.notes || ""
    ].map(normalizeText).join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!candidates.length) return { status: "not_found", candidates: [] };

  const topScore = candidates[0].score;
  const top = candidates.filter((item) => item.score === topScore);

  if (top.length > 1 || (topScore < 5 && candidates.length > 1)) {
    return {
      status: "ambiguous",
      candidates: candidates.slice(0, 5).map((item) => item.event)
    };
  }

  return { status: "found", event: candidates[0].event };
}

function setTimeInZone(isoValue, hhmm, timezone) {
  if (!hhmm) return isoValue;

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) throw new Error("INVALID_TIME_FORMAT");

  if (typeof timezone !== "string" || !IANAZone.isValidZone(timezone)) {
    throw new Error("INVALID_EVENT_TIMEZONE");
  }

  const sourceDate = new Date(isoValue);
  if (Number.isNaN(sourceDate.getTime())) {
    throw new Error("INVALID_EVENT_TIME");
  }

  const source = DateTime.fromJSDate(sourceDate, { zone: timezone });
  if (!source.isValid) throw new Error("INVALID_EVENT_TIMEZONE");

  return source
    .set({
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: 0,
      millisecond: 0
    })
    .toUTC()
    .toISO();
}

export async function handleFinClaroMessage({ db, userId, message, now = new Date().toISOString(), timezone }) {
  const user = await getUser(db, userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    error.statusCode = 404;
    throw error;
  }
  const userTimezone = timezone || user.timezone || "Europe/Madrid";
  const parsed = await parseFinClaroMessage({ message, now, timezone: userTimezone });

  if (parsed.needs_clarification) {
    return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: parsed.clarification_question } };
  }

  if (parsed.intent === "CREATE_EVENT") {
    if (!parsed.title || !parsed.start_at) {
      return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "¿Qué evento es y qué día y hora tiene?" } };
    }
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const event = await insertEvent(client, userId, parsed);
      const reminder = await insertReminder(client, event.id, parsed, now);
      await client.query("COMMIT");
      const when = new Date(event.start_at).toLocaleString("es-ES", { timeZone: userTimezone });
      return { parsed, result: { action: "EVENT_CREATED", message: "He añadido “" + event.title + "” para " + when + ".", event, reminder } };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (parsed.intent === "LIST_EVENTS") {
    const params = [userId];
    const where = ["user_id = $1", "status = 'active'"];
    if (parsed.range_from) { params.push(new Date(parsed.range_from).toISOString()); where.push("start_at >= $" + params.length); }
    if (parsed.range_to) { params.push(new Date(parsed.range_to).toISOString()); where.push("start_at < $" + params.length); }
    const result = await db.query(
      "SELECT id, title, start_at, end_at, location, notes, status FROM events WHERE " + where.join(" AND ") + " ORDER BY start_at ASC",
      params
    );
    return { parsed, result: { action: "EVENTS_LISTED", message: result.rows.length ? "Tienes " + result.rows.length + " evento(s) en ese periodo." : "No tienes eventos en ese periodo.", events: result.rows } };
  }

  if (["GET_EVENT", "UPDATE_EVENT", "CANCEL_EVENT"].includes(parsed.intent)) {
    const resolution = await resolveEvent(db, userId, parsed.event_reference, parsed);
    if (resolution.status === "not_found") return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "No encuentro ese evento. ¿Puedes decirme el nombre o el día?" } };
    if (resolution.status === "ambiguous") {
      const labels = resolution.candidates.slice(0, 3).map((event) => "“" + event.title + "” (" + new Date(event.start_at).toLocaleString("es-ES", { timeZone: userTimezone }) + ")").join(", ");
      return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "¿Cuál quieres decir: " + labels + "?" } };
    }
    const event = resolution.event;

    if (parsed.intent === "GET_EVENT") {
      return { parsed, result: { action: "EVENT_FOUND", message: "“" + event.title + "” está programado para " + new Date(event.start_at).toLocaleString("es-ES", { timeZone: userTimezone }) + ".", event } };
    }

    if (parsed.intent === "CANCEL_EVENT") {
      const cancelled = await db.query(
        "UPDATE events SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 " +
        "RETURNING id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at",
        [event.id, userId]
      );
      await db.query("UPDATE reminders SET status = 'cancelled' WHERE event_id = $1 AND status IN ('pending','processing')", [event.id]);
      return { parsed, result: { action: "EVENT_CANCELLED", message: "He cancelado “" + event.title + "”.", event: cancelled.rows[0] } };
    }

    const newStart = parsed.start_at || (parsed.new_start_time ? setTimeInZone(event.start_at, parsed.new_start_time, userTimezone) : event.start_at);
    const newEnd = parsed.end_at || (parsed.new_end_time ? setTimeInZone(event.end_at || event.start_at, parsed.new_end_time, userTimezone) : event.end_at);
    if (newEnd && new Date(newEnd) <= new Date(newStart)) return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "La hora de finalización tendría que ser posterior a la de inicio." } };
    const updated = await db.query(
      "UPDATE events SET title = COALESCE($3, title), start_at = $4, end_at = $5, " +
      "location = COALESCE($6, location), notes = COALESCE($7, notes), updated_at = NOW() " +
      "WHERE id = $1 AND user_id = $2 AND status = 'active' " +
      "RETURNING id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at",
      [event.id, userId, parsed.title, new Date(newStart).toISOString(), newEnd ? new Date(newEnd).toISOString() : null, parsed.location, parsed.notes]
    );
    return { parsed, result: { action: "EVENT_UPDATED", message: "He actualizado “" + updated.rows[0].title + "”.", event: updated.rows[0] } };
  }

  if (parsed.intent === "HELP") return { parsed, result: { action: "HELP", message: "Puedes decirme qué añadir, cambiar, cancelar o consultar en tu agenda." } };
  if (parsed.intent === "CREATE_REMINDER") return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "Dime qué quieres que te recuerde y cuándo." } };
  return { parsed, result: { action: "CLARIFICATION_REQUIRED", message: "No he entendido la acción. Puedes decirme qué quieres añadir, cambiar, cancelar o consultar." } };
}