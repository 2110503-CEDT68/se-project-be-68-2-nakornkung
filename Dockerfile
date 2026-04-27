ARG NODE_VERSION=iron-slim

# build
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# runtime
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

COPY --from=builder app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE ${PORT}

CMD ["npm", "start"]
