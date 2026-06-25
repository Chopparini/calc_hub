FROM node:20-slim

WORKDIR /app

COPY shared/ ./shared/
COPY pwa/package*.json ./pwa/
RUN cd pwa && npm install

COPY pwa/ ./pwa/

WORKDIR /app/pwa

CMD ["npm", "run", "dev"]
