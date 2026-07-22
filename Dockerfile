FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

RUN rm -rf node_modules && bun install --frozen-lockfile --production

EXPOSE 8899

CMD ["bun", "run", "start"]
