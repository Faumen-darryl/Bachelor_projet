FROM node:20-alpine AS base

WORKDIR /app

# Installe les dépendances nécessaires à l'API.
FROM base AS deps

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api

# Génère Prisma puis compile l'API.
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# Prépare l'image utilisée en production.
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 4000

CMD ["node", "dist/index.js"]