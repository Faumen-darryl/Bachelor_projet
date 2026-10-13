FROM node:20-alpine AS base

WORKDIR /app



# Dependencies

FROM base AS deps

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --workspace=apps/web



# Builder

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# IMPORTANT : récupérer aussi les modules propres au workspace
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=apps/web



# Runner

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "start"]