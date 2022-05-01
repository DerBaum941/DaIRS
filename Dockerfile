FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /home/node/dairs
RUN mkdir /home/node/dairs/conf
RUN mkdir /home/node/dairs/db
RUN mkdir /home/node/dairs/logs
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent
COPY . /home/node/dairs
EXPOSE 9090

RUN chown -R node /home/node/dairs
USER node
CMD npm run build
CMD npm start
