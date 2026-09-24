import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

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
    "Cache-Control": "no-store"
  });
  res.end(body);
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
      console.log("FinClaro database schema is ready.");
      return;
    } catch (error) {
      console.error(`Database initialization attempt ${attempt}/5 failed:`, error.message);
      if (attempt === 5) throw error;
      await sleep(3000);
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "finclaro-api",
      version: "0.1.0",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === "GET" && url.pathname === "/health/db") {
    if (!pool) {
      return sendJson(res, 503, { ok: false, database: "not_configured" });
    }

    try {
      const result = await pool.query("SELECT NOW() AS now");
      return sendJson(res, 200, {
        ok: true,
        database: "connected",
        now: result.rows[0].now
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      return sendJson(res, 503, {
        ok: false,
        database: "error"
      });
    }
  }

  if (req.method === "GET" && url.pathname === "/") {
    return sendJson(res, 200, {
      ok: true,
      service: "finclaro-api",
      message: "FinClaro 1.0 backend"
    });
  }

  return sendJson(res, 404, {
    ok: false,
    error: "NOT_FOUND"
  });
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exitCode = 1;
});

async function start() {
  try {
    await initializeDatabase();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`FinClaro API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("FinClaro API startup failed:", error);
    process.exit(1);
  }
}

start();
