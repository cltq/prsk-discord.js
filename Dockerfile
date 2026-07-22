FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

EXPOSE 8899

CMD ["bun", "run", "start"]
