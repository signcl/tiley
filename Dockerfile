FROM oven/bun:1.4.2-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache imagemagick imagemagick-jpeg

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src

USER bun

EXPOSE 3004

CMD [ "bun", "src/index.ts" ]
