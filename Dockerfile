FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /home/node/dairs

RUN mkdir /home/node/dairs/conf
RUN mkdir /home/node/dairs/logs

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent
COPY . /home/node/dairs

RUN mkdir /home/node/dairs/src/db/backups
RUN chown -R node /home/node/dairs

EXPOSE 9090
USER node
RUN npm run build
CMD npm start
