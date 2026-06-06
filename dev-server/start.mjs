// Dev-server wrapper for Render — ngrok edition.
//
// Why not `expo start --tunnel`: Expo's built-in tunnel routes auth through
// EXPO_TOKEN → Expo API → ngrok, and that handoff failed inside Render with
// "bearer token invalid" against multiple known-good tokens. We bypass the
// whole layer and drive ngrok ourselves via the @ngrok/ngrok JS module with
// a user-controlled authtoken (NGROK_AUTHTOKEN env var).
//
// Flow:
//   1. Spawn `expo start --port 8081` (Metro on localhost:8081, no tunnel).
//   2. Open an ngrok HTTP tunnel pointing at localhost:8081.
//   3. Compose an exp:// URL from the ngrok hostname and publish it on
//      /tunnel so the Vercel QR page can render it.

import { spawn } from "node:child_process";
import http from "node:http";
import ngrok from "@ngrok/ngrok";

const PORT = process.env.PORT || 3000;
const METRO_PORT = 8081;

let currentTunnelUrl = null;
let lastSeenAt = null;
let expoExitCode = null;
let ngrokError = null;
const recentOutput = [];
const MAX_RECENT_LINES = 80;

function record(text) {
  process.stdout.write(text);
  for (const line of text.split("\n")) {
    if (!line) continue;
    recentOutput.push(line);
    while (recentOutput.length > MAX_RECENT_LINES) recentOutput.shift();
  }
}

function publishUrl(url) {
  if (url === currentTunnelUrl) return;
  currentTunnelUrl = url;
  lastSeenAt = new Date().toISOString();
  console.log(`[dev-server] tunnel URL → ${url}`);
}

// Spawn Metro. No --tunnel; we'll add ngrok separately.
const expo = spawn(
  "npx",
  ["expo", "start", "--port", String(METRO_PORT)],
  {
    cwd: process.cwd(),
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
expo.stdout.on("data", (buf) => record(buf.toString()));
expo.stderr.on("data", (buf) => record(buf.toString()));
expo.on("exit", (code) => {
  expoExitCode = code;
  console.error(`[dev-server] expo exited with code ${code} — wrapper stays up`);
});

// Start ngrok in parallel. We don't wait for Metro to be ready first — the
// tunnel can exist even before Metro is listening; the first request through
// it will simply fail until Metro is up, which is fine.
//
// Render's free tier kills containers without SIGTERM when it sleeps, which
// means our ngrok.disconnect() in SIGTERM handler doesn't run. The dead
// session keeps holding our static ngrok domain until ngrok's heartbeat
// timeout (~60s) reaps it. Until then, a fresh connect() fails with
// ERR_NGROK_334 "endpoint already online". We retry with backoff until the
// ghost session times out.
const RETRY_DELAYS_MS = [10_000, 20_000, 30_000, 45_000, 60_000];

async function startNgrokWithRetry() {
  if (!process.env.NGROK_AUTHTOKEN) {
    ngrokError = "NGROK_AUTHTOKEN env var not set in Render";
    console.error(`[dev-server] ${ngrokError}`);
    return;
  }

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const listener = await ngrok.connect({
        addr: METRO_PORT,
        authtoken: process.env.NGROK_AUTHTOKEN,
        // HTTP tunnel — Expo Go reads bundles over HTTP. ngrok terminates
        // HTTPS at the edge and forwards to Metro as HTTP.
        proto: "http",
      });
      const publicUrl = listener.url(); // e.g. https://abc123.ngrok-free.app
      // Compose exp:// from the hostname. Expo Go opens exp://host expecting
      // a Metro dev server on the other side; ngrok's public URL serves that.
      const host = new URL(publicUrl).host;
      publishUrl(`exp://${host}`);
      ngrokError = null;
      return;
    } catch (err) {
      const msg = err?.message ?? String(err);
      const isGhostSession =
        msg.includes("ERR_NGROK_334") || msg.includes("already online");
      if (!isGhostSession || attempt === RETRY_DELAYS_MS.length) {
        ngrokError = msg;
        console.error(`[dev-server] ngrok failed (no retry): ${msg}`);
        return;
      }
      const wait = RETRY_DELAYS_MS[attempt];
      ngrokError = `ghost session, retrying in ${wait / 1000}s (attempt ${attempt + 1})`;
      console.error(`[dev-server] ngrok ghost session, retrying in ${wait / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}
startNgrokWithRetry();

// Tiny HTTP surface — / health, /tunnel for the Vercel poller, /diag for us.
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  // Strip query string for path matching (so /diag?_=cache-bust works).
  const path = (req.url || "/").split("?")[0];

  if (path === "/tunnel") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ready: !!currentTunnelUrl,
        url: currentTunnelUrl,
        updatedAt: lastSeenAt,
        expoExitCode,
        ngrokError,
      }),
    );
    return;
  }

  if (path === "/diag") {
    res.setHeader("Content-Type", "text/plain");
    res.end(
      [
        `expoExitCode: ${expoExitCode}`,
        `ngrokError: ${ngrokError}`,
        `currentTunnelUrl: ${currentTunnelUrl}`,
        `lastSeenAt: ${lastSeenAt}`,
        `EXPO_TOKEN set: ${process.env.EXPO_TOKEN ? `yes (length ${process.env.EXPO_TOKEN.length})` : "no"}`,
        `NGROK_AUTHTOKEN set: ${process.env.NGROK_AUTHTOKEN ? `yes (length ${process.env.NGROK_AUTHTOKEN.length})` : "no"}`,
        "",
        "--- recent expo stdout/stderr ---",
        ...recentOutput,
      ].join("\n"),
    );
    return;
  }

  if (path === "/" || path === "/health") {
    res.setHeader("Content-Type", "text/plain");
    res.end(
      currentTunnelUrl
        ? `hearo dev-server — tunnel ${currentTunnelUrl}`
        : ngrokError
        ? `hearo dev-server — ngrok failed: ${ngrokError}; see /diag`
        : expoExitCode !== null
        ? `hearo dev-server — expo crashed (code ${expoExitCode}); see /diag`
        : "hearo dev-server — warming up",
    );
    return;
  }

  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`[dev-server] HTTP listening on :${PORT}`);
});

process.on("SIGTERM", () => {
  expo.kill("SIGTERM");
  void ngrok.disconnect();
  server.close(() => process.exit(0));
});
