import http from "node:http";

const PORT = Number(process.env.PORT || 8080);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "finclaro-api",
      version: "0.1.0",
      timestamp: new Date().toISOString()
    });
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`FinClaro API listening on port ${PORT}`);
});
