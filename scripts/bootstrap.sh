#!/bin/bash

# for instance ID ami-0323c3dd2da7fb37d

yum install -y git docker
service docker start
docker pull ruby

git clone https://github.com/caspian311/swgoh-app.git /root/swgoh-app
docker run --rm -v /root/swgoh-app:/app -p 4567:4567 ruby /app/startup.sh