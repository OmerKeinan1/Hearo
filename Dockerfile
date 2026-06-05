# Image for the Render-hosted dev server.
#
# Boots Metro with `expo start --tunnel` and exposes a small HTTP surface
# (see dev-server/start.mjs) that publishes the current tunnel URL. The
# QR page at hearoapp.vercel.app polls it.

FROM node:22-bookworm-slim

WORKDIR /app

# Native deps Metro / Expo CLI poke at during install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    python3 \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy lockfile artifacts first so the layer caches across code-only changes.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Now the rest of the repo — expo start serves files from the project root.
COPY . .

# Render injects PORT; we honor it in start.mjs.
EXPOSE 3000

CMD ["node", "dev-server/start.mjs"]
