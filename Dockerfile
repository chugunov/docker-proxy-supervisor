FROM node:14-alpine

ENV PROXY_PORT=9999 PROXY_PATH=.

WORKDIR /usr/src/app

COPY index.js config.default.js package.json package-lock.json ./

RUN apk add --no-cache --update && npm install

CMD ["npm", "start"]  
