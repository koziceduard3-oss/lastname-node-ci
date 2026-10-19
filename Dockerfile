FROM node:lts

WORKDIR /app

# Copy package metadata first so dependency installation can use Docker's layer cache.
COPY package*.json ./
RUN npm install --omit=dev

COPY --chown=node:node . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "index.js"]
