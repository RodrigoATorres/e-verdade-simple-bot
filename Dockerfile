FROM node:latest

WORKDIR /usr/src/app
COPY . .

#Install Cron
RUN apt-get update

RUN rm -rf node_modules
RUN npm install
RUN npm install pm2 -g

CMD ["pm2-runtime", "./src/app.js"]