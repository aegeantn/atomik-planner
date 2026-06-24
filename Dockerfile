# ────────────────────────────────────────────────────────────
# Stage 1: React uygulamasını derle
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app/client

# Önce sadece package dosyalarını kopyala → Docker layer cache'i kullanır
COPY client/package*.json ./
RUN npm install

# Kaynak kodunu kopyala ve derle
COPY client/ ./
RUN npm run build
# Çıktı: /app/client/dist/


# ────────────────────────────────────────────────────────────
# Stage 2: Production image
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Sadece production bağımlılıklarını kur (dev tools gelmesin)
COPY package*.json ./
RUN npm install --omit=dev

# Sunucu kodunu kopyala
COPY server/ ./server/

# React build çıktısını Stage 1'den al
COPY --from=builder /app/client/dist ./client/dist

# SQLite ve token dosyasının yazılacağı dizin
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
