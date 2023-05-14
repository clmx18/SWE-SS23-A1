# syntax=docker/dockerfile:1.5.2

# Aufruf:   docker buildx build --tag swe-gruppe-1/film:2023.4.0 .
#           ggf. --no-cache
#           Get-Content Dockerfile | docker run --rm --interactive hadolint/hadolint:2.12.1-beta-debian
#           docker network ls

# ---------------------------------------------------------------------------------------
# S t a g e :   b u i l d e r
# ---------------------------------------------------------------------------------------
ARG NODE_VERSION=19.8.1
FROM node:${NODE_VERSION}-bullseye AS builder

WORKDIR /app

COPY package.json ./package.json.ORIG
COPY .env .npmrc nest-cli.json tsconfig*.json ./
COPY src ./src

# npm ci liest "dependencies" aus package-lock.json
# "here document" wie in einem Shellscipt
RUN <<EOF
set -ex
npm i -g --no-audit npm
npm i -g --no-audit @nestjs/cli rimraf
grep -v \"ts-jest\": package.json.ORIG | grep -v \"ts-node\": - | grep -v \"typedoc\": - > package.json
npm i --no-audit
npm run build
EOF

CMD ["npm", "start"]

# ------------------------------------------------------------------------------
# S t a g e   2
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bullseye-slim

WORKDIR /opt/app

ARG NODE_ENV=production

# https://unix.stackexchange.com/questions/217369/clear-apt-get-list
# https://packages.debian.org/bullseye/python3
RUN set -ex \
    && apt-get update \
    && apt-get install --no-install-recommends --yes python3-minimal \
    && rm -rf /var/lib/apt/lists/* \
    && npm i -g --no-audit npm \
    && npm i -g --no-audit @nestjs/cli rimraf \
    && npm i -g --no-audit node-gyp

RUN <<EOF
set -ex
groupadd --gid 10000 app
useradd --uid 10000 --gid app --create-home --shell /bin/bash app
EOF

COPY --from=builder --chown=app:app /app/package.json /app/.env /app/.npmrc /app/nest-cli.json ./
COPY --from=builder --chown=app:app /app/dist ./dist
#COPY --from=builder --chown=app:app /app/src/film/graphql/schema.graphql ./dist/film/graphql/
#COPY --from=builder --chown=app:app /app/src/security/auth/login.graphql ./dist/security/auth/
COPY --from=builder --chown=app:app /app/src/config/dev/postgres ./dist/config/dev/postgres
COPY --from=builder --chown=app:app /app/src/config/jwt ./dist/config/jwt
COPY --from=builder --chown=app:app /app/src/config/tls ./dist/config/tls

RUN <<EOF
set -ex
npm i --omit dev --no-audit
npm prune --no-audit
npm r -g --no-audit node-gyp
EOF

USER app
EXPOSE 3000

CMD ["node", "dist/main.js"]
