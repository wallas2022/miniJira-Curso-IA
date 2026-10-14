# syntax=docker/dockerfile:1

# --- deps: solo instala dependencias (capa cacheable mientras no cambie package-lock.json)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder: compila Next.js con output: 'standalone'
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# supabase.ts lanza al importarse si faltan estas variables y `next build` importa los routes.
# Placeholders solo para esta línea: no son secretos, no se persisten y la imagen final los recibe en runtime.
RUN SUPABASE_URL=http://build.invalid SUPABASE_SERVICE_ROLE_KEY=build-placeholder npm run build

# --- runner: imagen final, solo artefactos de standalone, usuario no-root
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
