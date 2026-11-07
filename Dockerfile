FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
COPY scripts/boot-fail.mjs ./scripts/boot-fail.mjs
EXPOSE 4321
CMD ["sh", "-c", "echo HOST=$HOST PORT=$PORT > /tmp/boot.log; ls dist/server >> /tmp/boot.log 2>&1; node ./dist/server/entry.mjs >> /tmp/boot.log 2>&1 || node ./scripts/boot-fail.mjs"]
