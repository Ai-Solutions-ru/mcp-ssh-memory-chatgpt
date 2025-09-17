FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY README.md ./
COPY .env.example ./

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

RUN mkdir -p "$DATA_DIR"
VOLUME ["/data"]

EXPOSE 8080

CMD ["node", "src/index.js"]
