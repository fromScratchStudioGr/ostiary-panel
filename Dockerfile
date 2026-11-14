# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# The release this image was built from, such as 1.2.3. The image workflow
# passes it from the version tag; local builds say "dev".
ARG VERSION=dev
ENV VERSION=$VERSION

# ADMIN_API_URL (the admin API's address as the browser reaches it) is read
# while the container runs; it defaults to http://localhost:8081.

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# output: "standalone" (next.config.ts) traces only the node_modules this
# app actually needs into .next/standalone, including a minimal server.js -
# public/ and .next/static aren't part of that trace and need copying by hand.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
