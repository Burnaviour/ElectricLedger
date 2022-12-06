#!/bin/bash
echo -e "\n"
echo "########################################### Network down  ##############################################"
sudo ./networkDown.sh
echo -e "\n"
echo "########################################### cleaning containers ##############################################"
docker system prune -f
docker volume prune -f
echo -e "\n"
echo "########################################### RUNNING FABRIC NETWORK ##############################################"
sudo ./startFabric.sh javascript
echo -e "\n"
cd ./javascript
echo -e "\n"
pwd
echo -e "\n"
echo "############################################## enrolling admin and users  ##############################################"
echo -e "\n"
node enrollAdmin.js
echo -e "\n"
node registerUser.js
echo -e "\n"
node prac.js
echo -e "\n"

