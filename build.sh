#!/bin/bash
apt-get update
apt-get upgrade -y
#Move Folder
mkdir /var/www/dairs
cp -R ./* /var/www/dairs/
cd /var/www/dairs/
#Just incase
mkdir /var/www/dairs/conf
mkdir /var/www/dairs/logs
mkdir /var/www/dairs/src/db/backups

#Install Node
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs
npm install -g npm@latest
apt install build-essential
npm install -g vite
npm install
#Build Site
npm run build
#Open Ports
#ufw allow 9090
#ufw allow 3000

#add service user
useradd dairs
groupadd node
chown -R dairs:node /var/www/dairs
#make executable
chmod +x /var/www/dairs/index.js
touch /etc/systemd/system/dairs.service
#install service
echo "[Unit]" > /etc/systemd/system/dairs.service
echo "Description=DaIRS Twitch Bot" >> /etc/systemd/system/dairs.service
echo "After=network.target" >> /etc/systemd/system/dairs.service
echo "[Service]" >> /etc/systemd/system/dairs.service
echo "Type=simple" >> /etc/systemd/system/dairs.service
echo "ExecStartPre=/bin/bash -c 'vite build /var/www/dairs/src/www/react -l info -d true --emptyOutDir --outDir /var/www/dairs/src/www/static'" >> /etc/systemd/system/dairs.service
echo "ExecStart=/bin/bash -c 'node /var/www/dairs/index.js'" >> /etc/systemd/system/dairs.service
echo "Restart=always" >> /etc/systemd/system/dairs.service
echo "User=dairs" >> /etc/systemd/system/dairs.service
echo "Group=node" >> /etc/systemd/system/dairs.service
echo "Environment=PATH=/usr/bin:/usr/local/bin" >> /etc/systemd/system/dairs.service
echo "Environment=NODE_ENV=production" >> /etc/systemd/system/dairs.service
echo "WorkingDirectory=/var/www/dairs" >> /etc/systemd/system/dairs.service
echo "[Install]" >> /etc/systemd/system/dairs.service
echo "WantedBy=multi-user.target" >> /etc/systemd/system/dairs.service
#start service
systemctl daemon-reload
systemctl enable dairs
systemctl start dairs