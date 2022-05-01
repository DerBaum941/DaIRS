FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /home/node/dairs
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent
COPY . /home/node/dairs
EXPOSE 9090
CMD mkdir /home/node/dairs/conf
CMD mkdir /home/node/dairs/db
CMD mkdir /home/node/dairs/logs
RUN chown -R node /home/node/dairs
USER node
CMD npm run build
CMD npm start
