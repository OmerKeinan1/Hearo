// Dev-server wrapper for Render — ngrok edition.
//
// Why not `expo start --tunnel`: Expo's built-in tunnel routes auth through
// EXPO_TOKEN → Expo API → ngrok, and that handoff failed inside Render with
// "bearer token invalid" against multiple known-good tokens. We bypass the
// whole layer and drive ngrok ourselves via the @ngrok/ngrok JS module with
// a user-controlled authtoken (NGROK_AUTHTOKEN env var).
//
// Boot order (important — Metro needs to know its public hostname BEFORE
// starting, otherwise it advertises localhost in manifests and Expo Go can't
// fetch bundles):
//
//   1. Open ngrok HTTP tunnel pointing at port 8081 → get public URL.
//   2. Spawn `expo start --port 8081` with REACT_NATIVE_PACKAGER_HOSTNAME
//      set to the ngrok host. Metro then puts that host in manifest URLs.
//   3. Compose exp://<ngrok-host> for the QR.

import { spawn } from "node:child_process";
import http from "node:http";
import ngrok from "@ngrok/ngrok";

const PORT = process.env.PORT || 3000;
const METRO_PORT = 8081;

let currentTunnelUrl = null;
let lastSeenAt = null;
let expoExitCode = null;
let ngrokError = null;
let expo = null;
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

function startExpo(packagerHostname) {
  // REACT_NATIVE_PACKAGER_HOSTNAME tells Metro which host to put in the
  // manifest URLs it serves. Without it Metro uses localhost, and Expo Go
  // fails to fetch the bundle (it'd try the phone's own localhost).
  // host_header rewrite on the ngrok side keeps Metro's Host check happy
  // when the inbound request arrives.
  console.log(`[dev-server] starting Metro with hostname=${packagerHostname}`);
  expo = spawn(
    "npx",
    ["expo", "start", "--port", String(METRO_PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: "1",
        REACT_NATIVE_PACKAGER_HOSTNAME: packagerHostname,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  expo.stdout.on("data", (buf) => record(buf.toString()));
  expo.stderr.on("data", (buf) => record(buf.toString()));
  expo.on("exit", (code) => {
    expoExitCode = code;
    console.error(`[dev-server] expo exited with code ${code} — wrapper stays up`);
  });
}

// Retry on ghost-session error (ERR_NGROK_334). Render's free tier kills
// containers without SIGTERM when sleeping, so previous sessions hang on
// the static ngrok domain until heartbeat reaps them (~60s).
const RETRY_DELAYS_MS = [10_000, 20_000, 30_000, 45_000, 60_000];

async function startNgrokWithRetry() {
  if (!process.env.NGROK_AUTHTOKEN) {
    ngrokError = "NGROK_AUTHTOKEN env var not set in Render";
    console.error(`[dev-server] ${ngrokError}`);
    return null;
  }

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const listener = await ngrok.connect({
        addr: METRO_PORT,
        authtoken: process.env.NGROK_AUTHTOKEN,
        proto: "http",
        // Rewrite the inbound Host header to localhost:8081 before
        // forwarding to Metro. Without this Metro receives Host:
        // <ngrok-domain> and may reject the request as a CSRF guard.
        host_header: "rewrite",
      });
      const publicUrl = listener.url();
      const host = new URL(publicUrl).host;
      publishUrl(`exp://${host}`);
      ngrokError = null;
      return host;
    } catch (err) {
      const msg = err?.message ?? String(err);
      const isGhostSession =
        msg.includes("ERR_NGROK_334") || msg.includes("already online");
      if (!isGhostSession || attempt === RETRY_DELAYS_MS.length) {
        ngrokError = msg;
        console.error(`[dev-server] ngrok failed (no retry): ${msg}`);
        return null;
      }
      const wait = RETRY_DELAYS_MS[attempt];
      ngrokError = `ghost session, retrying in ${wait / 1000}s (attempt ${attempt + 1})`;
      console.error(`[dev-server] ngrok ghost session, retrying in ${wait / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  return null;
}

// Bring up ngrok first, then start Metro with the right hostname env.
(async () => {
  const host = await startNgrokWithRetry();
  if (host) startExpo(host);
})();

// Tiny HTTP surface — / health, /tunnel for the Vercel poller, /diag for us.
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

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
  if (expo) expo.kill("SIGTERM");
  void ngrok.disconnect();
  server.close(() => process.exit(0));
});
