FROM alpine
ENV NODE_ENV=production
WORKDIR /home/node/dairs

RUN apk add --update nodejs npm
RUN mkdir /home/node/dairs/conf
RUN mkdir /home/node/dairs/logs

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm ci
COPY . /home/node/dairs

RUN mkdir /home/node/dairs/src/db/backups
RUN chown -R node /home/node/dairs
RUN npm install -g vite

EXPOSE 9090
USER node
CMD npm run build && npm start
