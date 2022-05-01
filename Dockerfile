FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /home/node
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 9090
RUN chown -R node /home/node
USER node
CMD npm run build
CMD npm start
