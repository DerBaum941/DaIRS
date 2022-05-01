#!/bin/bash

#Move Folder
cp -R ./* /var/www/dairs/
cd /var/www/dairs/
#Just incase
mkdir /var/www/dairs/conf
mkdir /var/www/dairs/logs
mkdir /var/www/dairs/src/db/backups

#Install Node
curl -fsSL https://deb.nodesource.com/setup_18.x
apt-get install -y nodejs
npm install -g npm@latest
apt install build-essential
npm install -g vite
npm install
#Build Site
npm run build
#Open Ports
ufw allow 9090
ufw allow 3000
#make executable
chmod +x /var/www/dairs/index.js
touch /etc/systemd/system/dairs.service
#install service
echo ExecStart=node /var/www/dairs/index.js > /etc/systemd/system/dairs.service
echo Restart=always >> /etc/systemd/system/dairs.service
echo User=nobody >> /etc/systemd/system/dairs.service
echo Group=nogroup >> /etc/systemd/system/dairs.service
echo Environment=PATH=/usr/bin:/usr/local/bin >> /etc/systemd/system/dairs.service
echo Environment=NODE_ENV=production >> /etc/systemd/system/dairs.service
echo WorkingDirectory=/var/www/dairs >> /etc/systemd/system/dairs.service
#start service
systemctl start dairs