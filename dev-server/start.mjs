// Dev-server wrapper for Render.
//
// We can't just run `npx expo start --tunnel` directly on Render because we
// also need a small HTTP surface that publishes the current tunnel URL — the
// page at hearoapp.vercel.app polls it to render the QR. So this script
// spawns Metro as a child process, scrapes its stdout for the tunnel URL,
// and exposes it on `/tunnel` via a minimal HTTP server.

import { spawn } from "node:child_process";
import http from "node:http";

const PORT = process.env.PORT || 3000;

let currentTunnelUrl = null;
let lastSeenAt = null;

function publishUrl(url) {
  if (url === currentTunnelUrl) return;
  currentTunnelUrl = url;
  lastSeenAt = new Date().toISOString();
  console.log(`[dev-server] tunnel URL → ${url}`);
}

// Spawn `expo start --tunnel`. Inherit env so EXPO_TOKEN (set in Render's
// dashboard) reaches the CLI for tunnel authentication.
const expo = spawn(
  "npx",
  ["expo", "start", "--tunnel", "--non-interactive"],
  {
    cwd: process.cwd(),
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

function scrape(buf) {
  const text = buf.toString();
  process.stdout.write(text);
  // `expo start --tunnel` prints URLs like:
  //   exp://abc-xyz.tunnel.expo.dev:80
  //   exp+hearo://expo-development-client/?url=https%3A%2F%2Fabc.ngrok.io
  // Match the canonical exp:// form (Expo Go scans this).
  const match = text.match(/exp:\/\/[a-zA-Z0-9._\-/:?=&%]+/);
  if (match) publishUrl(match[0]);
}

expo.stdout.on("data", scrape);
expo.stderr.on("data", scrape);
expo.on("exit", (code) => {
  console.error(`[dev-server] expo exited with code ${code}`);
  // Render will auto-restart the service.
  process.exit(code ?? 1);
});

// Tiny HTTP surface — just one endpoint plus a health check.
const server = http.createServer((req, res) => {
  // CORS: hearoapp.vercel.app needs to fetch this from a different origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  if (req.url === "/tunnel") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ready: !!currentTunnelUrl,
        url: currentTunnelUrl,
        updatedAt: lastSeenAt,
      }),
    );
    return;
  }

  if (req.url === "/" || req.url === "/health") {
    res.setHeader("Content-Type", "text/plain");
    res.end(`hearo dev-server — tunnel ${currentTunnelUrl ?? "warming up"}`);
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
  server.close(() => process.exit(0));
});
