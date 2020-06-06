FROM node:14-alpine

WORKDIR /usr/src/app

COPY index.js config.default.js package.json package-lock.json ./

RUN apk add --no-cache --update && npm install

CMD ["npm", "start"]  
