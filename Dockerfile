FROM keymetrics/pm2:latest-alpine

WORKDIR /source

ARG ENV
ARG APP
ENV ENV=$ENV
ENV APP=$APP

COPY src ./src
COPY pm2.json package.json package-lock.json ./

RUN npm i --silent --production

CMD pm2-runtime start pm2.json --env $ENV
