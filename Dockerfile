FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

EXPOSE 8899

CMD ["node", "dist/index.js"]
