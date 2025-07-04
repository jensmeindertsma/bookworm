FROM node:24.3.0-alpine AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN apk add build-base python3
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN pnpm prune --prod --no-optional

FROM base
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/prisma /app/prisma
COPY package.json ./scripts/start.sh ./

ENV NODE_ENV="production"
CMD ["sh", "./start.sh"]
