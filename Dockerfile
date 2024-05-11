FROM docker.io/node:alpine
ENV NODE_ENV=production

WORKDIR /app
COPY --chown=node:node ["package.json", "walk.js", "./"]
RUN npm install
CMD [ "node", "walk.js" ]