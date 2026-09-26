import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";
import { parseFinClaroMessage } from "./src/ai/parser.js";
import { handleFinClaroMessage } from "./src/services/assistant.js";
import { startReminderScheduler } from "./src/services/reminder-scheduler.js";

const { Pool } = pg;
const PORT = Number(process.env.PORT || 8080);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-FinClaro-User-Id, X-FinClaro-Internal-Token, X-FinClaro-Idempotency-Key",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("INVALID_JSON");
    error.statusCode = 400;
    throw error;
  }
}

function getUserId(req) {
  return req.headers["x-finclaro-user-id"] || null;
}

function requireUserId(req, res) {
  const userId = getUserId(req);
  if (!userId) {
    sendJson(res, 401, {
      ok: false,
      error: "USER_ID_REQUIRED",
      message: "Use the X-FinClaro-User-Id header."
    });
    return null;
  }
  return userId;
}

function isValidUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL is not configured; starting without a database.");
    return;
  }

  const schemaPath = path.join(__dirname, "db", "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf8");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await pool.query(schema);
      await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ`);
      await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reminders_next_attempt ON reminders(status, next_attempt_at)`);
      console.log("FinClaro database schema is ready.");
      return;
    } catch (error) {
      console.error(`Database initialization attempt ${attempt}/5 failed:`, error.message);
      if (attempt === 5) throw error;
      await sleep(3000);
    }
  }
}

async function createUser(body) {
  if (!body.phone || typeof body.phone !== "string") {
    const error = new Error("PHONE_REQUIRED");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO users (name, phone, timezone)
     VALUES ($1, $2, COALESCE($3, 'Europe/Madrid'))
     ON CONFLICT (phone)
     DO UPDATE SET
       name = COALESCE(EXCLUDED.name, users.name),
       timezone = COALESCE(EXCLUDED.timezone, users.timezone),
       updated_at = NOW()
     RETURNING id, name, phone, timezone, created_at, updated_at`,
    [body.name ?? null, body.phone.trim(), body.timezone ?? null]
  );

  return result.rows[0];
}

async function listEvents(userId, url) {
  const params = [userId];
  const where = ["e.user_id = $1"];

  const from = normalizeDate(url.searchParams.get("from"));
  const to = normalizeDate(url.searchParams.get("to"));
  const status = url.searchParams.get("status");

  if (url.searchParams.get("from") && !from) {
    const error = new Error("INVALID_FROM");
    error.statusCode = 400;
    throw error;
  }

  if (url.searchParams.get("to") && !to) {
    const error = new Error("INVALID_TO");
    error.statusCode = 400;
    throw error;
  }

  if (from) {
    params.push(from);
    where.push(`e.start_at >= $${params.length}`);
  }

  if (to) {
    params.push(to);
    where.push(`e.start_at < $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`e.status = $${params.length}`);
  }

  const result = await pool.query(
    `SELECT
       e.id,
       e.user_id,
       e.title,
       e.start_at,
       e.end_at,
       e.location,
       e.notes,
       e.status,
       e.created_at,
       e.updated_at
     FROM events e
     WHERE ${where.join(" AND ")}
     ORDER BY e.start_at ASC`,
    params
  );

  return result.rows;
}

async function createEvent(userId, body) {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    const error = new Error("TITLE_REQUIRED");
    error.statusCode = 400;
    throw error;
  }

  const startAt = normalizeDate(body.start_at);
  if (!startAt) {
    const error = new Error("START_AT_REQUIRED_OR_INVALID");
    error.statusCode = 400;
    throw error;
  }

  const endAt = body.end_at ? normalizeDate(body.end_at) : null;
  if (body.end_at && !endAt) {
    const error = new Error("END_AT_INVALID");
    error.statusCode = 400;
    throw error;
  }

  if (endAt && endAt <= startAt) {
    const error = new Error("END_AT_MUST_BE_AFTER_START_AT");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO events (
       user_id, title, start_at, end_at, location, notes, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at`,
    [
      userId,
      body.title.trim(),
      startAt.toISOString(),
      endAt ? endAt.toISOString() : null,
      body.location ?? null,
      body.notes ?? null
    ]
  );

  return result.rows[0];
}

async function getOwnEvent(userId, eventId) {
  if (!isValidUuid(eventId)) return null;

  const result = await pool.query(
    `SELECT
       id, user_id, title, start_at, end_at, location, notes,
       status, created_at, updated_at
     FROM events
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [eventId, userId]
  );

  return result.rows[0] ?? null;
}

