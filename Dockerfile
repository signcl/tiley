FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY . /app

RUN apk add --no-cache imagemagick \
    && rm -rf /var/cache/*

RUN yarn --frozen-lockfile && \
    yarn cache clean

EXPOSE 3004

CMD [ "node", "src/index.js" ]
