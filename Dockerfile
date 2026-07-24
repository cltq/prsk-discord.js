FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./
RUN apt-get update && apt-get install -y ffmpeg git && rm -rf /var/lib/apt/lists/*
RUN bun install --frozen-lockfile

COPY tsconfig.json tsconfig.bot.json next.config.mjs ./
COPY src ./src
COPY app ./app
RUN bun run build
RUN bunx next build

RUN rm -rf node_modules && bun install --frozen-lockfile --production

EXPOSE 3995

CMD ["sh", "-c", "bun run start & bunx next start --port 3995"]