async function updateEvent(userId, eventId, body) {
  const current = await getOwnEvent(userId, eventId);
  if (!current) return null;

  const title = body.title !== undefined ? String(body.title).trim() : current.title;
  const startAt = body.start_at !== undefined ? normalizeDate(body.start_at) : new Date(current.start_at);
  const endAt = body.end_at !== undefined && body.end_at !== null
    ? normalizeDate(body.end_at)
    : (body.end_at === null ? null : (current.end_at ? new Date(current.end_at) : null));

  if (!title) {
    const error = new Error("TITLE_REQUIRED");
    error.statusCode = 400;
    throw error;
  }

  if (!startAt) {
    const error = new Error("START_AT_INVALID");
    error.statusCode = 400;
    throw error;
  }

  if (body.end_at !== undefined && body.end_at !== null && !endAt) {
    const error = new Error("END_AT_INVALID");
    error.statusCode = 400;
    throw error;
  }

  if (endAt && endAt <= startAt) {
    const error = new Error("END_AT_MUST_BE_AFTER_START_AT");
    error.statusCode = 400;
    throw error;
  }

  const status = body.status !== undefined ? body.status : current.status;
  if (!["active", "cancelled"].includes(status)) {
    const error = new Error("INVALID_STATUS");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `UPDATE events
     SET
       title = $3,
       start_at = $4,
       end_at = $5,
       location = $6,
       notes = $7,
       status = $8,
       updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, title, start_at, end_at, location, notes, status, created_at, updated_at`,
    [
      eventId,
      userId,
      title,
      startAt.toISOString(),
      endAt ? endAt.toISOString() : null,
      body.location !== undefined ? body.location : current.location,
      body.notes !== undefined ? body.notes : current.notes,
      status
    ]
  );

  return result.rows[0] ?? null;
}

