FROM alpine
ENV NODE_ENV=production
WORKDIR /home/node/dairs

RUN apk add --update nodejs npm
RUN mkdir /home/node/dairs/conf
RUN mkdir /home/node/dairs/logs

COPY ["package.json", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent
COPY . /home/node/dairs

RUN mkdir /home/node/dairs/src/db/backups
RUN adduser node -D
RUN chown -R node /home/node/dairs
RUN npm install -g vite

EXPOSE 9090
USER node
CMD npm run build && npm start
