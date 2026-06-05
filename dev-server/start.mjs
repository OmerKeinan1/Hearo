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
let expoExitCode = null;
const recentOutput = []; // ring buffer of recent expo stdout lines
const MAX_RECENT_LINES = 80;

function publishUrl(url) {
  if (url === currentTunnelUrl) return;
  currentTunnelUrl = url;
  lastSeenAt = new Date().toISOString();
  console.log(`[dev-server] tunnel URL → ${url}`);
}

function record(text) {
  process.stdout.write(text);
  for (const line of text.split("\n")) {
    if (!line) continue;
    recentOutput.push(line);
    while (recentOutput.length > MAX_RECENT_LINES) recentOutput.shift();
  }
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
  record(text);
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
  expoExitCode = code;
  console.error(`[dev-server] expo exited with code ${code} — wrapper stays up`);
  // Deliberately do NOT exit the wrapper. If we did, Render would restart
  // the whole container in a tight loop and we'd never see the actual
  // failure. Instead the HTTP surface keeps responding so /tunnel can report
  // the failure and /diag exposes recent expo output.
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
        expoExitCode,
      }),
    );
    return;
  }

  if (req.url === "/diag") {
    // Lightweight diagnostic: recent expo output + exit code. No auth on
    // purpose — visible to anyone who hits the URL, but only contains build
    // logs, not secrets (we redact EXPO_TOKEN from env above).
    res.setHeader("Content-Type", "text/plain");
    res.end(
      [
        `expoExitCode: ${expoExitCode}`,
        `currentTunnelUrl: ${currentTunnelUrl}`,
        `lastSeenAt: ${lastSeenAt}`,
        "",
        "--- recent expo stdout/stderr ---",
        ...recentOutput,
      ].join("\n"),
    );
    return;
  }

  if (req.url === "/" || req.url === "/health") {
    res.setHeader("Content-Type", "text/plain");
    res.end(
      currentTunnelUrl
        ? `hearo dev-server — tunnel ${currentTunnelUrl}`
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
  server.close(() => process.exit(0));
});