async function deleteEvent(userId, eventId) {
  if (!isValidUuid(eventId)) return false;

  const result = await pool.query(
    `DELETE FROM events
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [eventId, userId]
  );

  return Boolean(result.rowCount);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-FinClaro-User-Id",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
      });
      return res.end();
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        service: "finclaro-api",
        version: "0.4.0",
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "GET" && url.pathname === "/health/db") {
      if (!pool) {
        return sendJson(res, 503, { ok: false, database: "not_configured" });
      }

      const result = await pool.query("SELECT NOW() AS now, current_database() AS database");
      return sendJson(res, 200, {
        ok: true,
        database: "connected",
        name: result.rows[0].database,
        now: result.rows[0].now
      });
    }

    if (req.method === "GET" && url.pathname === "/") {
      return sendJson(res, 200, {
        ok: true,
        service: "finclaro-api",
        message: "FinClaro 1.0 backend"
      });
    }

    if (req.method === "POST" && url.pathname === "/users") {
      if (!pool) return sendJson(res, 503, { ok: false, error: "DATABASE_NOT_CONFIGURED" });
      const body = await readJson(req);
      const user = await createUser(body);
      return sendJson(res, 201, { ok: true, user });
    }

    if (req.method === "GET" && url.pathname === "/events") {
      if (!pool) return sendJson(res, 503, { ok: false, error: "DATABASE_NOT_CONFIGURED" });
      const userId = requireUserId(req, res);
      if (!userId) return;
      const events = await listEvents(userId, url);
      return sendJson(res, 200, { ok: true, events });
    }

    if (req.method === "POST" && url.pathname === "/events") {
      if (!pool) return sendJson(res, 503, { ok: false, error: "DATABASE_NOT_CONFIGURED" });
      const userId = requireUserId(req, res);
      if (!userId) return;
      const body = await readJson(req);
      const event = await createEvent(userId, body);
      return sendJson(res, 201, { ok: true, event });
    }

    const eventMatch = url.pathname.match(/^\/events\/([^/]+)$/);
    if (eventMatch) {
      if (!pool) return sendJson(res, 503, { ok: false, error: "DATABASE_NOT_CONFIGURED" });
      const userId = requireUserId(req, res);
      if (!userId) return;

      const eventId = eventMatch[1];

      if (req.method === "GET") {
        const event = await getOwnEvent(userId, eventId);
        if (!event) return sendJson(res, 404, { ok: false, error: "EVENT_NOT_FOUND" });
        return sendJson(res, 200, { ok: true, event });
      }

      if (req.method === "PATCH") {
        const body = await readJson(req);
        const event = await updateEvent(userId, eventId, body);
        if (!event) return sendJson(res, 404, { ok: false, error: "EVENT_NOT_FOUND" });
        return sendJson(res, 200, { ok: true, event });
      }

      if (req.method === "DELETE") {
        const deleted = await deleteEvent(userId, eventId);
        if (!deleted) return sendJson(res, 404, { ok: false, error: "EVENT_NOT_FOUND" });
        return sendJson(res, 200, { ok: true, deleted: true, event_id: eventId });
      }
    }

    if (req.method === "POST" && url.pathname === "/assistant/execute") {
      if (process.env.FINCLARO_AI_TEST_ENDPOINT !== "true") {
        return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
      }

      const internalToken = process.env.FINCLARO_INTERNAL_TOKEN;
      const providedToken = req.headers["x-finclaro-internal-token"];
      if (!internalToken || providedToken !== internalToken) {
        return sendJson(res, 401, { ok: false, error: "INTERNAL_TOKEN_REQUIRED" });
      }

      if (!pool) {
        return sendJson(res, 503, { ok: false, error: "DATABASE_NOT_CONFIGURED" });
      }

      const userId = requireUserId(req, res);
      if (!userId) return;

      const body = await readJson(req);
      const result = await handleFinClaroMessage({
        db: pool,
        userId,
        message: body.message,
        now: body.now,
        timezone: body.timezone,
        idempotencyKey: req.headers["x-finclaro-idempotency-key"] || null
      });

      return sendJson(res, 200, {
        ok: true,
        ai_execution: true,
        action: result.result?.action || null,
        message: result.result?.message || null,
        parsed: result.parsed || null,
        event: result.result?.event || null,
        reminder: result.result?.reminder || null,
        events: result.result?.events || null
      });
    }

    if (req.method === "POST" && url.pathname === "/ai/parse") {
      if (process.env.FINCLARO_AI_TEST_ENDPOINT !== "true") {
        return sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
      }

      const internalToken = process.env.FINCLARO_INTERNAL_TOKEN;
      const providedToken = req.headers["x-finclaro-internal-token"];

      if (!internalToken || providedToken !== internalToken) {
        return sendJson(res, 401, { ok: false, error: "INTERNAL_TOKEN_REQUIRED" });
      }

      const body = await readJson(req);
      const parsed = await parseFinClaroMessage({
        message: body.message,
        now: body.now,
        timezone: body.timezone,
        model: body.model
      });

      return sendJson(res, 200, { ok: true, parsed });
    }

    return sendJson(res, 404, {
      ok: false,
      error: "NOT_FOUND"
    });
  } catch (error) {
    console.error("API error:", error);
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "INTERNAL_ERROR"
    });
  }
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exitCode = 1;
});

async function start() {
  try {
    await initializeDatabase();
    startReminderScheduler(pool);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`FinClaro API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("FinClaro API startup failed:", error);
    process.exit(1);
  }
}

start();
